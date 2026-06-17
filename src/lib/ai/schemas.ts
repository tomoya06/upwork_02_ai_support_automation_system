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

export function parseClassification(data: unknown): ClassificationResult {
  return TicketClassificationSchema.parse(data) as ClassificationResult;
}

export function parseDecision(data: unknown): DecisionResult {
  return DecisionSchema.parse(data) as DecisionResult;
}

export function parseReply(data: unknown): ReplyResult {
  return ReplySchema.parse(data) as ReplyResult;
}
