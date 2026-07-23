"use client";

interface PaymentRejectNoticeProps {
  reason: string;
  lang?: "ko" | "en";
}

export default function PaymentRejectNotice({ reason, lang = "ko" }: PaymentRejectNoticeProps) {
  const title = lang === "ko" ? "⚠️ 확인이 반려됐어요" : "⚠️ Payment not confirmed";

  return (
    <div className="bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2 space-y-0.5 text-left">
      <p className="text-red-400 text-xs font-semibold">{title}</p>
      <p className="text-red-300/90 text-xs leading-relaxed whitespace-pre-line">{reason}</p>
    </div>
  );
}
