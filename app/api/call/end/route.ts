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
    .select("session_token, total_seconds")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ total_seconds: (data.total_seconds || 0) + seconds })
    .eq("id", userId);

  if (updateError) console.error("[call/end] total_seconds update error:", updateError);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

  // call_logs는 (user_id, date) unique 제약이 있어서, 그날 이미 행이 있으면
  // insert 대신 seconds를 누적하는 update를 해야 함 (그냥 insert하면 하루 중 두 번째
  // 저장부터 전부 23505 중복키 에러로 조용히 실패해서 통화시간이 누락됐음)
  const { data: existingLog } = await admin
    .from("call_logs")
    .select("seconds")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const { error: logError } = existingLog
    ? await admin
        .from("call_logs")
        .update({ seconds: existingLog.seconds + seconds, ...(topic ? { topic } : {}) })
        .eq("user_id", userId)
        .eq("date", today)
    : await admin
        .from("call_logs")
        .insert({ user_id: userId, date: today, seconds, ...(topic ? { topic } : {}) });

  if (logError) {
    console.error("[call/end] call_logs upsert error:", logError);
    return NextResponse.json({ ok: true, logError: logError.message });
  }

  return NextResponse.json({ ok: true });
}
