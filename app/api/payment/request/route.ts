export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";
import { isLiteEligible, planOf } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, note, requestedPlan } = await req.json();
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "userId and sessionToken required" }, { status: 400 });
  }
  if (!trimmedNote) {
    return NextResponse.json({ error: "note required" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("session_token, username, ko_access, plan, expires_at")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await admin
    .from("payment_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // 신규 첫 결제이거나, 이미 라이트 이용 중(만료 전) 조기결제인 경우에만 라이트 허용
  const isMidCycleLite = data.plan === "lite" && !!data.expires_at && new Date(data.expires_at) > new Date();
  const eligible = isLiteEligible(count ?? 0) || isMidCycleLite;
  const finalPlan = eligible && requestedPlan === "lite" ? "lite" : "standard";

  await admin
    .from("profiles")
    .update({
      payment_requested_at: new Date().toISOString(),
      payment_note: trimmedNote.slice(0, 200),
      payment_reject_reason: null,
      requested_plan: finalPlan,
    })
    .eq("id", userId);

  const noteLabel = data.ko_access ? "PayPal 이메일" : "입금자명";
  await sendTelegramAlert(
    `💰 [EduEng] 입금 확인 요청\n${data.username} · ${noteLabel}: ${trimmedNote.slice(0, 200)} · 희망 플랜: ${planOf(finalPlan).label}`,
    `payment-${userId}-${Date.now()}`
  );

  return NextResponse.json({ ok: true });
}
