export const dynamic = "force-dynamic";

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyActiveUser } from "@/lib/auth";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const LANGUAGE_LOCK = `ABSOLUTE RULE — READ THIS FIRST:
Your output must contain ONLY Korean (한글) and English letters/numbers.
NEVER write any Hindi, Spanish, Russian, Chinese, Japanese, Arabic, or any other script.
If you catch yourself about to write a non-Korean/non-English character, stop and rewrite in Korean.
Violating this rule is a critical failure.

`;

// 한글/영문 외 문자 제거 (chat-ko와 동일한 필터링)
function sanitizeKorean(text: string): string {
  const badCharPattern = /[^가-힣ᄀ-ᇿ㄰-㆏ꥠ-꥿ힰ-퟿\u0020-\u007E]/;
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\(\[【][A-Za-z][A-Za-z\s]*[\)\]】]/g, "")
    .split(/(\s+)/)
    .map((token) => (badCharPattern.test(token) ? "" : token))
    .join("")
    .replace(/(?<=[가-힣])[a-zA-Z]+(?=[가-힣])/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { topic, firstName, tutorName, tutor, level, userId, sessionToken } = await req.json();

    const auth = await verifyActiveUser(supabaseAdmin(), userId, sessionToken);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const isKorean = tutor === "minjun" || tutor === "jia";

    if (isKorean) {
      const persona =
        tutor === "jia"
          ? `You are Jia (지아), a warm and patient female Korean language tutor. When introducing yourself, say "저는 지아예요" (NOT 지아이에요).`
          : `You are MinJun (민준), a friendly male Korean language tutor.`;

      const levelNote =
        level === "beginner"
          ? "Use very simple Korean (short words, basic particles). Use honorifics (존댓말). Add a short English hint if helpful."
          : level === "advanced"
          ? "Use natural everyday Korean, including colloquial expressions."
          : "Use everyday Korean with basic sentence structures. Mostly 존댓말.";

      const isWordPractice = topic === "Word Practice";

      const prompt = isWordPractice
        ? `${LANGUAGE_LOCK}${persona}

You're starting a Korean Word Practice phone lesson with a foreign student named ${firstName}.
${levelNote}

Generate a natural opening in Korean that:
- Greets ${firstName} by name and introduces yourself as ${tutorName}
- Briefly explains the game in one casual sentence (they practice using a Korean word/phrase in a sentence)
- Immediately gives the first Korean word or phrase to practice, suited to a ${level || "beginner"} level student
- Keep it to 2-3 sentences total, natural and warm
- The entire opening must be in Korean. English is allowed only as a 1-3 word gloss for a single unfamiliar word, never as a full sentence

Reply with ONLY the opening. No quotes, no explanation.`
        : `${LANGUAGE_LOCK}${persona}

You're starting a phone Korean-language lesson with a foreign student named ${firstName}.
Today's topic: ${topic}
${levelNote}

Generate ONE natural, engaging opening line in Korean to start the conversation — as if you just called them on the phone.
- Address them by name (${firstName})
- Mention your name (${tutorName}) naturally
- Jump straight into the topic with a question or scenario, in Korean
- Keep it to 1-2 sentences max
- Sound warm and human, not scripted
- The entire opening must be in Korean. English is allowed only as a 1-3 word gloss for a single unfamiliar word, never as a full sentence

Reply with ONLY the opening line. No quotes, no explanation.`;

      const completion = await getGroq().chat.completions.create({
        model: "openai/gpt-oss-120b",
        reasoning_effort: "low",
        max_tokens: 250,
        stream: false,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      const greeting = raw ? sanitizeKorean(raw) : "";

      return NextResponse.json({
        greeting: greeting || `안녕하세요, ${firstName}! 저는 ${tutorName}이에요. 오늘도 한국어 연습 해봐요!`,
      });
    }

    const persona =
      tutor === "rachel"
        ? `You are Rachel, a warm and patient female English tutor.`
        : `You are Alex, a friendly and upbeat male English tutor.`;

    const levelNote =
      level === "beginner"
        ? "Use simple, easy-to-understand language."
        : level === "advanced"
        ? "Use natural, native-level expressions."
        : "Use everyday conversational language.";

    const isWordDescription = topic === "Word Description";

    const prompt = isWordDescription
      ? `${persona}

You're starting a Word Description phone lesson with a Korean student named ${firstName}.
${levelNote}

Generate a natural opening that:
- Greets ${firstName} by name and introduces yourself as ${tutorName}
- Briefly explains the game in one casual sentence (they describe a word in English without saying it)
- Immediately gives the first word to describe — pick a ${level === "beginner" ? "simple everyday" : level === "advanced" ? "nuanced or idiomatic" : "moderately challenging"} English word
- Format: greeting + game intro + "Your first word is: [WORD]. Go!"
- Keep it to 2-3 sentences total, natural and energetic

Reply with ONLY the opening. No quotes, no explanation.`
      : `${persona}

You're starting a phone English lesson with a Korean student named ${firstName}.
Today's topic: ${topic}
${levelNote}

Generate ONE natural, engaging opening line to start the conversation — as if you just called them on the phone.
- Address them by name (${firstName})
- Mention your name (${tutorName}) naturally
- Jump straight into the topic with a question or scenario
- Keep it to 1-2 sentences max
- Sound warm and human, not scripted

Reply with ONLY the opening line. No quotes, no explanation.`;

    const completion = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-120b",
      reasoning_effort: "low",
      max_tokens: 100,
      stream: false,
      messages: [{ role: "user", content: prompt }],
    });

    const greeting = completion.choices[0]?.message?.content?.trim() ??
      `Hey ${firstName}! This is ${tutorName}. Ready to practice some English today?`;

    return NextResponse.json({ greeting });
  } catch (error) {
    console.error("Greeting API error:", error);
    return NextResponse.json({ error: "Failed to generate greeting" }, { status: 500 });
  }
}
