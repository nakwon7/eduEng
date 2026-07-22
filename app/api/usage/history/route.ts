export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, year, month } = await req.json();
  if (!userId || !sessionToken || !year || !month) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: me } = await admin
    .from("profiles")
    .select("session_token")
    .eq("id", userId)
    .single();

  if (!me || me.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthStart =
    month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { data: logs, error } = await admin
    .from("call_logs")
    .select("date, seconds")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lt("date", nextMonthStart);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byDate = new Map<string, number>();
  for (const log of logs || []) {
    byDate.set(log.date, (byDate.get(log.date) || 0) + log.seconds);
  }
  const aggregated = Array.from(byDate.entries())
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return NextResponse.json({ logs: aggregated });
}
