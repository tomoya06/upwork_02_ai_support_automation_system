"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ticket, TicketMessage, PipelineRun } from "@/types";

type PipelineUIStatus =
  | "idle"
  | "starting"
  | "running"
  | "completed"
  | "failed";

async function fetchTicket(id: string): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch ticket");
  const data = await res.json();
  return data.ticket;
}

async function fetchTicketMessages(id: string): Promise<TicketMessage[]> {
  const res = await fetch(`/api/tickets/${id}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  const data = await res.json();
  return data.messages;
}

async function sendMessage(ticketId: string, content: string, role: string = "agent"): Promise<TicketMessage> {
  const res = await fetch(`/api/tickets/${ticketId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, role }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  const data = await res.json();
  return data.message;
}

async function fetchPipelineTrace(ticketId: string): Promise<PipelineRun | null> {
  const res = await fetch(`/api/ai/trace/${ticketId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.run || null;
}

async function runPipeline(ticketId: string): Promise<PipelineRun> {
  const res = await fetch(`/api/ai/pipeline/${ticketId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to run AI pipeline");
  const data = await res.json();
  return data.run;
}

async function generateAIReply(ticketId: string, style: string = "full"): Promise<{ reply: string; citations: string[] }> {
  const res = await fetch(`/api/ai/reply/${ticketId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ style }),
  });
  if (!res.ok) throw new Error("Failed to generate AI reply");
  return res.json();
}

async function fetchSimilarTickets(ticketId: string): Promise<Ticket[]> {
  const res = await fetch(`/api/ai/similar/${ticketId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tickets || [];
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id),
    enabled: !!id,
  });
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: () => fetchTicketMessages(ticketId),
    enabled: !!ticketId,
  });
}

export function useSendMessage(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, role }: { content: string; role?: string }) =>
      sendMessage(ticketId, content, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
    },
  });
}

export function usePipelineTrace(ticketId: string) {
  return useQuery({
    queryKey: ["pipeline-trace", ticketId],
    queryFn: () => fetchPipelineTrace(ticketId),
    enabled: !!ticketId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "running" ? 1000 : false;
    },
  });
}

export function useRunPipeline(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => runPipeline(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-trace", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
  });
}

export function useRunPipelineState(ticketId: string) {
  const queryClient = useQueryClient();

  // Poll the latest pipeline trace; refetchInterval is enabled while running.
  const traceQuery = usePipelineTrace(ticketId);
  const run = traceQuery.data ?? null;

  // Use a stable mutation key so the pending state survives component unmount/remount.
  const mutation = useMutation({
    mutationKey: ["run-pipeline", ticketId],
    mutationFn: async () => {
      const res = await fetch(`/api/ai/pipeline/${ticketId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start AI pipeline");
      }
      return res.json() as Promise<{ runId: string; status: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-trace", ticketId] });
    },
  });

  let status: PipelineUIStatus = "idle";
  if (mutation.isPending) {
    status = "starting";
  } else if (run?.status === "running") {
    status = "running";
  } else if (run?.status === "completed") {
    status = "completed";
  } else if (run?.status === "failed") {
    status = "failed";
  }

  // Refresh ticket data once the pipeline finishes or fails.
  useEffect(() => {
    if (status === "completed" || status === "failed") {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  }, [status, ticketId, queryClient]);

  return {
    status,
    run,
    isStarting: status === "starting",
    isRunning: status === "running",
    canRun: status !== "starting" && status !== "running",
    runPipeline: mutation.mutate,
    error: mutation.error || traceQuery.error,
  };
}

export function useGenerateAIReply(ticketId: string) {
  return useMutation({
    mutationFn: (style: string) => generateAIReply(ticketId, style),
  });
}

export function useSimilarTickets(ticketId: string) {
  return useQuery({
    queryKey: ["similar-tickets", ticketId],
    queryFn: () => fetchSimilarTickets(ticketId),
    enabled: !!ticketId,
  });
}

interface TicketsFilters {
  status?: string;
  category?: string;
  priority?: string;
}

async function fetchTickets(filters: TicketsFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.priority) params.set("priority", filters.priority);

  const res = await fetch(`/api/tickets?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  const data = await res.json();
  return data.tickets;
}

async function createTicket(payload: {
  subject: string;
  body: string;
  customer_id?: string;
}): Promise<Ticket> {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create ticket");
  const data = await res.json();
  return data.ticket;
}

async function updateTicket(
  id: string,
  payload: Partial<Ticket>
): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update ticket");
  const data = await res.json();
  return data.ticket;
}

export function useTickets(filters: TicketsFilters = {}) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => fetchTickets(filters),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Ticket> }) =>
      updateTicket(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
    },
  });
}
