import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionToken = formData.get("sessionToken") as string;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    // 세션 토큰 검증
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
    }

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
