export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, seconds } = await req.json();
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

  await admin
    .from("profiles")
    .update({ total_seconds: (data.total_seconds || 0) + seconds })
    .eq("id", userId);

  const today = new Date().toISOString().split("T")[0];
  const { data: logData } = await admin
    .from("call_logs")
    .select("seconds")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (logData) {
    await admin
      .from("call_logs")
      .update({ seconds: logData.seconds + seconds })
      .eq("user_id", userId)
      .eq("date", today);
  } else {
    await admin
      .from("call_logs")
      .insert({ user_id: userId, date: today, seconds });
  }

  return NextResponse.json({ ok: true });
}
