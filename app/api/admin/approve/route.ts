export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isLiteEligible } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId, days = 30, plan = "standard" } = await req.json();

  const admin = supabaseAdmin();

  // 요청자 검증 (세션 + 관리자 확인)
  const { data: requester } = await admin
    .from("profiles")
    .select("username, session_token")
    .eq("id", userId)
    .single();

  if (!requester || requester.session_token !== sessionToken || requester.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 라이트는 (1) 결제 이력이 한 번도 없는 신규 유저의 첫 결제,
  // (2) 이미 라이트를 이용 중(만료 전)인 유저의 조기결제(사이클 중간 충전)에서만 허용.
  // 만료 후 진짜 갱신 시점에는 결제 이력이 있으므로 강제로 스탠다드가 된다.
  const { count } = await admin
    .from("payment_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", targetId);
  const { data: target } = await admin
    .from("profiles")
    .select("plan, expires_at, total_seconds")
    .eq("id", targetId)
    .single();
  const isMidCycleLite = target?.plan === "lite" && !!target?.expires_at && new Date(target.expires_at) > new Date();
  const finalPlan = plan === "lite" && (isLiteEligible(count ?? 0) || isMidCycleLite) ? "lite" : "standard";

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // 승인 시점의 누적 사용량을 스냅샷으로 남겨서, 이번 사이클 사용량 = total_seconds - cycle_baseline_seconds로
  // 계산할 수 있게 한다. 승인 전(체험 등) 사용량이 새 사이클 사용량으로 잘못 합산되는 걸 방지.
  const { error } = await admin
    .from("profiles")
    .update({
      approved: true,
      expires_at: expiresAt.toISOString(),
      plan: finalPlan,
      requested_plan: null,
      payment_requested_at: null,
      payment_reject_reason: null,
      cycle_baseline_seconds: target?.total_seconds ?? 0,
    })
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: historyError } = await admin
    .from("payment_history")
    .insert({ user_id: targetId, days, plan: finalPlan });
  if (historyError) console.error("payment_history insert failed:", historyError.message);

  return NextResponse.json({ ok: true });
}
