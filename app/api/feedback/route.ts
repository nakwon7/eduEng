import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

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

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are an English teaching expert. Respond with valid JSON only, no markdown or extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const feedback = JSON.parse(text);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
