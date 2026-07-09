import { NextRequest, NextResponse } from "next/server";
import { canAccessDepartment, getAuthSession, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeRequest } from "@/lib/server-data";
import type { ITRequest } from "@/lib/types";

type CreateRequestBody = Pick<
  ITRequest,
  "id" | "departmentId" | "requesterName" | "content" | "priority" | "attachmentName" | "createdAt" | "updatedAt"
> & {
  attachmentUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();

    const body = (await request.json()) as CreateRequestBody;
    const createdAt = new Date(body.createdAt);
    const departmentId = session.role === "DEPARTMENT" ? session.departmentId : body.departmentId;

    if (!departmentId || !canAccessDepartment(session, departmentId)) {
      return forbidden();
    }

    const created = await prisma.request.create({
      data: {
        id: body.id,
        departmentId,
        requesterName: body.requesterName,
        content: body.content,
        priority: body.priority,
        status: "NEW",
        resolutionNote: "",
        attachmentName: body.attachmentName,
        createdAt,
        updatedAt: new Date(body.updatedAt),
        attachments:
          "attachmentUrl" in body && typeof body.attachmentUrl === "string" && body.attachmentUrl
            ? {
                create: {
                  fileName: body.attachmentName,
                  fileUrl: body.attachmentUrl
                }
              }
            : undefined,
        statusHistory: {
          create: {
            id: `${body.id}-history-new`,
            oldStatus: null,
            newStatus: "NEW",
            changedById: null,
            note: "Tạo yêu cầu",
            changedAt: createdAt
          }
        }
      },
      include: {
        attachments: {
          orderBy: { uploadedAt: "desc" },
          take: 1
        },
        statusHistory: {
          orderBy: { changedAt: "desc" }
        }
      }
    });

    return NextResponse.json(serializeRequest(created as Parameters<typeof serializeRequest>[0]));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể tạo yêu cầu." }, { status: 500 });
  }
}
