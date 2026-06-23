import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOrCreateAnonymousSession, getAnonymousSession } from "@/lib/auth/anonymous-session";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
const TEMP_TICKET_TTL_MINUTES = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const supabase = createAdminClient();
    const session = getSessionFromRequest(request);
    const anonSession = getAnonymousSession(request);

    let query = supabase
      .from("tickets")
      .select("*, customers(id, name, email, tier)")
      .eq("workspace_id", WORKSPACE_ID)
      .order("created_at", { ascending: false });

    // Filter out expired temporary tickets
    query = query.or("expires_at.is.null,expires_at.gt." + new Date().toISOString());

    // Permission isolation: anonymous users only see their own temp tickets + admin tickets
    if (!session) {
      if (anonSession) {
        query = query.or(`created_by_session.is.null,created_by_session.eq.${anonSession}`);
      } else {
        // No anon session → only see admin-created tickets
        query = query.is("created_by_session", null);
      }
    }

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;

    if (error) throw error;

    // Probabilistic cleanup of expired temp tickets
    if (Math.random() < 0.1) {
      cleanupExpiredTickets(supabase);
    }

    return NextResponse.json({ tickets: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const isAnonymous = !session;

    const body = await request.json();
    const { subject, body: ticketBody, customer_id, source = "web" } = body;

    if (!subject || !ticketBody) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build the insert payload
    const insertData: Record<string, unknown> = {
      workspace_id: WORKSPACE_ID,
      customer_id: customer_id || null,
      subject,
      body: ticketBody,
      status: "open",
      source,
    };

    if (isAnonymous) {
      // Temporary demo ticket
      const response = new NextResponse();
      const anonSessionId = getOrCreateAnonymousSession(request, response);

      insertData.expires_at = new Date(
        Date.now() + TEMP_TICKET_TTL_MINUTES * 60 * 1000
      ).toISOString();
      insertData.created_by_session = anonSessionId;
      insertData.source = "demo";

      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert(insertData)
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

      // Return with the anon cookie set
      const apiResponse = NextResponse.json({ ticket }, { status: 201 });
      const setCookie = response.cookies.get("anon_session_id");
      if (setCookie) {
        apiResponse.cookies.set("anon_session_id", setCookie.value, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
          path: "/",
        });
      }
      return apiResponse;
    }

    // Admin-created ticket (permanent)
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert(insertData)
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

async function cleanupExpiredTickets(supabase: ReturnType<typeof createAdminClient>) {
  try {
    // Find expired temp tickets
    const { data: expired } = await supabase
      .from("tickets")
      .select("id")
      .lt("expires_at", new Date().toISOString());

    if (!expired || expired.length === 0) return;

    const ids = expired.map((t) => t.id);

    // Cascade delete related data
    await supabase.from("ticket_messages").delete().in("ticket_id", ids);
    await supabase.from("pipeline_runs").delete().in("ticket_id", ids);
    await supabase.from("ticket_classifications").delete().in("ticket_id", ids);
    await supabase.from("tickets").delete().in("id", ids);
  } catch (e) {
    console.error("Temp ticket cleanup failed:", e);
  }
}
