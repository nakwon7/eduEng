export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, sinceDate } = await req.json();
  if (!userId || !sessionToken || !sinceDate) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: me } = await admin
    .from("profiles")
    .select("session_token")
    .eq("id", userId)
    .single();

  if (!me || me.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: logs, error } = await admin
    .from("call_logs")
    .select("seconds")
    .eq("user_id", userId)
    .gte("date", sinceDate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalSeconds = (logs || []).reduce((s: number, l: { seconds: number }) => s + l.seconds, 0);

  return NextResponse.json({ totalSeconds });
}
