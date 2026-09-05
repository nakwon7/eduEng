export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1시간

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// 아이디는 사용자에게 노출되지 않는 내부 식별자라 이메일 앞부분 기반으로 서버가 자동 생성
async function generateUniqueUsername(email: string, admin: ReturnType<typeof supabaseAdmin>): Promise<string> {
  const local = email.split("@")[0].replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
  const base = /^[A-Za-z]/.test(local) ? local : `u${local}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${base}${suffix}`;
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .single();
    if (!taken) return candidate;
  }
  return `u${Date.now().toString().slice(-10)}`;
}

export async function POST(req: NextRequest) {
  const { name, accessToken } = await req.json();

  if (
    typeof name !== "string" || !name.trim() || name.trim().length > 20 ||
    typeof accessToken !== "string" || !accessToken
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // 구글 로그인으로 이미 발급된 세션의 access token으로 실제 유저를 확인 —
  // 클라이언트가 보낸 id를 그대로 믿지 않고 서버가 직접 검증
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }
  const user = userData.user;

  const ip = getClientIp(req);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("signup_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", windowStart);
  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  await admin.from("signup_attempts").insert({ ip });

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (existingProfile) {
    return NextResponse.json({ error: "already_onboarded" }, { status: 409 });
  }

  const username = await generateUniqueUsername(user.email || `user${user.id}`, admin);

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    email: user.email,
    username,
    name: name.trim(),
    level: "intermediate",
    goal_topic: null,
    approved: true,
    session_token: null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await sendTelegramAlert(
    `🎉 [EduEng] 신규 가입 (Google)\n${username} (${name.trim()})`,
    `signup-${user.id}`
  );

  return NextResponse.json({ ok: true });
}
