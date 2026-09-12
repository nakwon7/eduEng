"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function LoginKoPage() {
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
  // 덩그러니 보이면 버그처럼 느껴져서 이유를 안내 — app/ko/page.tsx가 붙여주는 쿼리파라미터
  const [otherDeviceNotice, setOtherDeviceNotice] = useState(false);
  // login/page.tsx handleOAuthLogin과 동일한 이유 — 네트워크 왕복 동안 버튼 반응이 없어보임
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") === "other_device") {
      setOtherDeviceNotice(true);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    // login/page.tsx handleOAuthLogin과 동일한 이유로 replace 방식 리다이렉트 사용.
    // lang=ko를 localStorage로 넘겨두면, 이메일이 겹쳐서 영어판 계정(ko_access=false)으로
    // 로그인되는 경우에 /auth/callback이 조용히 /app으로 보내지 않고 먼저 안내를 보여줌.
    // redirectTo에 쿼리스트링을 붙이면 Supabase Redirect URLs 허용목록과 정확히 일치하지
    // 않아 Site URL로 폴백되며 토큰이 노출되는 버그가 있어(2026-09 발견) 쿼리스트링 대신 사용
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const trimmedUsername = username.trim();

    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      if (!res.ok) throw new Error("Incorrect username or password");

      const { email, approved, ko_access } = await res.json();

      if (!approved) {
        setError("Your account is still pending approval.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error("Incorrect username or password");

      const userId = data.user?.id;
      if (!userId) throw new Error("Login failed");

      await establishClientSession(userId);

      router.replace(ko_access ? "/ko" : "/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
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
          <h1 className="text-white text-xl font-bold">TuringCall</h1>
          <p className="text-gray-400 text-sm mt-1">Learn Korean with AI</p>
        </div>

        {otherDeviceNotice && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
            <p className="text-amber-400 text-xs leading-relaxed">
              You were logged out because you signed in on another device.<br />Please log in again.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-emerald-400/70 text-xs mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="text-emerald-400/70 text-xs mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 disabled:bg-none disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-400 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={oauthLoading}
          className="w-full py-3 bg-white hover:bg-gray-100 active:scale-[0.97] disabled:opacity-70 text-gray-800 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {oauthLoading ? (
            <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
            </svg>
          )}
          {oauthLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <p className="text-center mt-4">
          <a href="/reset-password/ko" className="text-gray-400 hover:text-gray-300 text-xs">
            Forgot your password?
          </a>
        </p>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <a href="/signup/ko" className="text-blue-400 hover:text-blue-300">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
