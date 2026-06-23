import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFromRequest } from "@/lib/auth/session";

/**
 * POST /api/admin/migrate-rate-limits
 * 
 * Temporary migration endpoint to create the rate_limits table.
 * Requires admin authentication. Delete this file after migration is complete.
 */
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // Create rate_limits table
    const { error: tableError } = await supabase.rpc("exec_sql", {
      sql: `CREATE TABLE IF NOT EXISTS rate_limits (
        id bigserial PRIMARY KEY,
        bucket text NOT NULL DEFAULT 'anonymous_global',
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
    });

    // If rpc doesn't exist, try direct SQL via rest
    if (tableError) {
      // Use the management approach: check if table exists first
      const { data: existingTable } = await supabase
        .from("rate_limits")
        .select("*")
        .limit(1);

      if (existingTable !== undefined) {
        // Table already exists
        return NextResponse.json({ 
          success: true, 
          message: "rate_limits table already exists" 
        });
      }

      // Table doesn't exist and we can't create it via RPC
      return NextResponse.json({ 
        error: "Cannot create table via API. Please run the SQL manually.",
        sql: `CREATE TABLE IF NOT EXISTS rate_limits (
          id bigserial PRIMARY KEY,
          bucket text NOT NULL DEFAULT 'anonymous_global',
          created_at timestamptz NOT NULL DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_created 
        ON rate_limits (bucket, created_at);`,
      }, { status: 500 });
    }

    // Create index
    await supabase.rpc("exec_sql", {
      sql: `CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_created 
            ON rate_limits (bucket, created_at)`,
    });

    return NextResponse.json({ 
      success: true, 
      message: "rate_limits table created successfully" 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
