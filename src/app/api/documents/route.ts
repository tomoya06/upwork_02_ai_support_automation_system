import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id") || DEFAULT_WORKSPACE_ID;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*, knowledge_chunks(count)")
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, source_url, workspace_id = DEFAULT_WORKSPACE_ID } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Create the document
    const { data: doc, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({ workspace_id, title, source_url: source_url || null, status: "active" })
      .select("*")
      .single();

    if (docError) throw docError;

    // Split content into chunks (~500 chars each)
    const chunkSize = 500;
    const overlap = 50;
    const chunks: string[] = [];
    let start = 0;
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      chunks.push(content.slice(start, end).trim());
      start = end - overlap;
      if (start >= content.length) break;
    }

    // Insert chunks (without embeddings; embeddings will be generated later via seed scripts or on-demand)
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: doc.id,
      content: chunk,
      metadata: { chunk_index: i, total_chunks: chunks.length },
    }));

    const { error: chunksError } = await supabase
      .from("knowledge_chunks")
      .insert(chunkRows);

    if (chunksError) throw chunksError;

    return NextResponse.json({ document: doc, chunks_created: chunks.length }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
