import { HfInference } from "@huggingface/inference";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWithProxy } from "@/lib/fetch-with-proxy";

let _hf: HfInference | null = null;
function getHf(): HfInference {
  if (!_hf) _hf = new HfInference(config.embeddings.huggingfaceApiKey, { fetch: fetchWithProxy });
  return _hf;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const hf = getHf();
  const result = await hf.featureExtraction({
    model: config.embeddings.model,
    inputs: text.replace(/\n+/g, " ").trim().slice(0, 512),
  });

  // Handle both number[][] and number[] return shapes
  const embeddings = Array.isArray(result[0]) ? (result as number[][])[0] : (result as number[]);
  return embeddings;
}

export async function searchKnowledge(
  embedding: number[],
  workspaceId: string,
  matchThreshold = 0.5,
  matchCount = 5
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    p_workspace_id: workspaceId,
  });

  if (error) throw error;
  return data || [];
}

export async function searchSimilarTickets(
  embedding: number[],
  ticketId: string,
  workspaceId: string,
  matchCount = 5
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_similar_tickets", {
    query_embedding: embedding,
    target_ticket_id: ticketId,
    p_workspace_id: workspaceId,
    match_count: matchCount,
  });

  if (error) throw error;
  return data || [];
}

export async function storeTicketEmbedding(
  ticketId: string,
  workspaceId: string,
  embedding: number[]
) {
  const supabase = createAdminClient();

  // Ensure a "ticket_embeddings" document exists for this workspace
  const { data: doc } = await supabase
    .from("knowledge_documents")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("title", "ticket_embeddings")
    .single();

  let documentId = doc?.id;
  if (!documentId) {
    const { data: newDoc } = await supabase
      .from("knowledge_documents")
      .insert({ workspace_id: workspaceId, title: "ticket_embeddings", status: "active" })
      .select("id")
      .single();
    documentId = newDoc?.id;
  }

  if (!documentId) throw new Error("Failed to create ticket_embeddings document");

  await supabase.from("knowledge_chunks").insert({
    document_id: documentId,
    content: `ticket:${ticketId}`,
    embedding,
    metadata: { ticket_id: ticketId, type: "ticket_embedding" },
  });
}
