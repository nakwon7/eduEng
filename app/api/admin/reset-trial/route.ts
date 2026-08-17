export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId } = await req.json();

  const admin = supabaseAdmin();

  const { data: requester } = await admin
    .from("profiles")
    .select("username, session_token")
    .eq("id", userId)
    .single();

  if (!requester || requester.session_token !== sessionToken || requester.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: target } = await admin
    .from("profiles")
    .select("total_seconds")
    .eq("id", targetId)
    .single();

  const { error } = await admin
    .from("profiles")
    .update({ trial_baseline_seconds: target?.total_seconds ?? 0, trial_reset_at: new Date().toISOString() })
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
