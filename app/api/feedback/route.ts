import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

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
    const { messages, topic, profile } = await req.json();

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

    const prompt = `You are an English teaching expert. Analyze this English phone conversation and give constructive feedback in Korean (except for English examples).

Topic: ${topic}
Student level: ${levelLabel}

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
- suggestions: 2-3 helpful English expressions relevant to the topic
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
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        reasoning_effort: "low",
        max_tokens: 800,
        messages: messagesForModel,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content || "{}";
      feedback = JSON.parse(text);

      if (!containsJapanese(text) || attempt === maxAttempts) break;
    }

    if (feedback && containsJapanese(JSON.stringify(feedback))) {
      feedback = stripJapanese(feedback);
    }

    if (feedback) {
      feedback.goodPhrases = filterGoodPhrases(feedback.goodPhrases, studentText);
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
