import { NextRequest, NextResponse } from "next/server";
import { canAccessDepartment, forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeRequest } from "@/lib/server-data";
import { deleteStorageObject } from "@/lib/storage";
import type { Rating, RequestStatus } from "@/lib/types";

type UpdateRequestBody = {
  status?: RequestStatus;
  assignedToId?: string | null;
  resolutionNote?: string;
  rating?: Rating;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();

    const { id } = await params;
    const body = (await request.json()) as UpdateRequestBody;
    const current = await prisma.request.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu." }, { status: 404 });
    }

    if (!canAccessDepartment(session, current.departmentId)) {
      return forbidden();
    }

    if (session.role === "DEPARTMENT") {
      const onlyRating =
        body.rating !== undefined && body.status === undefined && body.assignedToId === undefined && body.resolutionNote === undefined;
      if (!onlyRating || current.status !== "DONE") return forbidden();
    }

    const changedAt = new Date();
    const statusChanged = Boolean(body.status && body.status !== current.status);

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: session.role === "IT" ? body.status ?? current.status : current.status,
        assignedToId: session.role === "IT" ? body.assignedToId === undefined ? current.assignedToId : body.assignedToId : current.assignedToId,
        resolutionNote: session.role === "IT" ? body.resolutionNote === undefined ? current.resolutionNote : body.resolutionNote : current.resolutionNote,
        rating: body.rating === undefined ? current.rating : body.rating,
        updatedAt: changedAt,
        statusHistory:
          session.role === "IT" && statusChanged
            ? {
                create: {
                  id: `${id}-history-${changedAt.toISOString()}`,
                  oldStatus: current.status,
                  newStatus: body.status as RequestStatus,
                  changedById: body.assignedToId ?? current.assignedToId,
                  note: body.resolutionNote || "Cập nhật trạng thái",
                  changedAt
                }
              }
            : undefined
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

    return NextResponse.json(serializeRequest(updated as Parameters<typeof serializeRequest>[0]));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể cập nhật yêu cầu." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();
    if (session.role !== "IT") return forbidden();

    const { id } = await params;
    const attachments = await prisma.requestAttachment.findMany({
      where: { requestId: id },
      select: { fileUrl: true }
    });

    await Promise.all(attachments.map((attachment) => deleteStorageObject(attachment.fileUrl).catch((error) => console.warn(error))));

    await prisma.$transaction([
      prisma.requestStatusHistory.deleteMany({ where: { requestId: id } }),
      prisma.requestAttachment.deleteMany({ where: { requestId: id } }),
      prisma.request.delete({ where: { id } })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể xóa yêu cầu." }, { status: 500 });
  }
}
