export const dynamic = "force-dynamic";

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyActiveUser } from "@/lib/auth";
import { seoulDateKey } from "@/lib/dailyTopic";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const FALLBACK = [
  { categoryId: "daily", categoryLabel: "일상", ko: "요즘 재밌게 보고 있는 게 있어요?", en: "Is there anything you've been enjoying lately?" },
];

// 앱 안에 이미 "영화/드라마" 토픽 카테고리(TOPICS)가 따로 있어서 겹치지 않게 여기서는 제외.
// id/label은 클라이언트(DailyQuestionBanner)가 카테고리별 색상 태그와 스와이프 카드를 표시하는 데 씀.
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

function buildBatchPrompt() {
  const categoryList = CATEGORIES.map((c) => `- ${c.id}: ${c.promptHint}`).join("\n");
  return `You're writing "question of the day" small-talk questions for a Korean student practicing English on a phone-call tutoring app.

For EACH of the categories below, come up with ONE small-talk question inspired by the kind of topic in that category that might be buzzing in Korea these days. These are NOT real news lookups — just write plausible, generic, safe topics from your own knowledge. Avoid anything that could be outdated, overly specific, controversial, or a named person you're unsure about. Do NOT write about movies or TV dramas — that's a separate topic in this app.

Categories:
${categoryList}

Each question must be easy for a beginner-to-intermediate English learner to answer in a sentence or two.

Reply with ONLY a JSON array, one object per category in the order given above, nothing else:
[{"id": "kpop", "ko": "the question in Korean", "en": "the same question in English"}, ...]`;
}

// 카테고리 8개를 매 요청마다 개별 생성하면 방문자 수만큼 LLM 호출이 늘어나므로,
// 하루 1번만 배치 생성해서 daily_question_cache에 저장하고 그날은 전 사용자가 재사용한다.
async function getOrCreateDailyQuestions(): Promise<Array<{ categoryId: string; categoryLabel: string; ko: string; en: string }>> {
  const dateKey = seoulDateKey();
  const db = supabaseAdmin();

  try {
    const { data: cached } = await db
      .from("daily_question_cache")
      .select("questions")
      .eq("date_key", dateKey)
      .maybeSingle();
    if (cached?.questions?.length) return cached.questions;
  } catch {
    // 캐시 조회 실패 시 새로 생성해서 계속 진행
  }

  const completion = await getGroq().chat.completions.create({
    model: "openai/gpt-oss-120b",
    reasoning_effort: "low",
    max_tokens: 900,
    stream: false,
    messages: [{ role: "user", content: buildBatchPrompt() }],
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  if (!Array.isArray(parsed)) throw new Error("Malformed batch response");

  const questions = parsed
    .map((item: { id?: string; ko?: string; en?: string }) => {
      const cat = CATEGORIES.find((c) => c.id === item.id);
      if (!cat || !item.ko || !item.en) return null;
      return { categoryId: cat.id, categoryLabel: cat.label, ko: item.ko, en: item.en };
    })
    .filter((q): q is { categoryId: string; categoryLabel: string; ko: string; en: string } => q !== null);

  if (questions.length === 0) throw new Error("No valid questions parsed");

  try {
    await db.from("daily_question_cache").upsert({ date_key: dateKey, questions }, { onConflict: "date_key" });
  } catch {
    // 캐시 저장 실패해도 이번 응답 자체는 그대로 내려준다
  }

  return questions;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionToken } = await req.json();

    const auth = await verifyActiveUser(supabaseAdmin(), userId, sessionToken);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const questions = await getOrCreateDailyQuestions();
      return NextResponse.json({ questions });
    } catch {
      return NextResponse.json({ questions: FALLBACK });
    }
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
