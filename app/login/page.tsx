"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem("turingcall_session")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("ko_access")
          .eq("id", session.user.id)
          .single();
        router.replace(profile?.ko_access ? "/ko" : "/app");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 다른 기기에서 로그인해서(세션 토큰 덮어써짐) 강제 로그아웃된 경우, 그냥 로그인 폼만
  // 덩그러니 보이면 버그처럼 느껴져서 이유를 안내 — app/app/page.tsx·app/ko/page.tsx가 붙여주는 쿼리파라미터
  const [otherDeviceNotice, setOtherDeviceNotice] = useState(false);
  const [showGoogleNotice, setShowGoogleNotice] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") === "other_device") {
      setOtherDeviceNotice(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const trimmedUsername = username.trim();

    try {
      // 서버에서 아이디로 이메일 조회 (RLS 우회)
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      if (!res.ok) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");

      const { email, approved, ko_access } = await res.json();

      if (!approved) {
        setError("아직 승인 대기 중입니다. 승인 후 이용 가능합니다.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");

      const userId = data.user?.id;
      if (!userId) throw new Error("로그인 실패");

      await establishClientSession(userId);

      // 관리자 계정은 방문자수 집계에서 제외 (proxy.ts에서 이 쿠키를 확인함)
      if (trimmedUsername === "gooster") {
        document.cookie = "tc_skip_visit=1; path=/; max-age=31536000; SameSite=Lax";
      }

      router.replace(ko_access ? "/ko" : "/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">튜링콜</h1>
          <p className="text-gray-400 text-sm mt-1">AI 전화영어</p>
        </div>

        {otherDeviceNotice && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
            <p className="text-amber-400 text-xs leading-relaxed">
              다른 기기에서 로그인하셔서 로그아웃됐어요.<br />다시 로그인해 주세요.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-emerald-400/70 text-xs mb-1 block">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="아이디 입력"
            />
          </div>
          <div>
            <label className="text-emerald-400/70 text-xs mb-1 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:bg-none disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-900/30"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-400 text-xs">또는</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => setShowGoogleNotice(true)}
          className="w-full py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
          </svg>
          Google로 계속하기
        </button>

        {showGoogleNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xs bg-gray-900 rounded-2xl ring-1 ring-white/10 p-6 shadow-2xl">
              <p className="text-white font-semibold text-sm mb-2">잠깐만요!</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-5">
                기존에 <span className="text-white">아이디/비밀번호로 가입</span>하신 회원이라면,
                구글 로그인은 기존 계정과 연결되지 않고 <span className="text-white">완전히 새로운 계정</span>이 만들어져요.
                기존 계정은 아이디/비밀번호로 로그인해주세요.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleNotice(false);
                    handleGoogleLogin();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  신규 회원이에요, 계속할게요
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoogleNotice(false)}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition-all"
                >
                  아이디/비밀번호로 로그인할게요
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center mt-4">
          <a href="/reset-password" className="text-gray-400 hover:text-gray-300 text-xs">
            비밀번호를 잊으셨나요?
          </a>
        </p>

        <p className="text-center text-gray-400 text-sm mt-6">
          계정이 없으신가요?{" "}
          <a href="/signup" className="text-green-400 hover:text-green-300">
            회원가입
          </a>
        </p>
      </div>
    </main>
  );
}
