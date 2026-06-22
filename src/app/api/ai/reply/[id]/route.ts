import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReply } from "@/lib/ai/ai-service";
import { searchKnowledge, searchSimilarTickets, generateEmbedding } from "@/lib/ai/embedding-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { style = "full" } = await request.json();
    const supabase = createAdminClient();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*, customers(*)")
      .eq("id", params.id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const embedding = await generateEmbedding(`${ticket.subject}\n${ticket.body}`);
    const [knowledgeSnippets, similarTickets] = await Promise.all([
      searchKnowledge(embedding, ticket.workspace_id, 0.5, 5),
      searchSimilarTickets(embedding, ticket.id, ticket.workspace_id, 5),
    ]);

    const contextText = [
      knowledgeSnippets.length > 0 ? "Knowledge snippets:\n" + knowledgeSnippets.map((k: { content: string }) => k.content).join("\n") : "",
      similarTickets.length > 0 ? "Similar tickets:\n" + similarTickets.map((t: { subject: string }) => t.subject).join("\n") : "",
    ].join("\n\n");

    const classification = {
      category: ticket.category || "general",
      priority: ticket.priority || "medium",
      sentiment: "neutral" as const,
      urgency: "medium" as const,
      confidence: ticket.ai_confidence || 0.5,
      reasoning: "",
    };

    const decision = {
      suggested_action: ticket.suggested_action || "reply",
      auto_resolve: false,
      requires_approval: true,
      route_to: null,
      confidence: 0.5,
      reasoning: "",
    };

    const replyResult = await generateReply(
      ticket.subject,
      ticket.body,
      classification,
      decision,
      contextText,
      style
    );

    return NextResponse.json({
      reply: replyResult.reply,
      citations: replyResult.citations,
      knowledgeSnippets,
      similarTickets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
