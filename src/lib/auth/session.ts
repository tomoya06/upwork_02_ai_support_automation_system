import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "session";
const SESSION_SECRET = process.env.SESSION_SECRET;

export interface Session {
  role: "admin";
}

function getSecret(): string {
  if (!SESSION_SECRET) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is required in production");
    }
    return "dev-only-secret-change-me";
  }
  return SESSION_SECRET;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = sign(payload, getSecret());
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): Session | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = sign(payload, getSecret());
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (session.role !== "admin") return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionFromRequest(request: NextRequest | Request): Session | null {
  const token =
    (request as NextRequest).cookies?.get(SESSION_COOKIE)?.value ||
    parseCookieHeader(request.headers.get("cookie") || "");
  if (!token) return null;
  return verifySessionToken(token);
}

function parseCookieHeader(cookieHeader: string): string | null {
  const match = cookieHeader.split(";").find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  return match.split("=")[1]?.trim() || null;
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken(session);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
