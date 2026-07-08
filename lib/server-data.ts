import { prisma } from "@/lib/prisma";
import { initialDepartments, initialRequests, initialStaff } from "@/lib/sample-data";
import type { Department, ITRequest, ITStaff, RequestHistory } from "@/lib/types";

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
};

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
    rating: request.rating as ITRequest["rating"],
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    history: request.statusHistory.map(serializeHistory)
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

export async function getAppState() {
  await ensureSeedData();

  const [departments, staff, requests] = await Promise.all([
    prisma.department.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.iTStaff.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.request.findMany({
      include: {
        statusHistory: {
          orderBy: { changedAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    departments: departments.map(serializeDepartment),
    staff: staff.map(serializeStaff),
    requests: requests.map((request) => serializeRequest(request as RequestRecord)),
    activeDepartmentId: departments[0]?.id ?? ""
  };
}
