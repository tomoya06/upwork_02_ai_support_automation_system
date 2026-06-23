import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromRequest, type Session } from "@/lib/auth/session";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  limit: number;
  isAdmin: boolean;
}

const ANONYMOUS_GLOBAL_BUCKET = "anonymous_global";
const ANONYMOUS_QPS_LIMIT = 5;
const WINDOW_SECONDS = 1;
const CLEANUP_THRESHOLD_SECONDS = 10;
const CLEANUP_PROBABILITY = 0.1; // 10% chance to trigger cleanup per request

/**
 * Check rate limit for an incoming request.
 * - Admin sessions: always allowed (guaranteed QPS >= 1)
 * - Anonymous sessions: global QPS limit of 5 across all anonymous users
 */
export async function checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
  const session: Session | null = getSessionFromRequest(request);

  // Admin requests are never rate-limited
  if (session?.role === "admin") {
    return {
      allowed: true,
      remaining: -1, // unlimited for admin
      retryAfter: 0,
      limit: -1,
      isAdmin: true,
    };
  }

  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

  // Count requests in the current window
  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("bucket", ANONYMOUS_GLOBAL_BUCKET)
    .gte("created_at", windowStart);

  if (countError) {
    console.error("Rate limit check failed:", countError);
    // Fail open: allow the request if we can't check the rate limit
    return {
      allowed: true,
      remaining: ANONYMOUS_QPS_LIMIT,
      retryAfter: 0,
      limit: ANONYMOUS_QPS_LIMIT,
      isAdmin: false,
    };
  }

  const currentCount = count ?? 0;

  if (currentCount >= ANONYMOUS_QPS_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: WINDOW_SECONDS,
      limit: ANONYMOUS_QPS_LIMIT,
      isAdmin: false,
    };
  }

  // Record this request
  const { error: insertError } = await supabase
    .from("rate_limits")
    .insert({ bucket: ANONYMOUS_GLOBAL_BUCKET });

  if (insertError) {
    console.error("Rate limit record insert failed:", insertError);
    // Fail open
    return {
      allowed: true,
      remaining: ANONYMOUS_QPS_LIMIT - currentCount,
      retryAfter: 0,
      limit: ANONYMOUS_QPS_LIMIT,
      isAdmin: false,
    };
  }

  // Probabilistic cleanup of old entries
  if (Math.random() < CLEANUP_PROBABILITY) {
    const cleanupThreshold = new Date(
      Date.now() - CLEANUP_THRESHOLD_SECONDS * 1000
    ).toISOString();
    supabase
      .from("rate_limits")
      .delete()
      .eq("bucket", ANONYMOUS_GLOBAL_BUCKET)
      .lt("created_at", cleanupThreshold)
      .then(); // fire-and-forget
  }

  return {
    allowed: true,
    remaining: ANONYMOUS_QPS_LIMIT - currentCount - 1,
    retryAfter: 0,
    limit: ANONYMOUS_QPS_LIMIT,
    isAdmin: false,
  };
}
