import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runPipeline, getPipelineTrace } from "@/lib/ai/pipeline-service";
import { getSessionFromRequest } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

const RUN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DEMO_TICKET_MAX_RUNS = 3;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const isDemoTicket = id.startsWith("tmp_");

  try {
    const session = getSessionFromRequest(request);

    // Anonymous requests are rate-limited
    if (!session) {
      const rateLimit = await checkRateLimit(request);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimit.retryAfter),
              "X-RateLimit-Limit": String(rateLimit.limit),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
    }

    const supabase = createAdminClient();

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, customers(*)")
      .eq("id", id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Demo ticket: limit to 3 successful pipeline runs
    if (isDemoTicket) {
      const { count: successRuns } = await supabase
        .from("pipeline_runs")
        .select("*", { count: "exact", head: true })
        .eq("ticket_id", id)
        .eq("status", "completed");

      if ((successRuns ?? 0) >= DEMO_TICKET_MAX_RUNS) {
        return NextResponse.json(
          { error: `Demo ticket AI run limit reached (${DEMO_TICKET_MAX_RUNS}/${DEMO_TICKET_MAX_RUNS})` },
          { status: 403 }
        );
      }
    }

    // Idempotency: if there is a recent running run, return it instead of creating a new one.
    const existingRun = await getPipelineTrace(id);
    if (existingRun && existingRun.status === "running" && isRecentRun(existingRun.started_at)) {
      return NextResponse.json(
        { runId: existingRun.id, status: "running" },
        { status: 202 }
      );
    }

    // Create a new pipeline run record immediately so the frontend can poll it.
    const { data: run, error: runError } = await supabase
      .from("pipeline_runs")
      .insert({
        ticket_id: id,
        status: "running",
        steps: [],
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: "Failed to create pipeline run" },
        { status: 500 }
      );
    }

    // Schedule the actual pipeline work to run after the response is sent.
    after(async () => {
      try {
        await runPipeline(ticket, ticket.customers || null, run.id);
      } catch (error) {
        // runPipeline already marks the run as failed in most cases; this is a last-resort guard.
        console.error("Pipeline background execution failed", error);
        await supabase
          .from("pipeline_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);
      }
    });

    return NextResponse.json(
      { runId: run.id, status: "running" },
      { status: 202 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isRecentRun(startedAt: string | null): boolean {
  if (!startedAt) return false;
  return Date.now() - new Date(startedAt).getTime() < RUN_TIMEOUT_MS;
}
