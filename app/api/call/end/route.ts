export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, seconds, topic } = await req.json();
  if (!userId || !sessionToken || !seconds || seconds <= 0) {
    return NextResponse.json({ ok: true });
  }

  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("session_token")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

  // read-then-write는 동시 저장 요청(60초 주기 자동저장 + 통화종료 저장이 겹치는 경우 등)에서
  // 레이스 컨디션으로 값을 잃어버리거나 call_logs unique 제약(user_id, date) 위반이 나므로,
  // DB 함수 하나로 total_seconds 증가 + call_logs upsert를 원자적으로 처리
  const { error } = await admin.rpc("record_call_time", {
    p_user_id: userId,
    p_date: today,
    p_seconds: seconds,
    p_topic: topic || null,
  });

  if (error) {
    console.error("[call/end] record_call_time error:", error);
    return NextResponse.json({ ok: true, logError: error.message });
  }

  return NextResponse.json({ ok: true });
}
