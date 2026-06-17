import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Total tickets
    const { count: totalTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID);

    // Open tickets
    const { count: openTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("status", "open");

    // Resolved tickets
    const { count: resolvedTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("status", "resolved");

    // Escalated tickets
    const { count: escalatedTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("status", "escalated");

    // Tickets with AI analysis
    const { count: aiAnalyzedTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .not("ai_confidence", "is", null);

    // Pipeline runs
    const { count: pipelineRuns } = await supabase
      .from("pipeline_runs")
      .select("*", { count: "exact", head: true });

    // Knowledge documents
    const { count: knowledgeDocs } = await supabase
      .from("knowledge_documents")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("status", "active");

    // Recent tickets (last 7 days) for trend
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTickets } = await supabase
      .from("tickets")
      .select("created_at, status, category, priority")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .gte("created_at", weekAgo)
      .order("created_at");

    // Category breakdown
    const { data: categoryBreakdown } = await supabase
      .from("tickets")
      .select("category")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .not("category", "is", null);

    const categoryCounts: Record<string, number> = {};
    (categoryBreakdown || []).forEach((t) => {
      if (t.category) categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const resolutionRate =
      totalTickets && totalTickets > 0
        ? Math.round(((resolvedTickets || 0) / totalTickets) * 100)
        : 0;

    const aiAdoptionRate =
      totalTickets && totalTickets > 0
        ? Math.round(((aiAnalyzedTickets || 0) / totalTickets) * 100)
        : 0;

    return NextResponse.json({
      overview: {
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        resolvedTickets: resolvedTickets || 0,
        escalatedTickets: escalatedTickets || 0,
        resolutionRate,
        aiAdoptionRate,
        pipelineRuns: pipelineRuns || 0,
        knowledgeDocs: knowledgeDocs || 0,
      },
      recentTickets: recentTickets || [],
      categoryBreakdown: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
