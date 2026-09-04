export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1시간

// 서버 인스턴스 단위 in-memory 카운터. 이 엔드포인트는 계정을 만들거나 바꾸는 게
// 아니라 관리자에게 텔레그램 알림만 보내는 것이라 signup처럼 DB 테이블까지는 불필요.
const attempts: Record<string, number[]> = {};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (attempts[ip] || []).filter((t) => t > windowStart);
  recent.push(now);
  attempts[ip] = recent;
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const { username, name, contact } = await req.json();

  if (
    typeof username !== "string" || !username.trim() ||
    typeof name !== "string" || !name.trim() ||
    (contact != null && (typeof contact !== "string" || contact.length > 100))
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const trimmedUsername = username.trim();
  const trimmedName = name.trim();
  const trimmedContact = typeof contact === "string" ? contact.trim() : "";

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("name, email")
    .eq("username", trimmedUsername)
    .single();

  if (!profile || profile.name !== trimmedName) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 등록 이메일을 같이 보내는 건 관리자가 요청자가 적어낸 연락처와 대조해서
  // 본인이 맞는지 확인하라는 용도 — 아이디+닉네임만으론 도용 여부를 가리기 약함
  await sendTelegramAlert(
    `🔑 [EduEng] 비밀번호 재설정 요청\n아이디: ${trimmedUsername} · 이름: ${trimmedName}\n등록 이메일: ${profile.email}` +
      (trimmedContact ? `\n요청자가 남긴 연락처: ${trimmedContact} (등록 이메일과 대조해서 본인 확인 후 발급하세요)` : "\n(연락처 미입력 — 등록 이메일로 연락 시도)"),
    `reset-${trimmedUsername}`
  );

  return NextResponse.json({ ok: true });
}
