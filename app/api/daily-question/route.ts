export const dynamic = "force-dynamic";

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyActiveUser } from "@/lib/auth";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const FALLBACK = { ko: "요즘 재밌게 보고 있는 게 있어요?", en: "Is there anything you've been enjoying lately?" };

const PROMPT = `You're writing a "question of the day" for a Korean student practicing English on a phone-call tutoring app.

Come up with ONE small-talk question inspired by the kind of entertainment or economy topic that might be buzzing in Korea these days (a movie, a drama, a celebrity, prices, real estate, trends, etc). This is NOT a real news lookup — just write a plausible, generic, safe topic from your own knowledge. Avoid anything that could be outdated, overly specific, controversial, or a named person you're unsure about.

The question must be easy for a beginner-to-intermediate English learner to answer in a sentence or two.

Reply with EXACTLY two lines, nothing else:
Line 1: the question in Korean
Line 2: the same question in English

No numbering, no quotes, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionToken } = await req.json();

    const auth = await verifyActiveUser(supabaseAdmin(), userId, sessionToken);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const completion = await getGroq().chat.completions.create({
        model: "openai/gpt-oss-120b",
        reasoning_effort: "low",
        max_tokens: 150,
        stream: false,
        messages: [{ role: "user", content: PROMPT }],
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

      if (lines.length >= 2) {
        return NextResponse.json({ ko: lines[0], en: lines[1] });
      }
      return NextResponse.json(FALLBACK);
    } catch {
      return NextResponse.json(FALLBACK);
    }
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
