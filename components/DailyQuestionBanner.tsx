"use client";

interface DailyQuestionBannerProps {
  question: { ko: string; en: string; categoryId?: string; categoryLabel?: string };
  onStart: () => void;
  disabled?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  kpop: "bg-fuchsia-500/15 text-fuchsia-400",
  celeb: "bg-rose-500/15 text-rose-400",
  realestate: "bg-slate-500/15 text-slate-300",
  prices: "bg-yellow-500/15 text-yellow-400",
  stocks: "bg-emerald-500/15 text-emerald-400",
  travel: "bg-cyan-500/15 text-cyan-400",
  tech: "bg-indigo-500/15 text-indigo-400",
  sports: "bg-orange-500/15 text-orange-400",
  daily: "bg-gray-500/15 text-gray-300",
};

export default function DailyQuestionBanner({ question, onStart, disabled }: DailyQuestionBannerProps) {
  const tagStyle = CATEGORY_STYLES[question.categoryId || "daily"] || CATEGORY_STYLES.daily;

  return (
    <div className="w-full mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400 text-xs">💬 오늘의 질문</span>
        {question.categoryLabel && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagStyle}`}>
            {question.categoryLabel}
          </span>
        )}
      </div>
      <p className="text-white text-base font-semibold leading-snug">{question.ko}</p>
      <button
        onClick={onStart}
        disabled={disabled}
        className="mt-3 w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all active:scale-[0.98]"
      >
        이 질문으로 바로 시작
      </button>
    </div>
  );
}
