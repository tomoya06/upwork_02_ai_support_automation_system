"use client";

import { ExternalLink, GitMerge } from "lucide-react";
import Link from "next/link";
import type { Ticket } from "@/types";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { formatDistanceToNow } from "date-fns";

interface SimilarTicketsPanelProps {
  tickets: (Ticket & { similarity?: number })[];
}

export function SimilarTicketsPanel({ tickets }: SimilarTicketsPanelProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitMerge className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Similar Tickets</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-3">
          No similar tickets found.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GitMerge className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Similar Tickets</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {tickets.length} found
        </span>
      </div>

      <ul className="space-y-2">
        {tickets.map((t) => (
          <li
            key={t.id}
            className="group rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {t.subject}
                </p>
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  {t.status && (
                    <TicketStatusBadge type="status" value={t.status} />
                  )}
                  {t.category && (
                    <TicketStatusBadge type="category" value={t.category} />
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Link
                href={`/tickets/${t.id}`}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            {typeof t.similarity === "number" && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                  <span>Similarity</span>
                  <span>{Math.round(t.similarity * 100)}%</span>
                </div>
                <div className="h-0.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full"
                    style={{ width: `${Math.round(t.similarity * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
