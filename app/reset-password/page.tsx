"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trimmedContact = contact.trim();
      const res = await fetch("/api/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), name: name.trim(), contact: trimmedContact }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error("잠시 후 다시 시도해주세요.");
        throw new Error("아이디 또는 이름이 일치하지 않습니다.");
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zM8 11V7a4 4 0 1 1 8 0v4" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">비밀번호 찾기</h1>
          <p className="text-gray-400 text-sm mt-1">확인 후 빠르게 도와드릴게요</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              요청이 접수되었습니다.<br />본인 확인 후 입력하신 연락처로 새 비밀번호를 안내해드릴게요.
            </p>
            <a href="/login" className="inline-block text-green-400 hover:text-green-300 text-sm">
              로그인 화면으로 돌아가기
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-emerald-400/70 text-xs mb-1 block">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="가입한 아이디"
              />
            </div>
            <div>
              <label className="text-emerald-400/70 text-xs mb-1 block">
                닉네임 <span className="text-gray-400">(가입 시 입력한 이름 — 본명 아님)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="가입 시 입력한 이름 (예: Minjun)"
              />
            </div>
            <div>
              <label className="text-emerald-400/70 text-xs mb-1 block">연락받을 이메일</label>
              <input
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="example@email.com"
              />
              <p className="text-gray-400 text-xs mt-1">가입 이메일이 정확하지 않을 수 있어요. 새 비밀번호를 받을 이메일을 입력해주세요.</p>
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:bg-none disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-900/30"
            >
              {loading ? "요청 중..." : "재설정 요청하기"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-400 text-sm mt-6">
          <a href="/login" className="text-green-400 hover:text-green-300">
            로그인으로 돌아가기
          </a>
        </p>
      </div>
    </main>
  );
}
