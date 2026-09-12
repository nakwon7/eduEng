"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupKoPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  // login/page.tsx handleOAuthLogin과 동일한 이유 — 네트워크 왕복 동안 버튼 반응이 없어보임
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem("turingcall_session")) {
        router.replace("/ko");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    // lang=ko를 localStorage로 넘겨서 /auth/callback이 신규 가입자를 /signup/complete/ko(외국인
    // 온보딩)로 보내게 함. redirectTo에 쿼리스트링을 붙이면 Supabase Redirect URLs 허용목록과
    // 정확히 일치하지 않아 Site URL로 폴백되며 토큰이 노출되는 버그가 있어(2026-09 발견) 대신 사용
    localStorage.setItem("tc_oauth_lang", "ko");
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (data?.url) {
      window.location.replace(data.url);
    } else {
      localStorage.removeItem("tc_oauth_lang");
      setOauthLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">Learn Korean with AI</h1>
          <p className="text-gray-400 text-xs mt-1">Free trial included right after sign-up</p>
        </div>

        <div className="relative space-y-2">
          <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl blur-xl" aria-hidden="true" />
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={oauthLoading}
            className="relative w-full py-4 bg-white hover:bg-gray-50 active:scale-[0.98] disabled:opacity-70 text-gray-800 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/30 ring-1 ring-black/5"
          >
            {oauthLoading ? (
              <span className="w-6 h-6 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
              </svg>
            )}
            {oauthLoading ? "Redirecting..." : "Sign up with Google"}
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login/ko" className="text-blue-400 hover:text-blue-300">Log in</a>
        </p>
      </div>
    </main>
  );
}
