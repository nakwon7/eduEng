export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken } = await req.json();

  const admin = supabaseAdmin();

  const { data: me } = await admin
    .from("profiles")
    .select("session_token, username")
    .eq("id", userId)
    .single();

  if (!me || me.session_token !== sessionToken || me.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: logs }, { data: users }] = await Promise.all([
    admin.from("call_logs").select("user_id, date, seconds, topic"),
    admin.from("profiles").select("id, username, name, level, trial_calls, expires_at, unlimited, total_seconds, created_at"),
  ]);

  const allLogs = logs || [];
  const allUsers = users || [];

  // 일별 (최근 30일)
  const dailyMap = new Map<string, { seconds: number; calls: number }>();
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 29);
  allLogs.forEach((l) => {
    if (new Date(l.date) < cutoff30) return;
    const cur = dailyMap.get(l.date) || { seconds: 0, calls: 0 };
    dailyMap.set(l.date, { seconds: cur.seconds + l.seconds, calls: cur.calls + 1 });
  });
  const daily = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 월별 (최근 12개월)
  const monthlyMap = new Map<string, { seconds: number; calls: number }>();
  const cutoff12 = new Date();
  cutoff12.setMonth(cutoff12.getMonth() - 11);
  cutoff12.setDate(1);
  allLogs.forEach((l) => {
    if (new Date(l.date) < cutoff12) return;
    const month = l.date.slice(0, 7);
    const cur = monthlyMap.get(month) || { seconds: 0, calls: 0 };
    monthlyMap.set(month, { seconds: cur.seconds + l.seconds, calls: cur.calls + 1 });
  });
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 연별
  const yearlyMap = new Map<string, { seconds: number; calls: number }>();
  allLogs.forEach((l) => {
    const year = l.date.slice(0, 4);
    const cur = yearlyMap.get(year) || { seconds: 0, calls: 0 };
    yearlyMap.set(year, { seconds: cur.seconds + l.seconds, calls: cur.calls + 1 });
  });
  const yearly = Array.from(yearlyMap.entries())
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year.localeCompare(b.year));

  // 주제별
  const topicMap = new Map<string, { seconds: number; calls: number }>();
  allLogs.forEach((l) => {
    const t = l.topic || "기타";
    const cur = topicMap.get(t) || { seconds: 0, calls: 0 };
    topicMap.set(t, { seconds: cur.seconds + l.seconds, calls: cur.calls + 1 });
  });
  const byTopic = Array.from(topicMap.entries())
    .map(([topic, v]) => ({ topic, ...v }))
    .sort((a, b) => b.seconds - a.seconds);

  // 사용자별
  const byUser = allUsers.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    level: u.level,
    total_seconds: u.total_seconds || 0,
    created_at: u.created_at,
    status: u.unlimited
      ? "무제한"
      : u.expires_at && new Date(u.expires_at) > new Date()
      ? "멤버십"
      : u.trial_calls > 0
      ? `체험 ${u.trial_calls}회`
      : "체험 소진",
  })).sort((a, b) => b.total_seconds - a.total_seconds);

  return NextResponse.json({ daily, monthly, yearly, byTopic, byUser });
}
