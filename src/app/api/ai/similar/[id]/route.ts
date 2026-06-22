import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchSimilarTickets, generateEmbedding } from "@/lib/ai/embedding-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    const embedding = await generateEmbedding(`${ticket.subject}\n${ticket.body}`);
    const similarTickets = await searchSimilarTickets(
      embedding,
      ticket.id,
      ticket.workspace_id,
      5
    );

    return NextResponse.json({ similarTickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
