/**
 * Seed historical tickets from a public dataset.
 *
 * Expected input: a JSON file where each item has at least:
 *   { subject: string, body: string, resolution?: string, category?: string }
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   npx tsx src/seed/seed-historical-tickets.ts path/to/dataset.json
 */

import fs from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

interface RawTicket {
  subject: string;
  body: string;
  resolution?: string;
  category?: string;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx src/seed/seed-historical-tickets.ts <dataset.json>");
    process.exit(1);
  }

  const supabase = createAdminClient();
  const raw: RawTicket[] = JSON.parse(await fs.readFile(path.resolve(filePath), "utf-8"));

  console.log(`Seeding ${raw.length} historical tickets...`);

  for (const item of raw.slice(0, 200)) {
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        workspace_id: WORKSPACE_ID,
        customer_id: null,
        subject: item.subject || "No subject",
        body: item.body || "",
        status: "resolved",
        category: item.category || "general",
        priority: "medium",
        source: "historical",
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      console.error("Failed to insert ticket:", ticketError);
      continue;
    }

    // Insert customer message
    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      role: "customer",
      content: `${item.subject}\n\n${item.body}`,
    });

    // Insert resolution message if available
    if (item.resolution) {
      await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        role: "agent",
        content: item.resolution,
      });
    }
  }

  console.log("Historical tickets seeded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
