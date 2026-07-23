export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, seconds, topic } = await req.json();
  if (!userId || !sessionToken || !seconds || seconds <= 0) {
    return NextResponse.json({ ok: true });
  }

  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("session_token, total_seconds")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ total_seconds: (data.total_seconds || 0) + seconds })
    .eq("id", userId);

  if (updateError) console.error("[call/end] total_seconds update error:", updateError);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const { error: insertError } = await admin
    .from("call_logs")
    .insert({ user_id: userId, date: today, seconds, ...(topic ? { topic } : {}) });

  if (insertError) {
    console.error("[call/end] call_logs insert error:", insertError);
    return NextResponse.json({ ok: true, logError: insertError.message });
  }

  return NextResponse.json({ ok: true });
}
