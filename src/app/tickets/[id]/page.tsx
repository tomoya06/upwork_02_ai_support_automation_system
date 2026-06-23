"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronDown, MoreHorizontal, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useTicket,
  useTicketMessages,
  usePipelineTrace,
  useSimilarTickets,
} from "@/hooks/useTickets";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketMessageThread } from "@/components/tickets/TicketMessageThread";
import { AIInsightPanel } from "@/components/tickets/AIInsightPanel";
import { AIPipelineTrace } from "@/components/tickets/AIPipelineTrace";
import { AIReplyComposer } from "@/components/tickets/AIReplyComposer";
import { SimilarTicketsPanel } from "@/components/tickets/SimilarTicketsPanel";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import type { TicketMessage } from "@/types";

// ─── Right panel tab type ─────────────────────────────────────────────────────
type RightTab = "ai" | "trace" | "similar";

function createLocalMessage(content: string): TicketMessage {
  return {
    id: `local-${Date.now()}`,
    ticket_id: "",
    role: "agent",
    content,
    metadata: null,
    created_at: new Date().toISOString(),
  };
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);
  const [rightTab, setRightTab] = useState<RightTab>("ai");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [localMessages, setLocalMessages] = useState<TicketMessage[]>([]);
  const { isAdmin } = useAuth();

  const { data: ticket, isLoading: loadingTicket, refetch: refetchTicket } = useTicket(ticketId);
  const { data: messages = [], isLoading: loadingMessages, refetch: refetchMessages } = useTicketMessages(ticketId);
  const { data: pipelineRun } = usePipelineTrace(ticketId);
  const { data: similarTickets = [] } = useSimilarTickets(ticketId);

  const allMessages = useMemo(
    () => [...messages, ...localMessages],
    [messages, localMessages]
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  function handleLocalSend(content: string) {
    setLocalMessages((prev) => [...prev, createLocalMessage(content)]);
  }

  if (loadingTicket) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading ticket…
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Ticket not found.</p>
        <Link href="/inbox" className="text-sm text-primary underline mt-2">
          Back to Inbox
        </Link>
      </div>
    );
  }

  const rightTabs: { key: RightTab; label: string }[] = [
    { key: "ai", label: "AI Insights" },
    { key: "trace", label: "Pipeline Trace" },
    { key: "similar", label: "Similar" },
  ];

  const statusOptions = ["open", "pending", "resolved", "escalated", "closed"] as const;

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] overflow-hidden">
      {/* ─── Left column: main ticket content ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="flex-none flex items-center gap-3 pb-4 border-b">
          <Link
            href="/inbox"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold leading-snug truncate">
              {ticket.subject}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <TicketStatusBadge type="status" value={ticket.status} />
              {ticket.priority && (
                <TicketStatusBadge type="priority" value={ticket.priority} />
              )}
              {ticket.category && (
                <TicketStatusBadge type="category" value={ticket.category} />
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Status quick-change */}
          {isAdmin && (
            <div className="relative flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowStatusMenu((p) => !p)}
              >
                Status
                <ChevronDown className="h-3 w-3" />
              </Button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-md overflow-hidden z-20 min-w-[120px]">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs hover:bg-muted",
                        ticket.status === s && "font-semibold text-primary"
                      )}
                      onClick={() => {
                        fetch(`/api/tickets/${ticketId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: s }),
                        }).then(() => { refetchTicket(); setShowStatusMenu(false); });
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {loadingMessages ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading messages…</p>
          ) : (
            <TicketMessageThread messages={allMessages} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply composer */}
        <div className="flex-none pt-4 border-t">
          <AIReplyComposer
            ticketId={ticketId}
            isAdmin={isAdmin}
            onMessageSent={() => refetchMessages()}
            onLocalSend={handleLocalSend}
          />
        </div>
      </div>

      {/* ─── Right column: AI panels (desktop sidebar / mobile tabs) ─── */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0 h-full overflow-y-auto mt-6 lg:mt-0">
        {/* Mobile: tab bar at top; Desktop: always visible */}
        <div className="flex border-b mb-4 lg:flex lg:flex-row">
          {rightTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRightTab(tab.key)}
              className={cn(
                "flex-1 text-xs py-2 font-medium transition-colors border-b-2",
                rightTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.key === "trace" && pipelineRun && (
                <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-green-100 text-green-700">
                  <Zap className="h-2 w-2 mr-0.5" />
                  {pipelineRun.steps.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {rightTab === "ai" && <AIInsightPanel ticket={ticket} isAdmin={isAdmin} />}

          {rightTab === "trace" && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                AI Pipeline Trace
              </h3>
              {pipelineRun ? (
                <AIPipelineTrace run={pipelineRun} />
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Zap className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p>No trace yet.</p>
                  <p className="text-xs mt-1">Run AI to see the pipeline trace.</p>
                </div>
              )}
            </div>
          )}

          {rightTab === "similar" && (
            <SimilarTicketsPanel tickets={similarTickets} />
          )}
        </div>
      </div>
    </div>
  );
}
