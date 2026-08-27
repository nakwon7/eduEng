export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isBotUserAgent, findSuspiciousUaHourBuckets } from "@/lib/visitorBot";

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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);

  const { data: rows } = await admin
    .from("visitor_logs")
    .select("ip, created_at, is_hosting, user_agent, hour_bucket")
    .gte("created_at", cutoff.toISOString());

  // hosting IP 키워드 목록에 없는 대역(예: 국내 미등록 클라우드)을 잡아내기 위해,
  // 같은 UA가 한 시간 내 서로 다른 IP 3곳 이상에서 찍히면 봇으로 간주
  const suspiciousUaBuckets = findSuspiciousUaHourBuckets(rows || []);
  const isSuspiciousUaRow = (r: { user_agent: string | null; hour_bucket: string }) =>
    !!r.user_agent && suspiciousUaBuckets.has(`${r.hour_bucket}||${r.user_agent}`);

  const kstDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(iso));

  const countMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    countMap.set(kstDay(d.toISOString()), 0);
  }
  (rows || []).forEach((r) => {
    // 같은 봇이 Cloudflare 등 대역의 IP를 바꿔가며 접속해 (ip, hour_bucket) 유니크 제약을
    // 우회하는 경우가 있어, 방문자수 집계에서는 hosting/봇으로 판별된 행을 제외
    if (r.is_hosting || isBotUserAgent(r.user_agent) || isSuspiciousUaRow(r)) return;
    const day = kstDay(r.created_at);
    if (countMap.has(day)) countMap.set(day, (countMap.get(day) || 0) + 1);
  });

  const visitors = Array.from(countMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const { data: recentRows } = await admin
    .from("visitor_logs")
    .select("ip, region, is_hosting, user_agent, hour_bucket, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const recent = (recentRows || []).map((r) => ({
    ip: r.ip,
    region: r.region,
    createdAt: r.created_at,
    isBot: Boolean(r.is_hosting) || isBotUserAgent(r.user_agent) || isSuspiciousUaRow(r),
  }));

  return NextResponse.json({ visitors, recent });
}
