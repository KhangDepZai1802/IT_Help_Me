import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.$transaction([
      prisma.request.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null }
      }),
      prisma.iTStaff.delete({ where: { id } })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể xóa nhân viên IT." }, { status: 500 });
  }
}
