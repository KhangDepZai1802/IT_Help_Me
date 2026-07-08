import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDepartment } from "@/lib/server-data";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { id: string; name: string };
    const department = await prisma.department.create({
      data: {
        id: body.id,
        name: body.name,
        isActive: true
      }
    });

    return NextResponse.json(serializeDepartment(department));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể thêm phòng ban." }, { status: 500 });
  }
}
