import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const ANON_COOKIE = "anon_session_id";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Get the anonymous session ID from the request cookie,
 * or create a new one and attach it to the response.
 */
export function getOrCreateAnonymousSession(
  request: NextRequest,
  response: NextResponse
): string {
  const existing = request.cookies.get(ANON_COOKIE)?.value;
  if (existing) return existing;

  const id = `anon_${randomUUID()}`;
  response.cookies.set(ANON_COOKIE, id, {
    httpOnly: false, // client doesn't need to read it, but it's not sensitive
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return id;
}

/**
 * Read the anonymous session ID from the request cookie (read-only, no creation).
 */
export function getAnonymousSession(request: NextRequest | Request): string | null {
  const cookieHeader = (request as NextRequest).cookies?.get(ANON_COOKIE)?.value
    ?? parseCookieHeader(request.headers.get("cookie") || "");
  return cookieHeader || null;
}

function parseCookieHeader(cookieHeader: string): string | null {
  const match = cookieHeader.split(";").find((c) => c.trim().startsWith(`${ANON_COOKIE}=`));
  if (!match) return null;
  return match.split("=")[1]?.trim() || null;
}
