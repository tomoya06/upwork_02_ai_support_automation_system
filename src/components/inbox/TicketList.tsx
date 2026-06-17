"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
  TicketCategoryBadge,
} from "@/components/tickets/TicketStatusBadge";
import type { Ticket } from "@/types";

interface TicketListProps {
  tickets: Ticket[] | undefined;
  isLoading: boolean;
}

export function TicketList({ tickets, isLoading }: TicketListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No tickets found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">{ticket.subject}</h3>
                  <TicketStatusBadge type="status" value={ticket.status} />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.body}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <TicketCategoryBadge category={ticket.category} />
                  <TicketPriorityBadge priority={ticket.priority} />

                  {ticket.ai_confidence && (
                    <span className="text-xs text-muted-foreground">
                      AI: {(ticket.ai_confidence * 100).toFixed(0)}%
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
