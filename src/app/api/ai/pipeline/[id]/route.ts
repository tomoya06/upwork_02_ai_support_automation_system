import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runPipeline, getPipelineTrace } from "@/lib/ai/pipeline-service";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, customers(*)")
      .eq("id", params.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const result = await runPipeline(ticket, ticket.customers || null);

    // Fetch the latest pipeline run trace
    const run = await getPipelineTrace(params.id);

    return NextResponse.json({ success: true, result, run });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
