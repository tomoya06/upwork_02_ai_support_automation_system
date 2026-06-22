import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding, searchKnowledge, searchSimilarTickets, storeTicketEmbedding } from "./embedding-service";
import { classifyTicket, generateReply } from "./ai-service";
import { makeDecision, shouldAutoExecute } from "./decision-engine";
import type {
  Ticket,
  Customer,
  PipelineRun,
  PipelineStep,
  ClassificationResult,
  DecisionResult,
  ReplyResult,
} from "@/types";

export interface PipelineResult {
  classification: ClassificationResult;
  decision: DecisionResult;
  reply: ReplyResult;
  similarTickets: unknown[];
  knowledgeSnippets: unknown[];
}

export async function runPipeline(
  ticket: Ticket,
  customer: Customer | null,
  existingRunId?: string
): Promise<PipelineResult> {
  const supabase = createAdminClient();
  const workspaceId = ticket.workspace_id;
  const ticketId = ticket.id;

  // Create pipeline run record if one wasn't provided by the caller
  let runId = existingRunId;
  if (!runId) {
    const { data: run } = await supabase
      .from("pipeline_runs")
      .insert({ ticket_id: ticketId, status: "running", steps: [], started_at: new Date().toISOString() })
      .select("id")
      .single();

    runId = run?.id;
  }

  const steps: PipelineStep[] = [];
  let currentStep: PipelineStep["step"] = "execute";

  const addStep = async (step: PipelineStep) => {
    steps.push(step);
    if (runId) {
      await supabase.from("pipeline_runs").update({ steps }).eq("id", runId);
    }
  };

  try {
    // 1. Embed
    currentStep = "embed";
    const embedStart = Date.now();
    const embedding = await generateEmbedding(`${ticket.subject}\n${ticket.body}`);
    await addStep({
      step: "embed",
      status: "success",
      input: `${ticket.subject}\n${ticket.body}`,
      output: { dimension: embedding.length },
      latency_ms: Date.now() - embedStart,
    });

    // Store ticket embedding for future similar ticket search
    await storeTicketEmbedding(ticketId, workspaceId, embedding);

    // 2. Classify
    currentStep = "classify";
    const classifyStart = Date.now();
    const classification = await classifyTicket(ticket.subject, ticket.body);
    await addStep({
      step: "classify",
      status: "success",
      input: { subject: ticket.subject, body: ticket.body },
      output: classification,
      latency_ms: Date.now() - classifyStart,
    });

    // Update ticket with classification
    await supabase.from("tickets").update({
      category: classification.category,
      priority: classification.priority,
      ai_confidence: classification.confidence,
      last_ai_run_at: new Date().toISOString(),
    }).eq("id", ticketId);

    // Insert classification record
    await supabase.from("ticket_classifications").insert({
      ticket_id: ticketId,
      category: classification.category,
      priority: classification.priority,
      sentiment: classification.sentiment,
      urgency: classification.urgency,
      confidence: classification.confidence,
      model: "llama3-70b-8192",
    });

    // 3. Retrieve
    currentStep = "retrieve";
    const retrieveStart = Date.now();
    const [knowledgeSnippets, similarTickets] = await Promise.all([
      searchKnowledge(embedding, workspaceId, 0.5, 5),
      searchSimilarTickets(embedding, ticketId, workspaceId, 5),
    ]);
    await addStep({
      step: "retrieve",
      status: "success",
      output: {
        knowledge_count: knowledgeSnippets.length,
        similar_ticket_count: similarTickets.length,
      },
      latency_ms: Date.now() - retrieveStart,
    });

    // Cache similar tickets
    if (similarTickets.length > 0) {
      await supabase.from("similar_tickets").insert(
        similarTickets.map((t: { id: string; similarity: number }) => ({
          ticket_id: ticketId,
          similar_ticket_id: t.id,
          score: t.similarity,
        }))
      );
    }

    // 4. Decide
    currentStep = "decide";
    const decideStart = Date.now();
    const decision = await makeDecision(
      ticket.subject,
      ticket.body,
      classification,
      {
        knowledgeSnippets: knowledgeSnippets.map((k: { content: string; similarity: number }) => ({
          content: k.content,
          similarity: k.similarity,
        })),
        similarTickets: similarTickets.map((t: { id: string; subject: string; body: string; status: string; similarity: number }) => ({
          id: t.id,
          subject: t.subject,
          body: t.body,
          status: t.status,
          similarity: t.similarity,
        })),
      },
      customer
    );
    await addStep({
      step: "decide",
      status: "success",
      output: decision,
      latency_ms: Date.now() - decideStart,
    });

    // Insert decision record
    await supabase.from("decisions").insert({
      ticket_id: ticketId,
      suggested_action: decision.suggested_action,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      requires_approval: decision.requires_approval,
      status: shouldAutoExecute(decision) ? "auto_executed" : "pending",
    });

    // Update ticket with suggested action
    await supabase.from("tickets").update({
      suggested_action: decision.suggested_action,
    }).eq("id", ticketId);

    // 5. Generate reply
    currentStep = "generate";
    const generateStart = Date.now();
    const contextText = buildContextText(knowledgeSnippets, similarTickets);
    const reply = await generateReply(
      ticket.subject,
      ticket.body,
      classification,
      decision,
      contextText,
      "full"
    );
    await addStep({
      step: "generate",
      status: "success",
      output: reply,
      latency_ms: Date.now() - generateStart,
    });

    // Store reply as draft message
    await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      role: "ai",
      content: reply.reply,
      metadata: { citations: reply.citations, draft: true, model: "llama3-70b-8192" },
    });

    // 6. Execute if auto
    currentStep = "execute";
    if (shouldAutoExecute(decision)) {
      await supabase.from("tickets").update({ status: "resolved" }).eq("id", ticketId);
      await supabase.from("ticket_messages").update({ metadata: { draft: false } }).eq("ticket_id", ticketId).eq("role", "ai");
      await addStep({
        step: "execute",
        status: "success",
        output: { action: "auto_resolved" },
      });
    } else {
      await addStep({
        step: "execute",
        status: "skipped",
        output: { reason: "requires_approval or low confidence" },
      });
    }

    // Mark pipeline run completed
    if (runId) {
      await supabase
        .from("pipeline_runs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", runId);
    }

    return {
      classification,
      decision,
      reply,
      similarTickets,
      knowledgeSnippets,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await addStep({
      step: currentStep,
      status: "failed",
      error: errorMessage,
    });

    if (runId) {
      await supabase
        .from("pipeline_runs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", runId);
    }

    // Mark ticket as escalated on pipeline failure
    await supabase.from("tickets").update({ status: "escalated" }).eq("id", ticketId);

    throw error;
  }
}

function buildContextText(
  knowledgeSnippets: unknown[],
  similarTickets: unknown[]
): string {
  const parts: string[] = [];

  if (knowledgeSnippets.length > 0) {
    parts.push("Knowledge snippets:");
    knowledgeSnippets.forEach((k, i) => {
      const item = k as { content: string; similarity: number };
      parts.push(`${i + 1}. ${item.content.slice(0, 300)}`);
    });
  }

  if (similarTickets.length > 0) {
    parts.push("\nSimilar resolved tickets:");
    similarTickets.forEach((t, i) => {
      const item = t as { id: string; subject: string };
      parts.push(`${i + 1}. Ticket ${item.id}: ${item.subject}`);
    });
  }

  return parts.join("\n") || "No relevant context found.";
}

export async function getPipelineTrace(ticketId: string): Promise<PipelineRun | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pipeline_runs")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data as PipelineRun | null;
}
