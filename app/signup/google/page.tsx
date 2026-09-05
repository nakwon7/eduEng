"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function GoogleSignupCompletePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setEmail(session.user.email || "");
      setName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");
      setChecking(false);
    };
    check();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      setError("이용약관 및 개인정보처리방침에 동의해주세요");
      setTermsHighlight(true);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");

      const res = await fetch("/api/signup/google-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accessToken: session.access_token }),
      });
      const result = await res.json();

      if (!res.ok && result.error !== "already_onboarded") {
        if (result.error === "rate_limited") {
          throw new Error("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요");
        }
        throw new Error(result.error || "가입 실패");
      }

      // 레벨은 물어보지 않고 기본값(중급)으로 채워서 가입시켰다 — 설정 화면에서
      // "언제 정했지" 헷갈리지 않게 처음 열 때 한 번 안내하기 위한 플래그
      localStorage.setItem("tc_level_default", "1");

      await establishClientSession(session.user.id);
      router.replace("/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "가입 실패");
      setLoading(false);
    }
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
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">거의 다 됐어요</h1>
          <p className="text-gray-400 text-xs mt-1">닉네임만 정하면 바로 시작할 수 있어요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-emerald-400/70 text-xs mb-1 block">이메일</label>
            <div className="w-full bg-gray-800/50 border border-white/5 text-gray-400 rounded-xl px-4 py-3 text-sm">
              {email}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-emerald-400/70 text-xs">
                닉네임 <span className="text-gray-400">(AI 튜터가 부르는 이름)</span>
              </label>
              <span className="text-gray-400 text-xs">{name.length}/20</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={20}
              autoFocus
              placeholder="e.g. Minjun"
              className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <label
            className={`flex items-start gap-2 cursor-pointer px-2 py-2 -mx-2 rounded-lg border transition-colors ${
              termsHighlight ? "border-red-500/60 bg-red-500/5" : "border-transparent"
            }`}
          >
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => {
                setAgreedTerms(e.target.checked);
                if (e.target.checked) setTermsHighlight(false);
              }}
              className="mt-0.5 w-4 h-4 accent-green-500 shrink-0"
            />
            <span className="text-gray-400 text-xs leading-relaxed">
              <a href="/terms" target="_blank" className="text-green-400 underline hover:text-green-300">이용약관 및 개인정보처리방침</a>에 동의합니다 (필수)
            </span>
          </label>

          {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:bg-none disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-900/30"
          >
            {loading ? "가입 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
