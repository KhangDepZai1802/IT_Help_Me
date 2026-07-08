import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeRequest } from "@/lib/server-data";
import type { Rating, RequestStatus } from "@/lib/types";

type UpdateRequestBody = {
  status?: RequestStatus;
  assignedToId?: string | null;
  resolutionNote?: string;
  rating?: Rating;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateRequestBody;
    const current = await prisma.request.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu." }, { status: 404 });
    }

    const changedAt = new Date();
    const statusChanged = Boolean(body.status && body.status !== current.status);

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: body.status ?? current.status,
        assignedToId: body.assignedToId === undefined ? current.assignedToId : body.assignedToId,
        resolutionNote: body.resolutionNote === undefined ? current.resolutionNote : body.resolutionNote,
        rating: body.rating === undefined ? current.rating : body.rating,
        updatedAt: changedAt,
        statusHistory: statusChanged
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
