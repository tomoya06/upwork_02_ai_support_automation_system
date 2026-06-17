"use client";

import { formatDistanceToNow } from "date-fns";
import { Bot, User, Headphones, Info } from "lucide-react";
import type { TicketMessage } from "@/types";
import { cn } from "@/lib/utils";

interface TicketMessageThreadProps {
  messages: TicketMessage[];
}

const roleConfig = {
  customer: {
    icon: User,
    label: "Customer",
    bubble: "bg-muted text-foreground",
    side: "left",
  },
  ai: {
    icon: Bot,
    label: "AI",
    bubble: "bg-blue-50 text-blue-900 border border-blue-200",
    side: "left",
  },
  agent: {
    icon: Headphones,
    label: "Agent",
    bubble: "bg-primary text-primary-foreground",
    side: "right",
  },
  system: {
    icon: Info,
    label: "System",
    bubble: "bg-orange-50 text-orange-800 border border-orange-200",
    side: "left",
  },
} as const;

function MessageBubble({ message }: { message: TicketMessage }) {
  const role = (message.role as keyof typeof roleConfig) || "system";
  const cfg = roleConfig[role] || roleConfig.system;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex gap-3",
        cfg.side === "right" && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          role === "agent" ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div
        className={cn(
          "max-w-[75%] space-y-1",
          cfg.side === "right" && "items-end flex flex-col"
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium capitalize">{cfg.label}</span>
          <span>
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            cfg.bubble,
            cfg.side === "right"
              ? "rounded-tr-none"
              : "rounded-tl-none"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

export function TicketMessageThread({ messages }: TicketMessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Info className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No messages yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
