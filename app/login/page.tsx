"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 서버에서 아이디로 이메일 조회 (RLS 우회)
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");

      const { email, approved } = await res.json();

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
      localStorage.setItem("edueng_session", sessionToken);

      router.push("/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🎓
          </div>
          <h1 className="text-white text-xl font-bold">에듀잉</h1>
          <p className="text-gray-400 text-sm mt-1">AI 전화영어</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all"
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
