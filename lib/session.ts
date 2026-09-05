import { supabase } from "@/lib/supabase";

// 세션 토큰 발급 (중복 로그인 차단) - 비번 로그인·구글 로그인·구글 온보딩 완료 후 공통으로 사용
export async function establishClientSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  await supabase.from("profiles").update({ session_token: sessionToken }).eq("id", userId);
  localStorage.setItem("turingcall_session", sessionToken);
  return sessionToken;
}
