export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, targetId, newPassword } = await req.json();

  if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 20) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: requester } = await admin
    .from("profiles")
    .select("username, session_token")
    .eq("id", userId)
    .single();

  if (!requester || requester.session_token !== sessionToken || requester.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await admin.auth.admin.updateUserById(targetId, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 재설정 후 기존 세션은 무효화 — 다른 기기에 로그인된 상태가 남아있을 수 있어서
  await admin.from("profiles").update({ session_token: null }).eq("id", targetId);

  return NextResponse.json({ ok: true });
}
