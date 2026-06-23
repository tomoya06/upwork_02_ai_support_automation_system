import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth/session";
import { verifyAdminCredentials } from "@/lib/auth/admin";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { username, password } = parsed.data;
    if (!verifyAdminCredentials({ username, password })) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSession({ role: "admin" });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
