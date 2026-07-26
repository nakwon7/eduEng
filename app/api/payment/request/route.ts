export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, note } = await req.json();
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "userId and sessionToken required" }, { status: 400 });
  }
  if (!trimmedNote) {
    return NextResponse.json({ error: "note required" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("session_token, username")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await admin
    .from("profiles")
    .update({
      payment_requested_at: new Date().toISOString(),
      payment_note: trimmedNote.slice(0, 200),
      payment_reject_reason: null,
    })
    .eq("id", userId);

  await sendTelegramAlert(
    `💰 [EduEng] 입금 확인 요청\n${data.username} · ${trimmedNote.slice(0, 200)}`,
    `payment-${userId}-${Date.now()}`
  );

  return NextResponse.json({ ok: true });
}
