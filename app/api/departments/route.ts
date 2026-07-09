import { NextRequest, NextResponse } from "next/server";
import { forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDepartment } from "@/lib/server-data";

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();
    if (session.role !== "IT") return forbidden();

    const body = (await request.json()) as { id: string; name: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Ten phong ban khong hop le." }, { status: 400 });
    }

    const existingDepartment = await prisma.department.findUnique({ where: { name } });
    if (existingDepartment?.isActive) {
      return NextResponse.json({ error: "Phong ban nay da ton tai." }, { status: 409 });
    }

    const department = existingDepartment
      ? await prisma.department.update({
          where: { id: existingDepartment.id },
          data: { isActive: true }
        })
      : await prisma.department.create({
      data: {
        id: body.id,
        name,
        isActive: true
      }
    });

    return NextResponse.json(serializeDepartment(department));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể thêm phòng ban." }, { status: 500 });
  }
}
