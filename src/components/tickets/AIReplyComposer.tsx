"use client";

import { useState } from "react";
import { Wand2, Send, Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerateAIReply, useSendMessage } from "@/hooks/useTickets";
import { cn } from "@/lib/utils";

interface AIReplyComposerProps {
  ticketId: string;
  isAdmin?: boolean;
  onMessageSent?: () => void;
  onLocalSend?: (content: string) => void;
}

const styleOptions = [
  { value: "full", label: "Full Reply" },
  { value: "short", label: "Short" },
  { value: "detailed", label: "Detailed" },
  { value: "next-step", label: "Next Steps" },
];

export function AIReplyComposer({
  ticketId,
  isAdmin = false,
  onMessageSent,
  onLocalSend,
}: AIReplyComposerProps) {
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState("full");
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const { mutate: generate, isPending: isGenerating } = useGenerateAIReply(ticketId);
  const { mutate: sendMsg, isPending: isSending } = useSendMessage(ticketId);

  function handleGenerate() {
    generate(style, {
      onSuccess: (data) => {
        setDraft(data.reply);
      },
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSend() {
    if (!draft.trim()) return;
    if (!isAdmin) {
      onLocalSend?.(draft.trim());
      setDraft("");
      return;
    }
    sendMsg(
      { content: draft, role: "agent" },
      {
        onSuccess: () => {
          setDraft("");
          onMessageSent?.();
        },
      }
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Textarea */}
      <textarea
        className="w-full px-4 py-3 text-sm bg-transparent resize-none outline-none min-h-[80px] max-h-[160px] placeholder:text-muted-foreground"
        placeholder={isAdmin ? "Write a reply or generate one with AI…" : "Write a demo reply (not saved)…"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />

      {/* Toolbar */}
      <div className="border-t px-3 py-2 flex items-center justify-between gap-2 bg-muted/20">
        {/* AI Generate button with style selector */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-1.5 h-8 text-xs"
              >
                <Wand2 className="h-3.5 w-3.5 text-purple-500" />
                {isGenerating ? "Generating…" : "Generate AI Reply"}
              </Button>

              {/* Style picker dropdown */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowStyleMenu((p) => !p)}
                  className="h-8 px-2 text-xs text-muted-foreground gap-0.5"
                >
                  {styleOptions.find((s) => s.value === style)?.label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showStyleMenu && (
                  <div className="absolute left-0 bottom-full mb-1 bg-popover border rounded-lg shadow-md overflow-hidden z-20 min-w-[120px]">
                    {styleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-xs hover:bg-muted",
                          style === opt.value && "font-semibold text-primary"
                        )}
                        onClick={() => {
                          setStyle(opt.value);
                          setShowStyleMenu(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Send & Copy */}
        <div className="flex items-center gap-1.5">
          {draft && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8 px-2 text-xs gap-1 text-muted-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            className="h-8 gap-1.5 text-xs"
          >
            <Send className="h-3.5 w-3.5" />
            {isSending ? "Sending…" : isAdmin ? "Send" : "Send (demo)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
