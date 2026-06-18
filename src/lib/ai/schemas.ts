import { z } from "zod";
import type {
  ClassificationResult,
  DecisionResult,
  ReplyResult,
} from "@/types";

export const TicketClassificationSchema = z.object({
  category: z.enum(["billing", "technical", "account", "refund", "feature_request", "general"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  sentiment: z.enum(["negative", "neutral", "positive"]),
  urgency: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export const DecisionSchema = z.object({
  suggested_action: z.string(),
  auto_resolve: z.boolean(),
  requires_approval: z.boolean(),
  route_to: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export const ReplySchema = z.object({
  reply: z.string(),
  citations: z.array(z.string()),
});

function extractString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function normalizeReply(data: unknown): { reply: string; citations: string[] } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid reply data: expected JSON object");
  }

  const d = data as Record<string, unknown>;

  // Handle the common case first
  let replyText = extractString(d.reply);

  // Some models wrap the response in a nested object (e.g. { reply: { text, message, response } })
  if (!replyText && d.reply && typeof d.reply === "object") {
    const nested = d.reply as Record<string, unknown>;
    replyText =
      extractString(nested.reply) ??
      extractString(nested.text) ??
      extractString(nested.response) ??
      extractString(nested.message) ??
      extractString(nested.answer) ??
      extractString(nested.content);
  }

  // Fallback to common top-level aliases
  if (!replyText) {
    replyText =
      extractString(d.response) ??
      extractString(d.answer) ??
      extractString(d.message) ??
      extractString(d.text) ??
      extractString(d.content);
  }

  // Last resort: if the model returned a bare string, treat it as the reply
  if (!replyText && typeof data === "string") {
    replyText = data;
  }

  if (replyText === undefined) {
    replyText = "";
  }

  const citations = Array.isArray(d.citations) ? d.citations : [];

  return {
    reply: replyText.trim(),
    citations: citations
      .map((c) => extractString(c))
      .filter((c): c is string => c !== undefined),
  };
}

export function parseClassification(data: unknown): ClassificationResult {
  return TicketClassificationSchema.parse(data) as ClassificationResult;
}

export function parseDecision(data: unknown): DecisionResult {
  return DecisionSchema.parse(data) as DecisionResult;
}

export function parseReply(data: unknown): ReplyResult {
  return ReplySchema.parse(normalizeReply(data)) as ReplyResult;
}
