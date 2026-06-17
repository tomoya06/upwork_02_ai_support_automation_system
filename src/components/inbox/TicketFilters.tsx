"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTicketStore } from "@/stores/ticketStore";

export function TicketFilters() {
  const { filters, setFilters, resetFilters } = useTicketStore();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          setFilters({ ...filters, status: value === "all" ? undefined : value || undefined })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="escalated">Escalated</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category || "all"}
        onValueChange={(value) =>
          setFilters({ ...filters, category: value === "all" ? undefined : value || undefined })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="billing">Billing</SelectItem>
          <SelectItem value="technical">Technical</SelectItem>
          <SelectItem value="account">Account</SelectItem>
          <SelectItem value="refund">Refund</SelectItem>
          <SelectItem value="feature_request">Feature Request</SelectItem>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || "all"}
        onValueChange={(value) =>
          setFilters({ ...filters, priority: value === "all" ? undefined : value || undefined })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" size="sm" onClick={resetFilters}>
        Reset
      </Button>
    </div>
  );
}
