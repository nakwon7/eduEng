"use client";

interface DailyQuestionBannerProps {
  question: { ko: string; en: string };
  onStart: () => void;
  disabled?: boolean;
}

export default function DailyQuestionBanner({ question, onStart, disabled }: DailyQuestionBannerProps) {
  return (
    <div className="w-full mb-4 rounded-xl border border-green-500/15 bg-green-500/5 p-3">
      <p className="text-gray-400 text-xs mb-1">💬 오늘의 질문</p>
      <p className="text-white text-sm font-medium leading-relaxed">{question.ko}</p>
      <button
        onClick={onStart}
        disabled={disabled}
        className="mt-2 w-full py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all"
      >
        이 질문으로 바로 시작
      </button>
    </div>
  );
}
