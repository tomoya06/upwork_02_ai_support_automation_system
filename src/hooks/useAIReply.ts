"use client";

import { useMutation } from "@tanstack/react-query";
import type { ReplyResult } from "@/types";

async function generateReply(
  id: string,
  style: "full" | "short" | "detailed" | "next-step" = "full"
): Promise<{ reply: ReplyResult; knowledgeSnippets: unknown[]; similarTickets: unknown[] }> {
  const res = await fetch(`/api/ai/reply/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ style }),
  });
  if (!res.ok) throw new Error("Failed to generate reply");
  return res.json();
}

async function runPipeline(id: string): Promise<unknown> {
  const res = await fetch(`/api/ai/pipeline/${id}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to run pipeline");
  return res.json();
}

async function classifyTicket(id: string): Promise<unknown> {
  const res = await fetch(`/api/ai/classify/${id}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to classify ticket");
  return res.json();
}

export function useGenerateReply() {
  return useMutation({
    mutationFn: ({ id, style }: { id: string; style?: "full" | "short" | "detailed" | "next-step" }) =>
      generateReply(id, style),
  });
}

export function useRunPipeline() {
  return useMutation({
    mutationFn: runPipeline,
  });
}

export function useClassifyTicket() {
  return useMutation({
    mutationFn: classifyTicket,
  });
}
