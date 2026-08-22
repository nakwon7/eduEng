export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { effectiveMinutes } from "@/lib/plans";

// 활성 멤버십 유저에게 만료일/사이클은 그대로 두고 이번 사이클 분량만 얹어준다.
// (approve 라우트는 plan/expires_at을 통째로 새로 세팅하는 구조라 기존 멤버십을
// 덮어써버리므로, 순수 보너스 지급에는 쓸 수 없어 별도 라우트로 분리)
export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId, bonusMinutes } = await req.json();
  if (!targetId || !Number.isFinite(bonusMinutes) || bonusMinutes <= 0) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

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
    .select("plan, expires_at, custom_minutes")
    .eq("id", targetId)
    .single();

  if (!target || !target.expires_at || new Date(target.expires_at) <= new Date()) {
    return NextResponse.json({ error: "활성 멤버십이 아닙니다" }, { status: 400 });
  }

  const newCustomMinutes = effectiveMinutes(target.plan, target.custom_minutes) + bonusMinutes;

  const { error } = await admin
    .from("profiles")
    .update({ custom_minutes: newCustomMinutes })
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, customMinutes: newCustomMinutes });
}
