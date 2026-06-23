"use client";

import { TicketList } from "@/components/inbox/TicketList";
import { TicketFilters } from "@/components/inbox/TicketFilters";
import { CreateTicketDialog } from "@/components/inbox/CreateTicketDialog";
import { useTickets } from "@/hooks/useTickets";
import { useTicketStore } from "@/stores/ticketStore";
import { useAuth } from "@/components/providers/AuthProvider";

export default function InboxPage() {
  const { filters } = useTicketStore();
  const { data: tickets, isLoading } = useTickets(filters);
  const { isAdmin, isLoading: authLoading } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inbox</h1>
        {!authLoading && <CreateTicketDialog isDemo={!isAdmin} />}
      </div>

      <TicketFilters />
      <TicketList tickets={tickets} isLoading={isLoading} />
    </div>
  );
}
