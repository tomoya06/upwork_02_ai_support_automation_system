"use client";

import { useQuery } from "@tanstack/react-query";
import type { Ticket, TicketMessage, TicketClassification, Decision } from "@/types";

interface TicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
  classifications: TicketClassification[];
  decisions: Decision[];
}

async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await fetch(`/api/tickets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch ticket");
  return res.json();
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id),
    enabled: !!id,
  });
}
