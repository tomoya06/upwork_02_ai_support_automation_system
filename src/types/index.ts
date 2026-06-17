export type TicketStatus = "open" | "pending" | "resolved" | "escalated" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketCategory =
  | "billing"
  | "technical"
  | "account"
  | "refund"
  | "feature_request"
  | "general";

export interface Ticket {
  id: string;
  workspace_id: string;
  customer_id: string | null;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority | null;
  category: TicketCategory | null;
  source: string | null;
  assigned_to: string | null;
  ai_confidence: number | null;
  suggested_action: string | null;
  last_ai_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  role: "customer" | "ai" | "agent" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Customer {
  id: string;
  workspace_id: string;
  email: string | null;
  name: string | null;
  tier: "free" | "pro" | "enterprise" | null;
  lifetime_value: number | null;
  created_at: string;
}

export interface TicketClassification {
  id: string;
  ticket_id: string;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  sentiment: "negative" | "neutral" | "positive" | null;
  urgency: "low" | "medium" | "high" | null;
  confidence: number | null;
  model: string | null;
  created_at: string;
}

export interface Decision {
  id: string;
  ticket_id: string;
  suggested_action: string | null;
  reasoning: string | null;
  confidence: number | null;
  requires_approval: boolean | null;
  executed_at: string | null;
  executed_by: string | null;
  status: "pending" | "approved" | "rejected" | "auto_executed" | null;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  workspace_id: string;
  title: string;
  source_url: string | null;
  status: "active" | "archived";
  created_at: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PipelineRun {
  id: string;
  ticket_id: string;
  status: "running" | "completed" | "failed" | "partial";
  started_at: string;
  completed_at: string | null;
  steps: PipelineStep[];
  created_at: string;
}

export interface PipelineStep {
  step:
    | "ingest"
    | "embed"
    | "classify"
    | "retrieve"
    | "decide"
    | "generate"
    | "execute";
  status: "success" | "failed" | "running" | "skipped";
  input?: unknown;
  output?: unknown;
  error?: string | null;
  latency_ms?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  sentiment: "negative" | "neutral" | "positive";
  urgency: "low" | "medium" | "high";
  confidence: number;
  reasoning: string;
}

export interface DecisionResult {
  suggested_action: string;
  auto_resolve: boolean;
  requires_approval: boolean;
  route_to: string | null;
  confidence: number;
  reasoning: string;
}

export interface ReplyResult {
  reply: string;
  citations: string[];
}
