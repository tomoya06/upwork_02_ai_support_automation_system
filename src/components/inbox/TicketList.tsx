"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
  TicketCategoryBadge,
} from "@/components/tickets/TicketStatusBadge";
import type { Ticket } from "@/types";

function isTempTicket(ticket: Ticket): boolean {
  return ticket.id.startsWith("tmp_");
}

function ExpiresBadge({ expiresAt }: { expiresAt: string | null }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  if (!expiresAt) return null;

  const expiresMs = new Date(expiresAt).getTime();
  const remainingMs = expiresMs - now;

  if (remainingMs <= 0) return null;

  const remainingMin = Math.ceil(remainingMs / 60000);

  return (
    <Badge
      variant="outline"
      className="text-[11px] py-0 px-1.5 border-amber-300 text-amber-700 bg-amber-50"
    >
      Demo · {remainingMin}min left
    </Badge>
  );
}

interface TicketListProps {
  tickets: Ticket[] | undefined;
  isLoading: boolean;
}

export function TicketList({ tickets, isLoading }: TicketListProps) {
  if (isLoading) {
    return (
      <div className="space-y-5">
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
    <div className="space-y-5">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="block"
        >
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
                  {isTempTicket(ticket) && (
                    <ExpiresBadge expiresAt={ticket.expires_at ?? null} />
                  )}
                  <TicketCategoryBadge category={ticket.category} />
                  <TicketPriorityBadge priority={ticket.priority} />

                  {ticket.ai_confidence && (
                    <Badge
                      variant="outline"
                      className="text-[11px] py-0 px-1.5 border-dotted text-muted-foreground border-muted-foreground/30"
                    >
                      AI: {(ticket.ai_confidence * 100).toFixed(0)}%
                    </Badge>
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
