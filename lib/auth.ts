import { supabaseAdmin } from "@/lib/supabase";

export type AuthCheckResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

// AI/음성 API(채팅, 인사말, 피드백, 전사)에 공통으로 쓰는 인증 체크.
// 클라이언트의 canMakeCall(무제한 or 유료멤버십 or 체험횟수 남음)과 동일한 자격 판정을
// 서버에서도 그대로 강제한다 — 멤버십 만료 + 체험 소진까지 둘 다 아니면 거부.
export async function verifyActiveUser(
  admin: ReturnType<typeof supabaseAdmin>,
  userId: string | undefined | null,
  sessionToken: string | undefined | null
): Promise<AuthCheckResult> {
  if (!userId || !sessionToken) {
    return { ok: false, error: "SESSION_EXPIRED", status: 401 };
  }

  const { data } = await admin
    .from("profiles")
    .select("session_token, expires_at, unlimited, blocked, trial_calls")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return { ok: false, error: "SESSION_EXPIRED", status: 401 };
  }
  if (data.blocked) {
    return { ok: false, error: "SUBSCRIPTION_EXPIRED", status: 403 };
  }

  const isPaid = !!data.expires_at && new Date(data.expires_at) > new Date();
  const canUse = data.unlimited || isPaid || (data.trial_calls ?? 0) > 0;
  if (!canUse) {
    return { ok: false, error: "SUBSCRIPTION_EXPIRED", status: 403 };
  }

  return { ok: true };
}
