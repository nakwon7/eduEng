export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken, newPassword } = await req.json();

  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 20) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: profile } = await admin
    .from("profiles")
    .select("session_token")
    .eq("id", userId)
    .single();

  if (!profile || profile.session_token !== sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
