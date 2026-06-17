import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyTicket } from "@/lib/ai/ai-service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const classification = await classifyTicket(ticket.subject, ticket.body);

    await supabase.from("ticket_classifications").insert({
      ticket_id: ticket.id,
      category: classification.category,
      priority: classification.priority,
      sentiment: classification.sentiment,
      urgency: classification.urgency,
      confidence: classification.confidence,
      model: "llama3-70b-8192",
    });

    await supabase
      .from("tickets")
      .update({
        category: classification.category,
        priority: classification.priority,
        ai_confidence: classification.confidence,
        last_ai_run_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    return NextResponse.json({ classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
