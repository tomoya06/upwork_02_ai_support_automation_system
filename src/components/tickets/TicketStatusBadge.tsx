"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority, TicketCategory } from "@/types";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  resolved: "bg-green-100 text-green-800 hover:bg-green-100",
  escalated: "bg-red-100 text-red-800 hover:bg-red-100",
  closed: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-purple-100 text-purple-800",
};

const categoryLabels: Record<TicketCategory, string> = {
  billing: "Billing",
  technical: "Technical",
  account: "Account",
  refund: "Refund",
  feature_request: "Feature Request",
  general: "General",
};

// ─── Unified API ─────────────────────────────────────────────────────────────
type BadgeType = "status" | "priority" | "category";

interface TicketStatusBadgeProps {
  type: BadgeType;
  value: TicketStatus | TicketPriority | TicketCategory;
}

export function TicketStatusBadge({ type, value }: TicketStatusBadgeProps) {
  if (type === "status") {
    const s = value as TicketStatus;
    return (
      <Badge className={cn("capitalize text-[11px] py-0 px-1.5", statusStyles[s])}>
        {s}
      </Badge>
    );
  }
  if (type === "priority") {
    const p = value as TicketPriority;
    return (
      <Badge variant="outline" className={cn("capitalize text-[11px] py-0 px-1.5", priorityStyles[p])}>
        {p}
      </Badge>
    );
  }
  // category
  const c = value as TicketCategory;
  return (
    <Badge variant="outline" className="capitalize text-[11px] py-0 px-1.5">
      {categoryLabels[c] || c}
    </Badge>
  );
}

// ─── Legacy standalone exports (backward compat) ─────────────────────────────
export function TicketStatusOnlyBadge({ status }: { status: TicketStatus }) {
  return <TicketStatusBadge type="status" value={status} />;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) return null;
  return <TicketStatusBadge type="priority" value={priority} />;
}

export function TicketCategoryBadge({ category }: { category: TicketCategory | null }) {
  if (!category) return null;
  return <TicketStatusBadge type="category" value={category} />;
}
