import { prisma } from "@/lib/prisma";
import { initialDepartments, initialRequests, initialStaff } from "@/lib/sample-data";
import type { AuthSession } from "@/lib/auth";
import type { ChatMessage, Department, ITRequest, ITStaff, RequestHistory } from "@/lib/types";

type RequestRecord = {
  id: string;
  departmentId: string;
  requesterName: string;
  content: string;
  priority: ITRequest["priority"];
  status: ITRequest["status"];
  assignedToId: string | null;
  resolutionNote: string | null;
  attachmentName: string;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: {
    id: string;
    requestId: string;
    oldStatus: ITRequest["status"] | null;
    newStatus: ITRequest["status"];
    changedById: string | null;
    note: string | null;
    changedAt: Date;
  }[];
  attachments?: {
    fileUrl: string;
    fileName: string;
  }[];
};

type ChatMessageRecord = {
  id: string;
  departmentId: string;
  senderRole: ChatMessage["senderRole"];
  senderName: string;
  content: string;
  sentAt: Date;
  readAt: Date | null;
};

export function chatRetentionCutoffDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export function serializeDepartment(department: Department): Department {
  return {
    id: department.id,
    name: department.name,
    isActive: department.isActive
  };
}

export function serializeStaff(member: ITStaff): ITStaff {
  return {
    id: member.id,
    fullName: member.fullName,
    isActive: member.isActive
  };
}

export function serializeRequest(request: RequestRecord): ITRequest {
  return {
    id: request.id,
    departmentId: request.departmentId,
    requesterName: request.requesterName,
    content: request.content,
    priority: request.priority,
    status: request.status,
    assignedToId: request.assignedToId,
    resolutionNote: request.resolutionNote ?? "",
    attachmentName: request.attachmentName,
    attachmentUrl: request.attachments?.[0]?.fileUrl ?? "",
    rating: request.rating as ITRequest["rating"],
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    history: request.statusHistory.map(serializeHistory)
  };
}

export function serializeChatMessage(message: ChatMessageRecord): ChatMessage {
  return {
    id: message.id,
    departmentId: message.departmentId,
    senderRole: message.senderRole,
    senderName: message.senderName,
    content: message.content,
    sentAt: message.sentAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
    isRead: Boolean(message.readAt)
  };
}

function serializeHistory(history: RequestRecord["statusHistory"][number]): RequestHistory {
  return {
    id: history.id,
    requestId: history.requestId,
    oldStatus: history.oldStatus,
    newStatus: history.newStatus,
    changedById: history.changedById,
    note: history.note ?? "",
    changedAt: history.changedAt.toISOString()
  };
}

export async function ensureSeedData() {
  const departmentCount = await prisma.department.count();
  if (departmentCount > 0) return;

  await prisma.$transaction(async (tx: any) => {
    for (const department of initialDepartments) {
      await tx.department.create({
        data: {
          id: department.id,
          name: department.name,
          isActive: department.isActive
        }
      });
    }

    for (const member of initialStaff) {
      await tx.iTStaff.create({
        data: {
          id: member.id,
          fullName: member.fullName,
          isActive: member.isActive
        }
      });
    }

    for (const request of initialRequests) {
      await tx.request.create({
        data: {
          id: request.id,
          departmentId: request.departmentId,
          requesterName: request.requesterName,
          content: request.content,
          priority: request.priority,
          status: request.status,
          assignedToId: request.assignedToId,
          resolutionNote: request.resolutionNote,
          attachmentName: request.attachmentName,
          rating: request.rating ?? null,
          createdAt: new Date(request.createdAt),
          updatedAt: new Date(request.updatedAt),
          statusHistory: {
            create: request.history.map((history) => ({
              id: history.id,
              oldStatus: history.oldStatus,
              newStatus: history.newStatus,
              changedById: history.changedById,
              note: history.note,
              changedAt: new Date(history.changedAt)
            }))
          }
        }
      });
    }
  });
}

export async function getAppState(session?: AuthSession) {
  await ensureSeedData();

  const requestWhere = session?.role === "DEPARTMENT" ? { departmentId: session.departmentId ?? "" } : undefined;
  const chatRetentionCutoff = chatRetentionCutoffDate();
  const chatWhere =
    session?.role === "DEPARTMENT"
      ? { departmentId: session.departmentId ?? "", sentAt: { gte: chatRetentionCutoff } }
      : { sentAt: { gte: chatRetentionCutoff } };
  const chatMessageModel = (prisma as typeof prisma & {
    chatMessage?: {
      findMany: (args: {
        where: typeof chatWhere;
        orderBy: { sentAt: "asc" };
      }) => Promise<unknown[]>;
      deleteMany: (args: { where: { sentAt: { lt: Date } } }) => Promise<{ count: number }>;
    };
  }).chatMessage;

  if (session && chatMessageModel) {
    await chatMessageModel.deleteMany({ where: { sentAt: { lt: chatRetentionCutoff } } }).catch((error) => {
      console.error("Could not clean up old chat messages.", error);
    });
  }

  const chatMessagesQuery =
    session && chatMessageModel
      ? chatMessageModel
          .findMany({
            where: chatWhere,
            orderBy: { sentAt: "asc" }
          })
          .catch((error) => {
            console.error("Could not load chat messages.", error);
            return [];
          })
      : Promise.resolve([]);

  const [departments, staff, requests, chatMessages] = await Promise.all([
    prisma.department.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.iTStaff.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.request.findMany({
      where: requestWhere,
      include: {
        attachments: {
          orderBy: { uploadedAt: "desc" },
          take: 1
        },
        statusHistory: {
          orderBy: { changedAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    chatMessagesQuery
  ]);

  const serializedChatMessages = chatMessages.map((message) => serializeChatMessage(message as ChatMessageRecord));
  const chatUnreadByDepartment = serializedChatMessages.reduce<Record<string, number>>((accumulator, message) => {
    if (session && !message.isRead && message.senderRole !== session.role) {
      accumulator[message.departmentId] = (accumulator[message.departmentId] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  return {
    departments: departments.map(serializeDepartment),
    staff: staff.map(serializeStaff),
    requests: requests.map((request) => serializeRequest(request as RequestRecord)),
    chatMessages: serializedChatMessages,
    chatUnreadCount: session
      ? serializedChatMessages.filter((message) => !message.isRead && message.senderRole !== session.role).length
      : 0,
    chatUnreadByDepartment,
    activeDepartmentId: session?.role === "DEPARTMENT" ? session.departmentId ?? "" : departments.find((department) => department.isActive)?.id ?? ""
  };
}
