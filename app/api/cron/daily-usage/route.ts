export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";
import { planOf } from "@/lib/plans";

// Vercel Cron이 매일 아침(09:00 KST) 호출 — 전날(KST) 1초라도 통화한 사용자 목록을 텔레그램으로 보냄.
// 수동 확인용: GET /api/cron/daily-usage?date=2026-10-30 (Authorization: Bearer CRON_SECRET)
const TELEGRAM_MAX_LEN = 4000; // 텔레그램 메시지 한도 4096자, 여유 둠

function yesterdayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : yesterdayKst();

  const admin = supabaseAdmin();
  const { data: logs, error } = await admin
    .from("call_logs")
    .select("user_id, seconds")
    .eq("date", date)
    .gt("seconds", 0);
  if (error) {
    console.error("[cron/daily-usage] call_logs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((logs ?? []).map((l) => l.user_id)));
  const { data: users } = userIds.length
    ? await admin.from("profiles").select("id, username, name, expires_at, unlimited, plan, created_at").in("id", userIds)
    : { data: [] };
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const secondsByUser = new Map<string, number>();
  (logs ?? []).forEach((l) => secondsByUser.set(l.user_id, (secondsByUser.get(l.user_id) ?? 0) + l.seconds));

  const rows = Array.from(secondsByUser.entries())
    .map(([id, seconds]) => ({ user: userMap.get(id), seconds }))
    .filter((r) => r.user?.username !== "gooster") // 관리자 테스트 통화 제외
    .sort((a, b) => b.seconds - a.seconds);

  const totalSeconds = rows.reduce((sum, r) => sum + r.seconds, 0);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "Asia/Seoul" }).format(new Date(`${date}T12:00:00+09:00`));
  const header = `📊 ${date}(${weekday}) 사용량\n사용자 ${rows.length}명 · 총 ${formatDuration(totalSeconds)}`;

  const lines = rows.map((r, i) => {
    const u = r.user;
    const status = !u
      ? "삭제됨"
      : u.unlimited
      ? "무제한"
      : u.expires_at && new Date(u.expires_at) > new Date()
      ? planOf(u.plan).label
      : "체험/만료";
    const signupDate = u?.created_at
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(u.created_at))
      : null;
    const isNew = signupDate === date ? " 🆕" : "";
    const who = u ? `${u.name || "(이름없음)"} (${u.username})` : "(알수없음)";
    return `${i + 1}. ${who} ${formatDuration(r.seconds)} · ${status}${isNew}`;
  });

  // 길면 여러 메시지로 나눠 보냄
  const chunks: string[] = [];
  let current = header;
  for (const line of lines.length ? lines : ["통화한 사용자가 없어요."]) {
    if (current.length + line.length + 1 > TELEGRAM_MAX_LEN) {
      chunks.push(current);
      current = line;
    } else {
      current += `\n${line}`;
    }
  }
  chunks.push(current);

  for (let i = 0; i < chunks.length; i++) {
    await sendTelegramAlert(chunks[i], `daily-usage-${date}-${i}-${Date.now()}`);
  }

  return NextResponse.json({ ok: true, date, users: rows.length, totalSeconds });
}
