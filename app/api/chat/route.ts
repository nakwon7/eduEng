import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  alex: `You are Alex, a friendly male English tutor having a phone conversation with a Korean student.

Rules:
- Always respond in English only
- Keep responses SHORT (2-3 sentences max) — this is a phone call, not an essay
- Be warm, encouraging, and upbeat
- If the user makes a grammar mistake, correct it gently at the END of your response with: "Quick tip: ..."
- Stay on the selected topic unless the user changes it
- Start conversations naturally, like a real phone call`,

  rachel: `You are Rachel, a warm and patient female English tutor having a phone conversation with a Korean student.

Rules:
- Always respond in English only
- Keep responses SHORT (2-3 sentences max) — this is a phone call, not an essay
- Be gentle, nurturing, and supportive — never make the student feel embarrassed
- If the user makes a grammar mistake, correct it softly at the END of your response with: "Just a small tip: ..."
- Stay on the selected topic unless the user changes it
- Start conversations naturally, like a real phone call`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, topic, profile, sessionToken, userId } = await req.json();

    // 세션 토큰 검증 (중복 로그인 차단)
    if (userId && sessionToken) {
      const admin = supabaseAdmin();
      const { data } = await admin
        .from("profiles")
        .select("session_token")
        .eq("id", userId)
        .single();

      if (data?.session_token !== sessionToken) {
        return NextResponse.json({ error: "SESSION_EXPIRED" }, { status: 401 });
      }

      // 이용 기간 만료 확인
      const { data: profile } = await admin
        .from("profiles")
        .select("expires_at, username, unlimited")
        .eq("id", userId)
        .single();

      const isUnlimited = profile?.username === "gooster" || profile?.unlimited;
      if (!isUnlimited && profile?.expires_at && new Date(profile.expires_at) < new Date()) {
        return NextResponse.json({ error: "SUBSCRIPTION_EXPIRED" }, { status: 403 });
      }
    }

    const levelGuide =
      profile?.level === "beginner"
        ? "Use simple vocabulary and short sentences. Speak slowly and clearly."
        : profile?.level === "advanced"
        ? "Use natural, native-level expressions. Challenge them with idioms and complex structures."
        : "Use everyday vocabulary. Balance correction with natural flow.";

    const profileInfo = profile
      ? `\n\nStudent info:\n- Name: ${profile.name}\n- Level: ${profile.level}\n- ${levelGuide}\n- Address them by name occasionally.`
      : "";

    const basePrompt = SYSTEM_PROMPTS[profile?.tutor || "alex"] || SYSTEM_PROMPTS.alex;

    const topicPrompt = topic === "Word Description"
      ? `\n\nToday's mode: Word Description Practice
- Pick ONE random English word suitable for a ${profile?.level || "intermediate"} level student
- Present it clearly: e.g. "Here's your word: [WORD]. Can you explain what it means in English?"
- After the student explains, give brief encouraging feedback, gently correct if needed, then offer another word
- Keep words level-appropriate: beginner=everyday nouns/verbs, intermediate=abstract concepts, advanced=idioms/nuanced vocabulary`
      : `\n\nToday's topic: ${topic || "General Conversation"}`;

    const systemPrompt = `${basePrompt}${profileInfo}${topicPrompt}`;

    const recentMessages = messages.slice(-10);

    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
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
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
