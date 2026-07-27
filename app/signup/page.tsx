"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isDisposableEmail } from "@/lib/disposableEmailDomains";

const LEVELS = [
  { id: "beginner", label: "초급", desc: "기초 문법, 간단한 대화" },
  { id: "intermediate", label: "중급", desc: "일상 대화 가능, 표현 확장 중" },
  { id: "advanced", label: "고급", desc: "자유로운 대화, 뉘앙스 학습" },
] as const;

const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]{3,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem("turingcall_session")) {
        router.replace("/app");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  const [step, setStep] = useState<"form" | "done">("form");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const usernameError = username && !USERNAME_REGEX.test(username)
    ? "영문자로 시작, 영문+숫자 4~20자"
    : "";
  const emailError = email && !EMAIL_REGEX.test(email)
    ? "올바른 이메일 형식이 아닙니다"
    : email && isDisposableEmail(email)
    ? "일회용/임시 이메일 서비스는 사용할 수 없습니다"
    : "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || emailError || !agreedTerms) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, password, level }),
      });
      const result = await res.json();

      if (!res.ok) {
        if (result.error === "rate_limited") {
          throw new Error("너무 많은 가입 시도가 있었습니다. 잠시 후 다시 시도해주세요");
        }
        if (result.error === "username_taken") {
          throw new Error("이미 사용 중인 아이디입니다");
        }
        if (result.error === "email_taken") {
          throw new Error("이미 가입된 이메일입니다");
        }
        if (result.error === "disposable_email") {
          throw new Error("일회용/임시 이메일 서비스는 사용할 수 없습니다");
        }
        throw new Error(result.error || "가입 실패");
      }

      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "가입 실패");
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

  if (step === "done") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-white text-lg font-bold mb-2">가입 완료!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            바로 로그인해서 무료 체험을 시작해보세요!
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
          <p className="text-gray-400 text-xs mt-1">가입 즉시 무료 체험 이용 가능합니다</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-xs">아이디</label>
              <span className="text-gray-600 text-xs">{username.length}/20</span>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              placeholder="영문자로 시작, 영문+숫자 4~20자"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-xs">
                영어 이름 <span className="text-gray-600">(AI 튜터가 부르는 이름)</span>
              </label>
              <span className="text-gray-600 text-xs">{name.length}/20</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={20}
              placeholder="e.g. Minjun"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-xs">이메일</label>
              <span className="text-gray-600 text-xs">{email.length}/50</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={50}
              placeholder="example@email.com"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-gray-600 text-xs mt-1">비밀번호 재설정 등에 사용되니 실제 사용 가능한 이메일을 입력해주세요</p>
            {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-xs">비밀번호</label>
              <span className="text-gray-600 text-xs">{password.length}/20</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={20}
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

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-green-500 shrink-0"
            />
            <span className="text-gray-400 text-xs leading-relaxed">
              <a href="/terms" target="_blank" className="text-green-400 underline hover:text-green-300">이용약관 및 개인정보처리방침</a>에 동의합니다 (필수)
            </span>
          </label>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !!usernameError || !!emailError || !agreedTerms}
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
