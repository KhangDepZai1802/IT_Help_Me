import { NextRequest, NextResponse } from "next/server";
import { publicSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppState } from "@/lib/server-data";
import type { Role } from "@/lib/types";

type LoginBody = {
  role: Role;
  departmentId?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const password = body.password?.trim() ?? "";

    if (body.role === "DEPARTMENT") {
      if (!body.departmentId) {
        return NextResponse.json({ error: "Vui lòng chọn phòng ban." }, { status: 400 });
      }

      const department = await prisma.department.findUnique({ where: { id: body.departmentId } });
      if (!department?.isActive) {
        return NextResponse.json({ error: "Phòng ban này chưa được kích hoạt." }, { status: 403 });
      }

      const session = {
        accountId: `department:${department.id}`,
        username: department.id,
        role: "DEPARTMENT" as const,
        departmentId: department.id
      };
      const sessionForState = { ...session, expiresAt: Date.now() + 1 };
      const response = NextResponse.json({
        session: publicSession(sessionForState),
        state: await getAppState(sessionForState)
      });

      setSessionCookie(response, session);
      return response;
    }

    if (body.role !== "IT") {
      return NextResponse.json({ error: "Vai trò đăng nhập không hợp lệ." }, { status: 400 });
    }

    const itPassword = process.env.IT_PASSWORD || "123456";
    if (!password || password !== itPassword) {
      return NextResponse.json({ error: "Mật khẩu phòng IT không đúng." }, { status: 401 });
    }

    const session = {
      accountId: "it",
      username: "it",
      role: "IT" as const,
      departmentId: null
    };
    const sessionForState = { ...session, expiresAt: Date.now() + 1 };
    const response = NextResponse.json({
      session: publicSession(sessionForState),
      state: await getAppState(sessionForState)
    });

    setSessionCookie(response, session);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể đăng nhập." }, { status: 500 });
  }
}
