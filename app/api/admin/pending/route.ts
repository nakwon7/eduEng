import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken } = await req.json();

  const admin = supabaseAdmin();

  // 요청자 검증 (세션 + 관리자 확인)
  const { data: requester } = await admin
    .from("profiles")
    .select("username, session_token")
    .eq("id", userId)
    .single();

  if (!requester || requester.session_token !== sessionToken || requester.username !== "gooster") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, username, name, email, level, created_at")
    .eq("approved", false)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data });
}
