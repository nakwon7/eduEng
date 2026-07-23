export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, note } = await req.json();
  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "userId and sessionToken required" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("session_token")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await admin
    .from("profiles")
    .update({
      payment_requested_at: new Date().toISOString(),
      payment_note: typeof note === "string" && note.trim() ? note.trim().slice(0, 200) : null,
    })
    .eq("id", userId);

  return NextResponse.json({ ok: true });
}
