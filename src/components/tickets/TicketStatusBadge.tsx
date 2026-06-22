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

// Solid-bordered category badges: each category has its own color.
const categoryStyles: Record<TicketCategory, string> = {
  billing:
    "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100",
  technical:
    "bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100",
  account:
    "bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100",
  refund:
    "bg-red-50 text-red-800 border-red-300 hover:bg-red-100",
  feature_request:
    "bg-green-50 text-green-800 border-green-300 hover:bg-green-100",
  general:
    "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100",
};

// Dashed-bordered priority badges: visually distinct from categories.
const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-50 text-slate-700 border-slate-300 border-dashed",
  medium:
    "bg-orange-50 text-orange-700 border-orange-300 border-dashed",
  high: "bg-red-50 text-red-700 border-red-300 border-dashed",
  critical:
    "bg-purple-50 text-purple-700 border-purple-300 border-dashed",
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
      <Badge
        variant="outline"
        className={cn(
          "capitalize text-[11px] py-0 px-1.5 border-dashed",
          priorityStyles[p]
        )}
      >
        {p}
      </Badge>
    );
  }
  // category: solid border, category-specific color
  const c = value as TicketCategory;
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-[11px] py-0 px-1.5",
        categoryStyles[c]
      )}
    >
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
