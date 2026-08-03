import { supabaseAdmin } from "@/lib/supabase";

export type AuthCheckResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

// AI/음성 API(채팅, 인사말, 피드백, 전사)에 공통으로 쓰는 인증 체크.
// 세션 불일치/차단/만료 여부를 확인하고, 체험(trial) 유저는 expires_at이 없어서 통과된다
// (체험 소진 여부는 클라이언트의 canMakeCall에서만 다루고 여기서는 건드리지 않음).
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
    .select("session_token, expires_at, unlimited, blocked")
    .eq("id", userId)
    .single();

  if (!data || data.session_token !== sessionToken) {
    return { ok: false, error: "SESSION_EXPIRED", status: 401 };
  }
  if (data.blocked) {
    return { ok: false, error: "SUBSCRIPTION_EXPIRED", status: 403 };
  }
  if (!data.unlimited && data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ok: false, error: "SUBSCRIPTION_EXPIRED", status: 403 };
  }

  return { ok: true };
}
