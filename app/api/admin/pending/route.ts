export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken } = await req.json();

  const admin = supabaseAdmin();

  const { data: requester } = await admin
    .from("profiles")
    .select("username, session_token")
    .eq("id", userId)
    .single();

  if (!requester || requester.session_token !== sessionToken || requester.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, username, name, email, level, trial_calls, expires_at, unlimited, blocked, total_seconds, created_at, ko_access, payment_requested_at, payment_note, plan, requested_plan, custom_minutes, cycle_baseline_seconds")
    .neq("username", "gooster")
    .order("payment_requested_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: historyRows } = await admin.from("payment_history").select("user_id");
  const countMap = new Map<string, number>();
  for (const row of historyRows || []) {
    countMap.set(row.user_id, (countMap.get(row.user_id) || 0) + 1);
  }
  const users = (data || []).map((u) => ({ ...u, payment_count: countMap.get(u.id) || 0 }));

  return NextResponse.json({ users });
}
