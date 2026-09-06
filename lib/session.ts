import { supabase } from "@/lib/supabase";

// 세션 토큰 발급 (중복 로그인 차단) - 비번 로그인·구글 로그인·구글 온보딩 완료 후 공통으로 사용
export async function establishClientSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  // DB 쓰기가 조용히 실패(RLS 등)했는데도 localStorage에 새 토큰을 저장하면,
  // 방금 로그인한 이 기기가 바로 "다른 기기에서 로그인함" 오탐으로 튕겨나가므로 확인 필수
  const { data, error } = await supabase
    .from("profiles")
    .update({ session_token: sessionToken })
    .eq("id", userId)
    .select("session_token")
    .single();
  if (error || data?.session_token !== sessionToken) {
    throw new Error("세션 설정에 실패했습니다. 다시 시도해주세요.");
  }
  localStorage.setItem("turingcall_session", sessionToken);
  return sessionToken;
}
