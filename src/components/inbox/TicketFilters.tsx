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
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">
          Status
        </label>
        <Select
          value={filters.status || ""}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              status: value ? value : undefined,
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">
          Category
        </label>
        <Select
          value={filters.category || ""}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              category: value ? value : undefined,
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">
          Priority
        </label>
        <Select
          value={filters.priority || ""}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              priority: value ? value : undefined,
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" size="sm" onClick={resetFilters} className="mb-0.5">
        Reset
      </Button>
    </div>
  );
}
