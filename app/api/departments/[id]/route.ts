import { NextRequest, NextResponse } from "next/server";
import { forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();
    if (session.role !== "IT") return forbidden();

    const { id } = await params;
    const activeDepartmentCount = await prisma.department.count({ where: { isActive: true } });
    if (activeDepartmentCount <= 1) {
      return NextResponse.json({ error: "Can giu lai it nhat 1 phong ban dang hoat dong." }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.account.deleteMany({ where: { role: "DEPARTMENT", departmentId: id } }),
      prisma.department.update({
        where: { id },
        data: { isActive: false }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Khong the xoa phong ban." }, { status: 500 });
  }
}
