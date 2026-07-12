import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
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
  } catch (error) {
    console.error("Transcribe-ko error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
