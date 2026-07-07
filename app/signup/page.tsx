"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const LEVELS = [
  { id: "beginner", label: "초급", desc: "기초 문법, 간단한 대화" },
  { id: "intermediate", label: "중급", desc: "일상 대화 가능, 표현 확장 중" },
  { id: "advanced", label: "고급", desc: "자유로운 대화, 뉘앙스 학습" },
] as const;

const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]{1,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const usernameError = username && !USERNAME_REGEX.test(username)
    ? "영문자로 시작, 영문+숫자 2~20자"
    : "";
  const emailError = email && !EMAIL_REGEX.test(email)
    ? "올바른 이메일 형식이 아닙니다"
    : "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || emailError) return;
    setError("");
    setLoading(true);

    try {
      // 아이디 중복 확인
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      if (existing) throw new Error("이미 사용 중인 아이디입니다");

      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const userId = data.user?.id;
      if (!userId) throw new Error("가입 실패");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
        username,
        name,
        level,
        approved: true,
        session_token: null,
      });
      if (profileError) throw profileError;

      await supabase.auth.signOut();
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "가입 실패");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-white text-lg font-bold mb-2">가입 완료!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            관리자 승인 후 로그인 가능합니다.<br />
            승인이 완료되면 별도로 안내드릴게요.
          </p>
          <a href="/login" className="mt-6 inline-block text-green-400 hover:text-green-300 text-sm">
            로그인 페이지로 →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🎓
          </div>
          <h1 className="text-white text-xl font-bold">회원가입</h1>
          <p className="text-gray-400 text-xs mt-1">관리자 승인 후 이용 가능합니다</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="영문자로 시작, 영문+숫자 2~20자"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">
              영어 이름 <span className="text-gray-600">(AI 튜터가 부르는 이름)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Minjun"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6자 이상"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-2 block">영어 레벨</label>
            <div className="space-y-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`w-full px-4 py-2 rounded-xl text-left transition-all ${
                    level === l.id ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  <span className="font-medium text-sm">{l.label}</span>
                  <span className="text-xs opacity-70 ml-2">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !!usernameError || !!emailError}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          이미 계정이 있으신가요?{" "}
          <a href="/login" className="text-green-400 hover:text-green-300">로그인</a>
        </p>
      </div>
    </main>
  );
}
