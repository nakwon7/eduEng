"use client";

import { useState } from "react";
import { UserProfile } from "@/hooks/useUserProfile";
import CopyButton from "./CopyButton";
import UsageHistory from "./UsageHistory";
import PaymentNoteInput from "./PaymentNoteInput";
import PaymentRejectNotice from "./PaymentRejectNotice";

interface UserSetupProps {
  onComplete: (profile: UserProfile) => void;
  existing?: UserProfile;
  paymentRequestedAt?: string | null;
  requestingPayment?: boolean;
  onRequestPayment?: () => void;
  paymentNote?: string;
  onPaymentNoteChange?: (note: string) => void;
  paymentRejectReason?: string | null;
  userId?: string | null;
  sessionToken?: string | null;
}

const LEVELS = [
  { id: "beginner", label: "초급", desc: "기초 문법, 간단한 대화" },
  { id: "intermediate", label: "중급", desc: "일상 대화 가능, 표현 확장 중" },
  { id: "advanced", label: "고급", desc: "자유로운 대화, 뉘앙스 학습" },
] as const;

const TUTORS = [
  { id: "alex", emoji: "🎓", label: "Alex", desc: "Friendly & Encouraging" },
  { id: "rachel", emoji: "🌸", label: "Rachel", desc: "Warm & Patient" },
] as const;

export default function UserSetup({ onComplete, existing, paymentRequestedAt, requestingPayment, onRequestPayment, paymentNote, onPaymentNoteChange, paymentRejectReason, userId, sessionToken }: UserSetupProps) {
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [name, setName] = useState(existing?.name || "");
  const [level, setLevel] = useState<UserProfile["level"]>(existing?.level || "intermediate");
  const [tutor, setTutor] = useState<UserProfile["tutor"]>(isMobile ? "rachel" : (existing?.tutor || "alex"));

  const handleSubmit = () => {
    if (!name.trim()) return;
    // 모바일에서는 tutor를 변경하지 않고 기존 값 유지 (화면은 항상 Rachel이지만 DB는 PC 선택 보존)
    onComplete({ name: name.trim(), level, tutor: isMobile ? (existing?.tutor || "alex") : tutor });
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-2 py-4">
      <p className="text-green-400 text-sm text-center mb-6">
        {existing ? "프로필 수정" : "처음 오셨군요! 간단히 알려주세요 👋"}
      </p>

      <div className="mb-5">
        <label className="text-gray-400 text-xs mb-2 block">이름 (영어로)</label>
        <input
          type="text"
          placeholder="e.g. Minjun"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600"
        />
      </div>

      {isMobile && (
        <div className="mb-5 bg-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400">
          튜터 선택은 PC에서 가능해요. 모바일에서는 Rachel과 대화해요.
        </div>
      )}

      {!isMobile && (
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">AI 튜터</label>
          <div className="grid grid-cols-2 gap-2">
            {TUTORS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTutor(t.id)}
                className={`px-4 py-3 rounded-xl text-center transition-all ${
                  tutor === t.id ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <div className="text-2xl mb-1">{t.emoji}</div>
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs opacity-70">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-gray-400 text-xs mb-2 block">영어 레벨</label>
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                level === l.id ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="font-medium text-sm">{l.label}</span>
              <span className="text-xs opacity-70 ml-2">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all"
      >
        {existing ? "저장" : "시작하기"}
      </button>

      <div className="mt-6 bg-gray-900 rounded-xl p-4 space-y-2">
        <p className="text-gray-400 text-xs font-medium">멤버십 요금</p>
        <div className="flex items-baseline gap-1">
          <span className="text-white text-lg font-bold">9,900원</span>
          <span className="text-gray-500 text-xs">/ 월 · 매월 900분 제공</span>
        </div>
        <p className="text-gray-500 text-xs">무료 체험 5회(회당 최대 10분) 제공</p>
        <p className="text-gray-500 text-xs flex items-center gap-1">KB국민은행 758637-00-012739<CopyButton text="758637-00-012739" /></p>
        <p className="text-gray-500 text-xs">예금주: 송랩</p>
        {onRequestPayment && (
          paymentRequestedAt ? (
            <p className="mt-1 text-emerald-400 text-xs">✅ 확인 요청됨 · 관리자 확인 후 곧 승인됩니다</p>
          ) : (
            <>
              {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="ko" />}
              {onPaymentNoteChange && (
                <PaymentNoteInput value={paymentNote || ""} onChange={onPaymentNoteChange} variant="bankName" />
              )}
              <button
                onClick={onRequestPayment}
                disabled={requestingPayment || !(paymentNote || "").trim()}
                className="w-full mt-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
              >
                {requestingPayment ? "요청 중..." : "✅ 입금 완료, 확인 요청하기"}
              </button>
            </>
          )
        )}
        <a
          href="https://open.kakao.com/o/sPanl0Ci"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 text-yellow-400 text-xs hover:text-yellow-300"
        >
          💬 가입 문의 (카카오톡)
        </a>
      </div>

      {userId && sessionToken && <UsageHistory userId={userId} sessionToken={sessionToken} lang="ko" />}
    </div>
  );
}
