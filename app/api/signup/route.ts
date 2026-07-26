export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isDisposableEmail } from "@/lib/disposableEmailDomains";

const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]{1,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = ["beginner", "intermediate", "advanced"];

const RATE_LIMIT_MAX = 3; // 같은 IP에서 이 횟수 이상 시도하면 차단
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1시간

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const { username, name, email, password, level, lang } = await req.json();

  if (
    typeof username !== "string" || !USERNAME_REGEX.test(username) ||
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !EMAIL_REGEX.test(email) ||
    typeof password !== "string" || password.length < 6 ||
    !LEVELS.includes(level)
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (isDisposableEmail(email)) {
    return NextResponse.json({ error: "disposable_email" }, { status: 400 });
  }

  const admin = supabaseAdmin();
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

  // 성공 여부와 무관하게 시도 자체를 기록 (아이디 중복 등으로 재시도하는 것도 카운트하기 위함)
  await admin.from("signup_attempts").insert({ ip });

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();
  if (existing) {
    return NextResponse.json({ error: "username_taken" }, { status: 409 });
  }

  // Gmail은 점(.)과 +별칭을 무시해도 같은 받은편지함이라, 정규화한 값으로도 중복 체크
  const { data: emailTaken } = await admin.rpc("is_normalized_email_taken", { p_email: email });
  if (emailTaken) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !created.user) {
    return NextResponse.json({ error: authError?.message || "signup_failed" }, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    username,
    name,
    level,
    approved: true,
    session_token: null,
    ...(lang === "ko" ? { ko_access: true } : {}),
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
