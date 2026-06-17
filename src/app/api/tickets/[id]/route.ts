import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, customers(id, name, email, tier)")
      .eq("id", params.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: true });

    const { data: classifications } = await supabase
      .from("ticket_classifications")
      .select("*")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: false });

    const { data: decisions } = await supabase
      .from("decisions")
      .select("*")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      ticket,
      messages: messages || [],
      classifications: classifications || [],
      decisions: decisions || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("tickets")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ticket: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
