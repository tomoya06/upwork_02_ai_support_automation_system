import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRealtimeOptions(): any {
  // Node.js < 22 lacks native WebSocket — inject ws if available
  if (typeof WebSocket === "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ws = require("ws");
      return { realtime: { transport: ws } };
    } catch {
      return {};
    }
  }
  return {};
}

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      ...getRealtimeOptions(),
    }
  );
}
