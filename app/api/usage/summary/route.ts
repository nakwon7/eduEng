export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken } = await req.json();
  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: me } = await admin
    .from("profiles")
    .select("session_token, total_seconds, cycle_baseline_seconds")
    .eq("id", userId)
    .single();

  if (!me || me.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalSeconds = Math.max(0, (me.total_seconds ?? 0) - (me.cycle_baseline_seconds ?? 0));

  return NextResponse.json({ totalSeconds });
}
