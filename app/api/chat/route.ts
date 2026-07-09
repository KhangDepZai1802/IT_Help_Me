import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatRetentionCutoffDate, serializeChatMessage } from "@/lib/server-data";

type ChatPostBody = {
  departmentId?: string;
  content?: string;
};

type ChatPatchBody = {
  departmentId?: string;
};

type ChatDeleteBody = {
  messageId?: string;
};

type ChatMessageRecord = {
  id: string;
  departmentId: string;
  senderRole: "DEPARTMENT" | "IT";
  senderName: string;
  content: string;
  sentAt: Date;
  readAt: Date | null;
};

type ChatMessageDelegate = {
  create: (args: {
    data: {
      departmentId: string;
      senderRole: "DEPARTMENT" | "IT";
      senderName: string;
      content: string;
    };
  }) => Promise<ChatMessageRecord>;
  updateMany: (args: {
    where: {
      departmentId: string;
      senderRole: "DEPARTMENT" | "IT";
      readAt: null;
    };
    data: {
      readAt: Date;
    };
  }) => Promise<{ count: number }>;
  deleteMany: (args: { where: { sentAt: { lt: Date } } }) => Promise<{ count: number }>;
};

function oppositeRole(role: "DEPARTMENT" | "IT") {
  return role === "IT" ? "DEPARTMENT" : "IT";
}

async function resolveDepartmentId(sessionRole: "DEPARTMENT" | "IT", sessionDepartmentId: string | null, requestedDepartmentId?: string) {
  if (sessionRole === "DEPARTMENT") return sessionDepartmentId;
  return requestedDepartmentId;
}

function chatMessageDelegate() {
  return (prisma as typeof prisma & { chatMessage?: ChatMessageDelegate }).chatMessage;
}

async function cleanupExpiredChatMessages() {
  const cutoff = chatRetentionCutoffDate();
  const delegate = chatMessageDelegate();
  if (delegate) {
    await delegate.deleteMany({ where: { sentAt: { lt: cutoff } } });
    return;
  }

  await prisma.$executeRawUnsafe(`DELETE FROM "ChatMessage" WHERE "sentAt" < $1`, cutoff);
}

async function createChatMessage(data: {
  departmentId: string;
  senderRole: "DEPARTMENT" | "IT";
  senderName: string;
  content: string;
}) {
  const delegate = chatMessageDelegate();
  if (delegate) return delegate.create({ data });

  const rows = await prisma.$queryRawUnsafe<ChatMessageRecord[]>(
    `INSERT INTO "ChatMessage" ("id", "departmentId", "senderRole", "senderName", "content", "sentAt")
     VALUES ($1, $2, $3::"AccountRole", $4, $5, NOW())
     RETURNING "id", "departmentId", "senderRole", "senderName", "content", "sentAt", "readAt"`,
    randomUUID(),
    data.departmentId,
    data.senderRole,
    data.senderName,
    data.content
  );

  if (!rows[0]) throw new Error("Chat insert did not return a message.");
  return rows[0];
}

async function markThreadAsRead(departmentId: string, senderRole: "DEPARTMENT" | "IT") {
  const delegate = chatMessageDelegate();
  if (delegate) {
    return delegate.updateMany({
      where: {
        departmentId,
        senderRole,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  }

  const count = await prisma.$executeRawUnsafe(
    `UPDATE "ChatMessage"
     SET "readAt" = NOW()
     WHERE "departmentId" = $1 AND "senderRole" = $2::"AccountRole" AND "readAt" IS NULL`,
    departmentId,
    senderRole
  );

  return { count };
}

async function recallChatMessage(messageId: string, role: "DEPARTMENT" | "IT", departmentId: string | null) {
  const rows = await prisma.$queryRawUnsafe<ChatMessageRecord[]>(
    `DELETE FROM "ChatMessage"
     WHERE "id" = $1
       AND "senderRole" = $2::"AccountRole"
       AND ($3::text IS NULL OR "departmentId" = $3)
     RETURNING "id", "departmentId", "senderRole", "senderName", "content", "sentAt", "readAt"`,
    messageId,
    role,
    departmentId
  );

  return rows[0] ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();
    await cleanupExpiredChatMessages();

    const body = (await request.json()) as ChatPostBody;
    const content = body.content?.trim() ?? "";
    const departmentId = await resolveDepartmentId(session.role, session.departmentId, body.departmentId);

    if (!departmentId || !content) {
      return NextResponse.json({ error: "Vui lòng chọn phòng ban và nhập nội dung tin nhắn." }, { status: 400 });
    }

    if (session.role === "DEPARTMENT" && session.departmentId !== departmentId) {
      return forbidden();
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department?.isActive) {
      return NextResponse.json({ error: "Phòng ban này chưa được kích hoạt." }, { status: 404 });
    }

    const message = await createChatMessage({
      departmentId,
      senderRole: session.role,
      senderName: session.role === "IT" ? "Phòng IT" : department.name,
      content
    });

    return NextResponse.json(serializeChatMessage(message));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể gửi tin nhắn." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();
    await cleanupExpiredChatMessages();

    const body = (await request.json()) as ChatPatchBody;
    const departmentId = await resolveDepartmentId(session.role, session.departmentId, body.departmentId);

    if (!departmentId) {
      return NextResponse.json({ error: "Vui lòng chọn cuộc trò chuyện." }, { status: 400 });
    }

    if (session.role === "DEPARTMENT" && session.departmentId !== departmentId) {
      return forbidden();
    }

    const updated = await markThreadAsRead(departmentId, oppositeRole(session.role));

    return NextResponse.json({ ok: true, count: updated.count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể cập nhật trạng thái tin nhắn." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();

    const body = (await request.json()) as ChatDeleteBody;
    const messageId = body.messageId?.trim() ?? "";
    if (!messageId) {
      return NextResponse.json({ error: "Vui lòng chọn tin nhắn cần thu hồi." }, { status: 400 });
    }

    const recalled = await recallChatMessage(messageId, session.role, session.role === "DEPARTMENT" ? session.departmentId : null);
    if (!recalled) {
      return NextResponse.json({ error: "Bạn chỉ có thể thu hồi tin nhắn của mình." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, id: recalled.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể thu hồi tin nhắn." }, { status: 500 });
  }
}
