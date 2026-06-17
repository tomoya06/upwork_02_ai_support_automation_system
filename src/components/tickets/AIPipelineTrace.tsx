"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Hash,
  Brain,
  Database,
  Lightbulb,
  MessageSquare,
  Zap,
  Clock,
} from "lucide-react";
import type { PipelineRun, PipelineStep } from "@/types";
import { cn } from "@/lib/utils";
import { TicketStatusBadge } from "./TicketStatusBadge";

// ─── Step icon map ───────────────────────────────────────────────────────────
const stepIcons: Record<string, React.ElementType> = {
  ingest: Zap,
  embed: Hash,
  classify: Brain,
  retrieve: Database,
  decide: Lightbulb,
  generate: MessageSquare,
  execute: CheckCircle,
};

const stepLabels: Record<string, string> = {
  ingest: "Ingest",
  embed: "Embed",
  classify: "Classify",
  retrieve: "Retrieve",
  decide: "Decide",
  generate: "Generate",
  execute: "Execute",
};

// ─── Latency badge ────────────────────────────────────────────────────────────
function LatencyBadge({ ms }: { ms?: number | null }) {
  if (!ms) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <Clock className="h-2.5 w-2.5" />
      {ms}ms
    </span>
  );
}

// ─── Classification output ───────────────────────────────────────────────────
function ClassifyOutput({ output }: { output: unknown }) {
  const o = output as {
    category?: string;
    priority?: string;
    sentiment?: string;
    urgency?: string;
    confidence?: number;
    reasoning?: string;
  };
  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1.5">
        {o.category && (
          <TicketStatusBadge type="category" value={o.category as never} />
        )}
        {o.priority && (
          <TicketStatusBadge type="priority" value={o.priority as never} />
        )}
        {o.sentiment && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
              o.sentiment === "negative"
                ? "bg-red-100 text-red-700"
                : o.sentiment === "positive"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {o.sentiment}
          </span>
        )}
        {o.urgency && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-50 text-yellow-700">
            urgency: {o.urgency}
          </span>
        )}
      </div>
      {typeof o.confidence === "number" && (
        <div className="space-y-0.5">
          <div className="flex justify-between text-muted-foreground">
            <span>Confidence</span>
            <span className="font-semibold">
              {Math.round(o.confidence * 100)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                o.confidence >= 0.8
                  ? "bg-green-500"
                  : o.confidence >= 0.6
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
              style={{ width: `${Math.round(o.confidence * 100)}%` }}
            />
          </div>
        </div>
      )}
      {o.reasoning && (
        <p className="text-muted-foreground italic">&ldquo;{o.reasoning}&rdquo;</p>
      )}
    </div>
  );
}

// ─── Retrieve output ─────────────────────────────────────────────────────────
function RetrieveOutput({ output }: { output: unknown }) {
  const o = output as {
    knowledge_chunks?: { content: string; similarity?: number }[];
    similar_tickets?: { id: string; subject: string; similarity?: number }[];
  };
  return (
    <div className="space-y-2 text-xs">
      {o.knowledge_chunks && o.knowledge_chunks.length > 0 && (
        <div>
          <p className="font-medium text-muted-foreground mb-1">
            Knowledge Chunks ({o.knowledge_chunks.length})
          </p>
          <ul className="space-y-1">
            {o.knowledge_chunks.slice(0, 3).map((c, i) => (
              <li key={i} className="bg-blue-50 rounded p-1.5 text-blue-900 line-clamp-2">
                {c.content.slice(0, 100)}…
                {c.similarity && (
                  <span className="ml-1 opacity-60">
                    ({Math.round(c.similarity * 100)}%)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {o.similar_tickets && o.similar_tickets.length > 0 && (
        <div>
          <p className="font-medium text-muted-foreground mb-1">
            Similar Tickets ({o.similar_tickets.length})
          </p>
          <ul className="space-y-1">
            {o.similar_tickets.slice(0, 3).map((t, i) => (
              <li key={i} className="bg-purple-50 rounded p-1.5 text-purple-900 truncate">
                {t.subject}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Decision output ──────────────────────────────────────────────────────────
function DecideOutput({ output }: { output: unknown }) {
  const o = output as {
    suggested_action?: string;
    auto_resolve?: boolean;
    requires_approval?: boolean;
    confidence?: number;
    reasoning?: string;
  };
  return (
    <div className="space-y-2 text-xs">
      {o.suggested_action && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Action:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
            {o.suggested_action.replace(/_/g, " ")}
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-[11px]",
            o.requires_approval
              ? "bg-orange-100 text-orange-700"
              : "bg-green-100 text-green-700"
          )}
        >
          {o.requires_approval ? "Requires Approval" : "Auto Execute"}
        </span>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-[11px]",
            o.auto_resolve ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          )}
        >
          {o.auto_resolve ? "Auto Resolve" : "Manual"}
        </span>
      </div>
      {typeof o.confidence === "number" && (
        <div className="flex justify-between text-muted-foreground">
          <span>Confidence</span>
          <span className="font-semibold">{Math.round(o.confidence * 100)}%</span>
        </div>
      )}
      {o.reasoning && (
        <p className="text-muted-foreground italic text-[11px]">
          &ldquo;{o.reasoning}&rdquo;
        </p>
      )}
    </div>
  );
}

// ─── Generate output ──────────────────────────────────────────────────────────
function GenerateOutput({ output }: { output: unknown }) {
  const o = output as { reply?: string; citations?: string[] };
  return (
    <div className="space-y-2 text-xs">
      {o.reply && (
        <div className="bg-muted/50 rounded p-2 text-sm leading-relaxed line-clamp-4">
          {o.reply}
        </div>
      )}
      {o.citations && o.citations.length > 0 && (
        <div>
          <span className="text-muted-foreground">Citations: </span>
          {o.citations.map((c, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-700 rounded px-1 mr-1">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Generic JSON output ──────────────────────────────────────────────────────
function GenericOutput({ output }: { output: unknown }) {
  if (!output) return null;
  if (typeof output === "string") return <p className="text-xs text-muted-foreground">{output}</p>;
  return (
    <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

// ─── Single step card ─────────────────────────────────────────────────────────
function TraceStepCard({ step, index }: { step: PipelineStep; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = stepIcons[step.step] || Zap;
  const label = stepLabels[step.step] || step.step;

  const statusColor =
    step.status === "success"
      ? "text-green-600"
      : step.status === "failed"
      ? "text-red-500"
      : step.status === "running"
      ? "text-blue-500"
      : "text-muted-foreground";

  const StatusIcon =
    step.status === "success"
      ? CheckCircle
      : step.status === "failed"
      ? XCircle
      : step.status === "running"
      ? Loader2
      : Clock;

  function renderOutput() {
    switch (step.step) {
      case "classify":
        return <ClassifyOutput output={step.output} />;
      case "retrieve":
        return <RetrieveOutput output={step.output} />;
      case "decide":
        return <DecideOutput output={step.output} />;
      case "generate":
        return <GenerateOutput output={step.output} />;
      default:
        return <GenericOutput output={step.output} />;
    }
  }

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background z-10",
            step.status === "success"
              ? "border-green-500"
              : step.status === "failed"
              ? "border-red-500"
              : "border-muted"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", statusColor)} />
        </div>
        {index < 6 && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-4">
        <div
          className={cn(
            "rounded-lg border bg-card overflow-hidden",
            step.status === "failed" && "border-red-200"
          )}
        >
          {/* Header */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{label}</span>
              <StatusIcon
                className={cn(
                  "h-3.5 w-3.5",
                  statusColor,
                  step.status === "running" && "animate-spin"
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <LatencyBadge ms={step.latency_ms} />
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expanded output */}
          {expanded && step.output !== undefined && (
            <div className="border-t p-3 bg-muted/20">
              {renderOutput()}
            </div>
          )}

          {/* Error */}
          {step.status === "failed" && step.error && (
            <div className="border-t p-3 bg-red-50 text-red-700 text-xs">
              {step.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface AIPipelineTraceProps {
  run: PipelineRun;
}

export function AIPipelineTrace({ run }: AIPipelineTraceProps) {
  const totalMs = run.completed_at
    ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
    : null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
              run.status === "completed"
                ? "bg-green-100 text-green-700"
                : run.status === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {run.status}
          </span>
          {totalMs !== null && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {totalMs}ms total
            </span>
          )}
        </div>
        <span className="opacity-60">
          {new Date(run.started_at).toLocaleTimeString()}
        </span>
      </div>

      {/* Steps timeline */}
      <div>
        {run.steps.map((step, i) => (
          <TraceStepCard key={step.step} step={step} index={i} />
        ))}
      </div>
    </div>
  );
}
