"use client";

import { useState } from "react";
import { PLANS, PlanId } from "@/lib/plans";
import CopyButton from "./CopyButton";
import PaymentNoteInput from "./PaymentNoteInput";
import PaymentRejectNotice from "./PaymentRejectNotice";

interface MembershipOfferProps {
  liteEligible?: boolean;
  paymentRequestedAt?: string | null;
  requestingPayment?: boolean;
  onRequestPayment?: (plan: PlanId) => void;
  paymentNote?: string;
  onPaymentNoteChange?: (note: string) => void;
  paymentRejectReason?: string | null;
  paymentExempt?: boolean;
  kakaoLabel?: string;
}

export default function MembershipOffer({
  liteEligible,
  paymentRequestedAt,
  requestingPayment,
  onRequestPayment,
  paymentNote,
  onPaymentNoteChange,
  paymentRejectReason,
  paymentExempt,
  kakaoLabel = "💬 가입 문의 (카카오톡)",
}: MembershipOfferProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(liteEligible ? "lite" : "standard");

  return (
    <div className="space-y-2">
      {liteEligible ? (
        <div className="grid grid-cols-2 gap-2">
          {Object.values(PLANS).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`px-3 py-2 rounded-xl border text-left transition-all ${
                selectedPlan === p.id
                  ? "bg-gradient-to-r from-green-600 to-emerald-500 border-transparent text-white shadow-md shadow-green-900/30"
                  : "bg-green-500/5 border-green-500/10 text-gray-300 hover:bg-green-500/10"
              }`}
            >
              <div className="font-medium text-sm">{p.label}</div>
              <div className="text-xs opacity-80">{p.priceWon.toLocaleString()}원 · {p.periodLabel} {p.minutes}분</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-white text-lg font-bold">{PLANS.standard.priceWon.toLocaleString()}원</span>
          <span className="text-gray-400 text-xs">/ 월 · 매월 {PLANS.standard.minutes}분 제공</span>
        </div>
      )}
      <p className="text-gray-400 text-xs flex items-center gap-1">
        KB국민은행 758637-00-012739<CopyButton text="758637-00-012739" />
      </p>
      <p className="text-gray-400 text-xs">예금주: 송랩</p>
      {!paymentExempt && onRequestPayment && (
        paymentRequestedAt ? (
          <p className="mt-1 text-emerald-400 text-xs">✅ 확인 요청됨 · 관리자 확인 후 곧 승인됩니다</p>
        ) : (
          <>
            {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="ko" />}
            {onPaymentNoteChange && (
              <PaymentNoteInput value={paymentNote || ""} onChange={onPaymentNoteChange} variant="bankName" />
            )}
            <button
              onClick={() => onRequestPayment(selectedPlan)}
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
        className="inline-block mt-1 text-yellow-400 hover:text-yellow-300 text-xs"
      >
        {kakaoLabel}
      </a>
    </div>
  );
}
