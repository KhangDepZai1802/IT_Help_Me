import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeStaff } from "@/lib/server-data";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { id: string; fullName: string };
    const member = await prisma.iTStaff.create({
      data: {
        id: body.id,
        fullName: body.fullName,
        isActive: true
      }
    });

    return NextResponse.json(serializeStaff(member));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể thêm nhân viên IT." }, { status: 500 });
  }
}
