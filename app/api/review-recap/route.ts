export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyActiveUser } from "@/lib/auth";
import { getDailyItem } from "@/lib/dailyTopic";

const LOOKBACK_DAYS = 30;
const FETCH_LIMIT = 50;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionToken } = await req.json();

    const auth = await verifyActiveUser(supabaseAdmin(), userId, sessionToken);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: mistakes } = await supabaseAdmin()
      .from("mistakes")
      .select("original, corrected, explanation, topic")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);

    if (!mistakes || mistakes.length === 0) {
      return NextResponse.json({ mistake: null });
    }

    // 같은 표현을 여러 번 틀렸으면 최신 1건만 남김 (최신순 정렬이라 먼저 나온 것을 유지)
    const seen = new Set<string>();
    const deduped = mistakes.filter((m) => {
      const key = normalize(m.corrected);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const mistake = getDailyItem(deduped);
    return NextResponse.json({ mistake });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
