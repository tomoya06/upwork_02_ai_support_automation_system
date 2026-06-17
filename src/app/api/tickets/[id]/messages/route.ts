import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { data: messages, error } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, role = "agent", metadata } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: message, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: params.id,
        content,
        role,
        metadata: metadata || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Update ticket's updated_at
    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", params.id);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
