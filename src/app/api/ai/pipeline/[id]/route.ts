import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runPipeline, getPipelineTrace } from "@/lib/ai/pipeline-service";

const RUN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const supabase = createAdminClient();

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, customers(*)")
      .eq("id", id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
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
