export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId } = await req.json();
  if (!userId || !sessionToken || !targetId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: me } = await admin
    .from("profiles")
    .select("session_token, username")
    .eq("id", userId)
    .single();

  if (!me || me.session_token !== sessionToken || me.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: logs } = await admin
    .from("call_logs")
    .select("date, seconds")
    .eq("user_id", targetId)
    .order("date", { ascending: false })
    .limit(30);

  return NextResponse.json({ logs: logs || [] });
}
