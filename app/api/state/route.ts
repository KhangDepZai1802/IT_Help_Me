import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getAppState, serializeDepartment } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      const departments = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" }
      });

      return NextResponse.json({
        departments: departments.map(serializeDepartment),
        staff: [],
        requests: [],
        activeDepartmentId: departments[0]?.id ?? ""
      });
    }

    return NextResponse.json(await getAppState(session));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể tải dữ liệu từ database." }, { status: 500 });
  }
}
