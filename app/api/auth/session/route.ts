import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, publicSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSeedData, serializeDepartment } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    });
    const session = getAuthSession(request);

    return NextResponse.json({
      session: session ? publicSession(session) : null,
      departments: departments.map(serializeDepartment)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể kiểm tra phiên đăng nhập." }, { status: 500 });
  }
}
