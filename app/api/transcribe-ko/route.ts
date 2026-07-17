import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "ko",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 429) {
      await sendTelegramAlert("⚠️ [EduEng] Groq 무료 한도 초과!\n음성인식 API (한국어) rate limit에 걸렸습니다.", "transcribe-ko");
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }
    console.error("Transcribe-ko error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
