export const dynamic = "force-dynamic";

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyActiveUser } from "@/lib/auth";
import { getDailyItem } from "@/lib/dailyTopic";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const FALLBACK = { ko: "요즘 재밌게 보고 있는 게 있어요?", en: "Is there anything you've been enjoying lately?", categoryId: "daily", categoryLabel: "일상" };

// 앱 안에 이미 "영화/드라마" 토픽 카테고리(TOPICS)가 따로 있어서 겹치지 않게 여기서는 제외.
// 날짜 기반으로 하나씩 순환시켜 매일 다른 소재를 쓰게 강제 — 안 그러면 모델이 계속 드라마/OTT 쪽으로만 답하는 경향이 있었음.
// id/label은 클라이언트(DailyQuestionBanner)가 카테고리별 색상 태그를 표시하는 데 씀.
const CATEGORIES = [
  { id: "kpop", label: "K-pop", promptHint: "K-pop / 아이돌 소식" },
  { id: "celeb", label: "연예", promptHint: "연예인 근황이나 화제" },
  { id: "realestate", label: "부동산", promptHint: "부동산 / 집값" },
  { id: "prices", label: "물가", promptHint: "물가나 장바구니 경제" },
  { id: "stocks", label: "재테크", promptHint: "주식 / 재테크 트렌드" },
  { id: "travel", label: "여행", promptHint: "여행 / 여가 트렌드" },
  { id: "tech", label: "IT", promptHint: "IT 기기나 앱 트렌드" },
  { id: "sports", label: "스포츠", promptHint: "스포츠 이슈" },
];

function buildPrompt(category: string) {
  return `You're writing a "question of the day" for a Korean student practicing English on a phone-call tutoring app.

Today's category is: ${category}

Come up with ONE small-talk question inspired by the kind of topic in that category that might be buzzing in Korea these days. This is NOT a real news lookup — just write a plausible, generic, safe topic from your own knowledge. Avoid anything that could be outdated, overly specific, controversial, or a named person you're unsure about. Do NOT write about movies or TV dramas — that's a separate topic in this app.

The question must be easy for a beginner-to-intermediate English learner to answer in a sentence or two.

Reply with EXACTLY two lines, nothing else:
Line 1: the question in Korean
Line 2: the same question in English

No numbering, no quotes, no explanation.`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionToken } = await req.json();

    const auth = await verifyActiveUser(supabaseAdmin(), userId, sessionToken);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const category = getDailyItem(CATEGORIES);
      const completion = await getGroq().chat.completions.create({
        model: "openai/gpt-oss-120b",
        reasoning_effort: "low",
        max_tokens: 150,
        stream: false,
        messages: [{ role: "user", content: buildPrompt(category.promptHint) }],
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

      if (lines.length >= 2) {
        return NextResponse.json({ ko: lines[0], en: lines[1], categoryId: category.id, categoryLabel: category.label });
      }
      return NextResponse.json(FALLBACK);
    } catch {
      return NextResponse.json(FALLBACK);
    }
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
