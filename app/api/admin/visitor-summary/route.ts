export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isBotUserAgent } from "@/lib/visitorBot";

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
    .select("created_at")
    .gte("created_at", cutoff.toISOString());

  const kstDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(iso));

  const countMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    countMap.set(kstDay(d.toISOString()), 0);
  }
  (rows || []).forEach((r) => {
    const day = kstDay(r.created_at);
    if (countMap.has(day)) countMap.set(day, (countMap.get(day) || 0) + 1);
  });

  const visitors = Array.from(countMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const { data: recentRows } = await admin
    .from("visitor_logs")
    .select("ip, region, is_hosting, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const recent = (recentRows || []).map((r) => ({
    ip: r.ip,
    region: r.region,
    createdAt: r.created_at,
    isBot: Boolean(r.is_hosting) || isBotUserAgent(r.user_agent),
  }));

  return NextResponse.json({ visitors, recent });
}
