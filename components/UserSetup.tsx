"use client";

import { useState } from "react";
import Image from "next/image";
import { UserProfile } from "@/hooks/useUserProfile";
import { PlanId } from "@/lib/plans";
import { GOAL_TOPICS } from "@/lib/goalTopics";
import UsageHistory from "./UsageHistory";
import ChangePassword from "./ChangePassword";
import MembershipOffer from "./MembershipOffer";

interface UserSetupProps {
  onComplete: (profile: UserProfile) => void;
  existing?: UserProfile;
  paymentRequestedAt?: string | null;
  requestingPayment?: boolean;
  onRequestPayment?: (plan: PlanId) => void;
  paymentNote?: string;
  onPaymentNoteChange?: (note: string) => void;
  paymentRejectReason?: string | null;
  hasActiveMembership?: boolean;
  expiresAt?: string | null;
  userId?: string | null;
  sessionToken?: string | null;
  liteEligible?: boolean;
}

const LEVELS = [
  { id: "beginner", label: "초급", desc: "기초 문법, 간단한 대화" },
  { id: "intermediate", label: "중급", desc: "일상 대화 가능, 표현 확장 중" },
  { id: "advanced", label: "고급", desc: "자유로운 대화, 뉘앙스 학습" },
] as const;

const TUTORS = [
  { id: "alex", label: "Alex", desc: "Friendly & Encouraging" },
  { id: "rachel", label: "Rachel", desc: "Warm & Patient" },
] as const;

export default function UserSetup({ onComplete, existing, paymentRequestedAt, requestingPayment, onRequestPayment, paymentNote, onPaymentNoteChange, paymentRejectReason, hasActiveMembership, expiresAt, userId, sessionToken, liteEligible }: UserSetupProps) {
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [name, setName] = useState(existing?.name || "");
  const [level, setLevel] = useState<UserProfile["level"]>(existing?.level || "intermediate");
  const [tutor, setTutor] = useState<UserProfile["tutor"]>(isMobile ? "rachel" : (existing?.tutor || "alex"));
  const [goalTopic, setGoalTopic] = useState(existing?.goalTopic || "daily");
  // existing이 있는(=프로필이 이미 로드된) 회원인데 goalTopic만 없다면 이번에 새로 생긴 기능을
  // 아직 한 번도 안 본 기존 회원 — 처음 설정 화면에 들어왔을 때만 NEW 안내를 보여준다
  const isGoalTopicNew = !!existing && !existing.goalTopic;

  const handleSubmit = () => {
    if (!name.trim()) return;
    // 모바일에서는 tutor를 변경하지 않고 기존 값 유지 (화면은 항상 Rachel이지만 DB는 PC 선택 보존)
    onComplete({ name: name.trim(), level, tutor: isMobile ? (existing?.tutor || "alex") : tutor, goalTopic });
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-2 py-4">
      <p className="text-green-400 text-sm text-center mb-6">
        {existing ? "프로필 수정" : "처음 오셨군요! 간단히 알려주세요 👋"}
      </p>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-400 text-xs">이름 (영어로)</label>
          <span className="text-gray-600 text-xs">{name.length}/20</span>
        </div>
        <input
          type="text"
          placeholder="e.g. Minjun"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={20}
          className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600"
        />
      </div>

      {isMobile && (
        <div className="mb-5 bg-gray-800 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400">
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
                className={`px-4 py-3 rounded-xl border text-center transition-all ${
                  tutor === t.id ? "bg-green-600/15 border-green-500/30 text-white" : "bg-green-500/5 border-green-500/10 text-gray-300 hover:bg-green-500/10"
                }`}
              >
                <div
                  className={`relative w-14 h-14 mx-auto mb-2 rounded-full overflow-hidden ring-2 transition-all ${
                    tutor === t.id ? "ring-green-400" : "ring-gray-700"
                  }`}
                >
                  <Image src={`/tutors/${t.id}.png`} alt={t.label} fill className="object-cover object-top" />
                </div>
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs opacity-70">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-gray-400 text-xs mb-2 block">영어 레벨</label>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`py-2.5 rounded-xl border text-center transition-all ${
                level === l.id
                  ? "bg-gradient-to-r from-green-600 to-emerald-500 border-transparent text-white shadow-md shadow-green-900/30"
                  : "bg-green-500/5 border-green-500/10 text-gray-300 hover:bg-green-500/10"
              }`}
            >
              <span className="font-medium text-sm">{l.label}</span>
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-2">{LEVELS.find((l) => l.id === level)?.desc}</p>
      </div>

      <div
        className={`mb-6 rounded-2xl transition-all ${
          isGoalTopicNew ? "p-3 -m-3 ring-2 ring-emerald-400/40 shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)] bg-emerald-500/[0.04]" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <label className="text-gray-400 text-xs">관심 주제</label>
          {isGoalTopicNew && (
            <span
              className="badge-pop-el text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400"
              style={{ animation: "badge-pop 0.5s ease-out" }}
            >
              NEW
            </span>
          )}
        </div>
        {isGoalTopicNew && (
          <p className="text-gray-500 text-xs mb-2 leading-relaxed">
            새로 추가된 기능이에요! 관심 주제를 골라두면 홈 화면 기본 통화 주제와 통화 후 추천 표현이 이 주제에 맞춰져요.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {GOAL_TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setGoalTopic(t.id)}
              className={`px-3 py-2 rounded-xl border text-left transition-all ${
                goalTopic === t.id
                  ? "bg-gradient-to-r from-green-600 to-emerald-500 border-transparent text-white shadow-md shadow-green-900/30"
                  : "bg-green-500/5 border-green-500/10 text-gray-300 hover:bg-green-500/10"
              }`}
            >
              <span className="font-medium text-sm">{t.label}</span>
            </button>
          ))}
        </div>
        {!isGoalTopicNew && (
          <p className="text-gray-500 text-xs mt-2">
            홈 화면 기본 통화 주제와 통화 후 추천 표현이 여기서 고른 주제에 맞춰져요.
          </p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:bg-none disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-900/30"
      >
        {existing ? "저장" : "시작하기"}
      </button>

      {hasActiveMembership ? (
        <div className="mt-6 bg-green-500/5 border border-green-500/15 rounded-xl p-4 flex items-center justify-between gap-2">
          <p className="text-green-400 text-xs font-medium">
            ✅ 멤버십 이용중{expiresAt ? ` · ${new Date(expiresAt).toLocaleDateString("ko-KR")}까지` : ""}
          </p>
          <a
            href="https://open.kakao.com/o/sPanl0Ci"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-yellow-400 text-xs hover:text-yellow-300"
          >
            💬 문의
          </a>
        </div>
      ) : (
        <div className="mt-6 bg-green-500/5 border border-green-500/15 rounded-xl p-4 space-y-2">
          <p className="text-gray-400 text-xs font-medium">멤버십 요금</p>
          <p className="text-gray-500 text-xs">무료 체험 10분 제공 (가입 후 1주일 이내 자유롭게 이용)</p>
          <MembershipOffer
            liteEligible={liteEligible}
            paymentRequestedAt={paymentRequestedAt}
            requestingPayment={requestingPayment}
            onRequestPayment={onRequestPayment}
            paymentNote={paymentNote}
            onPaymentNoteChange={onPaymentNoteChange}
            paymentRejectReason={paymentRejectReason}
          />
        </div>
      )}

      {userId && sessionToken && <UsageHistory userId={userId} sessionToken={sessionToken} lang="ko" />}
      {userId && sessionToken && <ChangePassword userId={userId} sessionToken={sessionToken} lang="ko" />}
    </div>
  );
}
