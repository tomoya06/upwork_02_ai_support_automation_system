import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyTicket } from "@/lib/ai/ai-service";
import { getSessionFromRequest } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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
