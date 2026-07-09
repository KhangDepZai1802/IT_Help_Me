import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AccountRole } from "@prisma/client";

export const SESSION_COOKIE = "it_help_me_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type AuthSession = {
  accountId: string;
  username: string;
  role: AccountRole;
  departmentId: string | null;
  expiresAt: number;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return secret || "it-help-me-local-dev-session-secret";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, key] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionValue(session: Omit<AuthSession, "expiresAt">) {
  const payload = JSON.stringify({
    ...session,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  });
  const encoded = base64Url(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function getAuthSession(request: NextRequest): AuthSession | null {
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AuthSession;
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, session: Omit<AuthSession, "expiresAt">) {
  response.cookies.set(SESSION_COOKIE, createSessionValue(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/"
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export function publicSession(session: AuthSession) {
  return {
    accountId: session.accountId,
    username: session.username,
    role: session.role,
    departmentId: session.departmentId
  };
}

export function unauthorized(message = "Bạn cần đăng nhập để tiếp tục.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Bạn không có quyền thực hiện thao tác này.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function canAccessDepartment(session: AuthSession, departmentId: string) {
  return session.role === "IT" || session.departmentId === departmentId;
}
