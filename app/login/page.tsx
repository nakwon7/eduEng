"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const userId = data.user?.id;
      if (!userId) throw new Error("로그인 실패");

      // 승인 여부 확인
      const { data: profile } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", userId)
        .single();

      if (!profile?.approved) {
        await supabase.auth.signOut();
        router.push("/pending");
        return;
      }

      // 세션 토큰 발급 (중복 로그인 차단용)
      const sessionToken = crypto.randomUUID();
      await supabase.from("profiles").update({ session_token: sessionToken }).eq("id", userId);
      localStorage.setItem("edueng_session", sessionToken);

      router.push("/");
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
            <label className="text-gray-400 text-xs mb-1 block">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="example@email.com"
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
            신청하기
          </a>
        </p>
      </div>
    </main>
  );
}
