import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Alex, a friendly English tutor having a phone conversation with a Korean student.

Rules:
- Always respond in English only
- Keep responses SHORT (2-3 sentences max) — this is a phone call, not an essay
- Be warm, encouraging, and natural
- If the user makes a grammar mistake, correct it gently at the END of your response with: "Quick tip: ..."
- Stay on the selected topic unless the user changes it
- Start conversations naturally, like a real phone call`;

export async function POST(req: NextRequest) {
  try {
    const { messages, topic } = await req.json();

    const systemPrompt = `${SYSTEM_PROMPT}\n\nToday's topic: ${topic || "General Conversation"}`;

    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
