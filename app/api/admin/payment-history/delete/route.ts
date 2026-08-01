export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId, historyId } = await req.json();
  if (!userId || !sessionToken || !targetId || !historyId) {
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

  const { error: deleteError } = await admin
    .from("payment_history")
    .delete()
    .eq("id", historyId)
    .eq("user_id", targetId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // expires_at을 남은 이력 중 가장 최근 걸로 재계산 (없으면 null)
  const { data: remaining } = await admin
    .from("payment_history")
    .select("days, approved_at")
    .eq("user_id", targetId)
    .order("approved_at", { ascending: false })
    .limit(1);

  let newExpiresAt: string | null = null;
  if (remaining && remaining.length > 0) {
    const d = new Date(remaining[0].approved_at);
    d.setDate(d.getDate() + remaining[0].days);
    newExpiresAt = d.toISOString();
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ expires_at: newExpiresAt })
    .eq("id", targetId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, expires_at: newExpiresAt });
}
