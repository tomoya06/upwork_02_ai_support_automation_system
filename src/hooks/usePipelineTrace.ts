"use client";

import { useQuery } from "@tanstack/react-query";
import type { PipelineRun } from "@/types";

async function fetchTrace(id: string): Promise<PipelineRun | null> {
  const res = await fetch(`/api/ai/trace/${id}`);
  if (!res.ok) throw new Error("Failed to fetch trace");
  const data = await res.json();
  return data.trace;
}

export function usePipelineTrace(id: string) {
  return useQuery({
    queryKey: ["pipeline-trace", id],
    queryFn: () => fetchTrace(id),
    enabled: !!id,
  });
}
