import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromRequest } from "@/lib/auth/session";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const supabase = createAdminClient();
    let query = supabase
      .from("tickets")
      .select("*, customers(id, name, email, tier)")
      .eq("workspace_id", WORKSPACE_ID)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ tickets: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, body: ticketBody, customer_id, source = "web" } = body;

    if (!subject || !ticketBody) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        workspace_id: WORKSPACE_ID,
        customer_id: customer_id || null,
        subject,
        body: ticketBody,
        status: "open",
        source,
      })
      .select("*")
      .single();

    if (ticketError || !ticket) {
      throw ticketError || new Error("Failed to create ticket");
    }

    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      role: "customer",
      content: ticketBody,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
