import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyActiveUser } from "@/lib/auth";
import { GOAL_TOPICS } from "@/lib/goalTopics";

// 히라가나/가타카나는 한국어·영어에는 절대 나오지 않는 일본어 전용 문자 범위라
// 이 범위가 감지되면 응답에 일본어가 섞였다는 확실한 신호로 판단한다.
const JAPANESE_KANA_REGEX = /[぀-ゟ゠-ヿｦ-ﾝ]/;
const JAPANESE_KANA_REGEX_GLOBAL = /[぀-ゟ゠-ヿｦ-ﾝ]/g;

function containsJapanese(text: string): boolean {
  return JAPANESE_KANA_REGEX.test(text);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

// goodPhrases는 모델이 실제 대화에 없는 문장을 지어내는 경우가 있어,
// 학생이 실제로 말한 텍스트에 포함된 것만 남긴다.
function filterGoodPhrases(phrases: unknown, studentText: string): string[] {
  if (!Array.isArray(phrases)) return [];
  const normalizedStudentText = normalize(studentText);
  return phrases.filter(
    (p): p is string => typeof p === "string" && normalizedStudentText.includes(normalize(p))
  );
}

// corrections는 모델이 original/corrected를 (아포스트로피 종류 등) 눈에 안 보이는
// 차이만 남기고 사실상 동일한 문장으로 반환하는 경우가 있어, 정규화 후 같으면 제외한다.
// 또한 goodPhrases와 달리 original이 학생이 실제로 말한 내용인지 검증하지 않아서 모델이
// 실제 발화와 무관한 문장을 지어내도(할루시네이션) 걸러지지 않는 문제가 있었음 — 동일하게
// studentText에 포함된 경우만 남기도록 검증을 추가한다.
function filterCorrections(corrections: unknown, studentText: string): unknown[] {
  if (!Array.isArray(corrections)) return [];
  const normalizedStudentText = normalize(studentText);
  return corrections.filter((c) => {
    if (!c || typeof c !== "object") return false;
    const { original, corrected } = c as { original?: unknown; corrected?: unknown };
    if (typeof original !== "string" || typeof corrected !== "string") return false;
    if (normalize(original) === normalize(corrected)) return false;
    return normalizedStudentText.includes(normalize(original));
  });
}

// 재시도 후에도 일본어가 남아있을 때의 최후 수단: 가나 문자만 제거한다.
function stripJapanese<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(JAPANESE_KANA_REGEX_GLOBAL, "") as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(stripJapanese) as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, stripJapanese(v)])
    ) as unknown as T;
  }
  return value;
}

export async function POST(req: NextRequest) {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const { messages, topic, profile, userId, sessionToken } = await req.json();

    const auth = await verifyActiveUser(supabaseAdmin(), userId, sessionToken);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!messages || messages.length < 3) {
      return NextResponse.json({ error: "Not enough conversation" }, { status: 400 });
    }

    const conversationText = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`
      )
      .join("\n");

    const studentText = messages
      .filter((m: { role: string; content: string }) => m.role === "user")
      .map((m: { role: string; content: string }) => m.content)
      .join(" ");

    const levelLabel =
      profile?.level === "beginner" ? "초급" :
      profile?.level === "advanced" ? "고급" : "중급";

    const goalTopicLabel = GOAL_TOPICS.find((t) => t.id === profile?.goalTopic)?.en;

    const prompt = `You are an English teaching expert. Analyze this English phone conversation and give constructive feedback in Korean (except for English examples).

Topic: ${topic}
Student level: ${levelLabel}${goalTopicLabel ? `\nStudent's interest area: ${goalTopicLabel}` : ""}

Conversation:
${conversationText}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentences in Korean assessing how the student did overall — be encouraging",
  "corrections": [
    {
      "original": "what the student said (keep it short, the key wrong part)",
      "corrected": "the correct version",
      "explanation": "short explanation in Korean"
    }
  ],
  "goodPhrases": ["exact phrase the student used well"],
  "suggestions": ["useful English expression related to the topic", "another phrase"],
  "levelTip": "one actionable tip in Korean for this student's level"
}

Rules:
- corrections: only real grammar/expression errors (max 3). Empty array if no errors.
- goodPhrases: English phrases the student used correctly and naturally (max 3). Empty array if none.
- suggestions: up to 10 helpful English expressions relevant to the topic, ordered from most to least relevant/useful. Do not pad with generic filler just to reach 10 — fewer high-quality suggestions are better than 10 weak ones. If the student's interest area is given, prioritize expressions relevant to it when natural.
- Be warm and encouraging, not harsh
- JSON only, no markdown`;

    const messagesForModel: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are an English teaching expert. Respond with valid JSON only, no markdown or extra text.",
      },
      { role: "user", content: prompt },
    ];

    let feedback;
    let hadContamination = false;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        reasoning_effort: "low",
        max_tokens: 1000,
        messages: messagesForModel,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content || "{}";
      feedback = JSON.parse(text);

      if (!containsJapanese(text)) break;
      hadContamination = true;
      if (attempt === maxAttempts) break;
    }

    if (hadContamination) {
      const stillContaminated = feedback && containsJapanese(JSON.stringify(feedback));
      await sendTelegramAlert(
        `⚠️ [EduEng] 피드백 응답에 일본어 오염 감지\n${stillContaminated ? "재시도 후에도 남아있어 가나 문자 제거됨" : "재시도로 정상 복구됨"}`,
        "feedback-japanese"
      );
    }

    if (feedback && containsJapanese(JSON.stringify(feedback))) {
      feedback = stripJapanese(feedback);
    }

    if (feedback) {
      feedback.goodPhrases = filterGoodPhrases(feedback.goodPhrases, studentText);
      feedback.corrections = filterCorrections(feedback.corrections, studentText);

      // 오답노트(복습 기능) 재료로 저장 — 실패해도 피드백 응답 자체는 그대로 내려준다
      if (Array.isArray(feedback.corrections) && feedback.corrections.length > 0) {
        const rows = (feedback.corrections as { original: string; corrected: string; explanation?: string }[]).map((c) => ({
          user_id: userId,
          original: c.original,
          corrected: c.corrected,
          explanation: c.explanation ?? null,
          topic: topic ?? null,
        }));
        const { error: mistakesError } = await supabaseAdmin().from("mistakes").insert(rows);
        if (mistakesError) console.error("[feedback] mistakes insert failed", mistakesError);
      }
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
