"use client";

import { Brain, Zap, CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { Ticket } from "@/types";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { useRunPipeline } from "@/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIInsightPanelProps {
  ticket: Ticket;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
      ? "bg-yellow-500"
      : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>AI Confidence</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    refund_review: "bg-purple-100 text-purple-800",
    escalate: "bg-red-100 text-red-800",
    auto_resolve: "bg-green-100 text-green-800",
    manual_review: "bg-yellow-100 text-yellow-800",
    send_info: "bg-blue-100 text-blue-800",
  };
  const color = colors[action] || "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", color)}>
      {action.replace(/_/g, " ")}
    </span>
  );
}

export function AIInsightPanel({ ticket }: AIInsightPanelProps) {
  const { mutate: runPipeline, isPending } = useRunPipeline(ticket.id);

  const hasAI = !!ticket.ai_confidence;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Insights</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => runPipeline()}
          disabled={isPending}
          className="h-7 text-xs gap-1"
        >
          {isPending ? (
            <Clock className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          {isPending ? "Running..." : hasAI ? "Re-run AI" : "Run AI"}
        </Button>
      </div>

      {!hasAI ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <p>No AI analysis yet.</p>
          <p className="text-xs mt-1">Click &quot;Run AI&quot; to analyze this ticket.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ticket.ai_confidence !== null && (
            <ConfidenceBar value={ticket.ai_confidence} />
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {ticket.category && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Category</span>
                <div>
                  <TicketStatusBadge type="category" value={ticket.category} />
                </div>
              </div>
            )}
            {ticket.priority && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Priority</span>
                <div>
                  <TicketStatusBadge type="priority" value={ticket.priority} />
                </div>
              </div>
            )}
          </div>

          {ticket.suggested_action && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Suggested Action</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                <ActionBadge action={ticket.suggested_action} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
