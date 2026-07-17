export const dynamic = "force-dynamic";

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { topic, firstName, tutorName, tutor, level } = await req.json();

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
      model: "llama-3.3-70b-versatile",
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
