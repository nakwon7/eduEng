export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("email, approved, blocked")
    .eq("username", username)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ email: data.email, approved: data.approved });
}
