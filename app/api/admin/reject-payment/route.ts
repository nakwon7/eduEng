export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_REASON = "확인되지 않았어요. 내역을 다시 확인한 뒤 요청해주세요.";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId, reason } = await req.json();

  const admin = supabaseAdmin();

  const { data: requester } = await admin
    .from("profiles")
    .select("username, session_token")
    .eq("id", userId)
    .single();

  if (!requester || requester.session_token !== sessionToken || requester.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";

  const { error } = await admin
    .from("profiles")
    .update({
      payment_requested_at: null,
      payment_note: null,
      payment_reject_reason: (trimmedReason || DEFAULT_REASON).slice(0, 300),
    })
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
