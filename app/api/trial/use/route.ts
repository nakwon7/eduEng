export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, sessionToken } = await req.json();
  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("session_token, trial_calls")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (data.trial_calls <= 0) {
    return NextResponse.json({ trial_calls: 0 });
  }

  const newCount = data.trial_calls - 1;
  await admin.from("profiles").update({ trial_calls: newCount }).eq("id", userId);

  return NextResponse.json({ trial_calls: newCount });
}
