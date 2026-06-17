import { makeDecisionWithLLM } from "./ai-service";
import type { ClassificationResult, DecisionResult, Customer } from "@/types";

export interface DecisionContext {
  knowledgeSnippets: { content: string; similarity: number }[];
  similarTickets: { id: string; subject: string; body: string; status: string; similarity: number }[];
}

export async function makeDecision(
  subject: string,
  body: string,
  classification: ClassificationResult,
  context: DecisionContext,
  customer: Customer | null
): Promise<DecisionResult> {
  const contextText = buildContextText(context);
  const customerTier = customer?.tier || "free";
  const lifetimeValue = customer?.lifetime_value || 0;

  return makeDecisionWithLLM(
    subject,
    body,
    classification,
    contextText,
    customerTier,
    Number(lifetimeValue)
  );
}

function buildContextText(context: DecisionContext): string {
  const parts: string[] = [];

  if (context.knowledgeSnippets.length > 0) {
    parts.push("Knowledge snippets:");
    context.knowledgeSnippets.forEach((k, i) => {
      parts.push(`${i + 1}. [${(k.similarity * 100).toFixed(0)}%] ${k.content.slice(0, 300)}`);
    });
  }

  if (context.similarTickets.length > 0) {
    parts.push("\nSimilar resolved tickets:");
    context.similarTickets.forEach((t, i) => {
      parts.push(
        `${i + 1}. Ticket ${t.id} [${(t.similarity * 100).toFixed(0)}%]: ${t.subject}`
      );
    });
  }

  return parts.join("\n") || "No relevant context found.";
}

export function shouldAutoExecute(decision: DecisionResult): boolean {
  return decision.auto_resolve && !decision.requires_approval && decision.confidence >= 0.85;
}
