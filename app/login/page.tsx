"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

      // 세션 토큰 발급 (중복 로그인 차단)
      const sessionToken = crypto.randomUUID();
      await supabase.from("profiles").update({ session_token: sessionToken }).eq("id", userId);
      localStorage.setItem("turingcall_session", sessionToken);

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

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-600 text-sm">로딩 중...</p>
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
            <label className="text-gray-400 text-xs mb-1 block">아이디</label>
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
            <label className="text-gray-400 text-xs mb-1 block">비밀번호</label>
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

        <p className="text-center text-gray-500 text-sm mt-6">
          계정이 없으신가요?{" "}
          <a href="/signup" className="text-green-400 hover:text-green-300">
            회원가입
          </a>
        </p>
      </div>
    </main>
  );
}
