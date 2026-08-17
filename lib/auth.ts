import { supabaseAdmin } from "@/lib/supabase";
import { trialRemainingSeconds } from "@/lib/trialCalc";

export type AuthCheckResult =
  | { ok: true; usedSeconds: number; plan: string | null; customMinutes: number | null }
  | { ok: false; error: string; status: number };

// AI/음성 API(채팅, 인사말, 피드백, 전사)에 공통으로 쓰는 인증 체크.
// 클라이언트의 canMakeCall(무제한 or 유료멤버십 or 체험횟수 남음)과 동일한 자격 판정을
// 서버에서도 그대로 강제한다 — 멤버십 만료 + 체험 소진까지 둘 다 아니면 거부.
// 분량 한도는 앱마다 기준이 달라서(영어판=plan별 quota, 한국어판=고정 200분/주) 여기서
// 판단하지 않고 usedSeconds/plan만 반환 — 호출하는 라우트가 자기 기준으로 비교한다.
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
    .select("session_token, expires_at, unlimited, blocked, plan, total_seconds, cycle_baseline_seconds, custom_minutes, trial_baseline_seconds, trial_reset_at")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return { ok: false, error: "SESSION_EXPIRED", status: 401 };
  }
  if (data.blocked) {
    return { ok: false, error: "SUBSCRIPTION_EXPIRED", status: 403 };
  }

  const isPaid = !!data.expires_at && new Date(data.expires_at) > new Date();
  const canUse =
    data.unlimited ||
    isPaid ||
    trialRemainingSeconds(data.total_seconds ?? 0, data.trial_baseline_seconds ?? 0, data.trial_reset_at ?? null) > 0;
  if (!canUse) {
    return { ok: false, error: "SUBSCRIPTION_EXPIRED", status: 403 };
  }

  const usedSeconds = data.unlimited ? 0 : Math.max(0, (data.total_seconds ?? 0) - (data.cycle_baseline_seconds ?? 0));
  return { ok: true, usedSeconds, plan: data.plan ?? null, customMinutes: data.custom_minutes ?? null };
}
