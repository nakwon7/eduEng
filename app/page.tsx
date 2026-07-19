"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem("turingcall_session")) {
        router.replace("/app");
      }
    };
    check();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-10 text-center">
        <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center text-5xl mb-5 shadow-lg">
          🎓
        </div>
        <h1 className="text-3xl font-bold mb-2">튜링콜</h1>
        <p className="text-green-400 text-lg font-medium mb-4">AI 전화영어</p>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          원어민 AI 튜터 Alex · Rachel과 실시간 영어 대화.<br />
          언제 어디서나 스마트폰으로 전화영어를 경험하세요.
        </p>
      </div>

      {/* Features */}
      <div className="px-6 pb-10 max-w-sm mx-auto space-y-3">
        {[
          { icon: "📞", title: "실시간 AI 전화영어", desc: "AI 튜터 Alex · Rachel과 실제 전화 통화처럼 대화" },
          { icon: "🎙️", title: "음성 인식", desc: "말하면 바로 인식, 자연스러운 대화 흐름" },
          { icon: "✍️", title: "문법 교정", desc: "틀린 표현을 부드럽게 교정해 드려요" },
          { icon: "📚", title: "다양한 주제", desc: "일상, 비즈니스, 여행 등 상황별 대화" },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-4 bg-gray-900 rounded-2xl p-4">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="text-white text-sm font-semibold">{f.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="px-6 pb-10 max-w-sm mx-auto">
        <div className="bg-gray-900 rounded-2xl p-6 text-center border border-green-600">
          <p className="text-green-400 text-xs font-medium mb-1">베타 특가</p>
          <p className="text-4xl font-bold mb-1">9,900<span className="text-xl">원</span></p>
          <p className="text-gray-400 text-sm mb-4">/ 월 · 무제한 이용</p>
          <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 text-left space-y-1">
            <p className="text-green-400 font-medium mb-2">무료 체험 포함</p>
            <p>✅ 가입 즉시 3회 무료 통화 (회당 30분)</p>
            <p>✅ 체험 후 멤버십 가입하면 무제한</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-16 max-w-sm mx-auto space-y-3">
        <a
          href="/signup"
          className="block w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-lg text-center transition-all active:scale-95 shadow-lg"
        >
          무료로 시작하기
        </a>
        <a
          href="/login"
          className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-medium text-sm text-center transition-all"
        >
          로그인
        </a>

        {/* 홈 화면 추가 안내 */}
        <div className="bg-gray-900 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
          <p className="text-white text-xs font-semibold">📲 앱처럼 설치하기 (무료 · 앱스토어 불필요)</p>
          <p>🍎 <span className="text-gray-300">iPhone</span> — Safari에서 접속 → 하단 공유(□↑) → 홈 화면에 추가</p>
          <p>🤖 <span className="text-gray-300">Android</span> — Chrome에서 접속 → 우상단 메뉴(⋮) → 홈 화면에 추가</p>
        </div>
      </div>

      <div className="text-center pb-8 space-y-3">
        <a
          href="https://open.kakao.com/o/sPanl0Ci"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-medium rounded-xl transition-all"
        >
          💬 카카오톡 문의하기
        </a>
        <p className="text-gray-600 text-xs">TuringCall Beta v0.1 · Chrome / Samsung 브라우저 권장</p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-900 px-6 py-6 text-center space-y-1.5">
        <p className="text-gray-700 text-xs">송랩 | 사업자등록번호: 857-28-01961</p>
        <a href="/terms" className="text-gray-600 text-xs hover:text-gray-400 underline">이용약관 · 개인정보처리방침</a>
      </div>
    </main>
  );
}
