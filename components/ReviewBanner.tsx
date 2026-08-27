"use client";

interface ReviewBannerProps {
  mistake: { original: string; corrected: string; explanation?: string | null; topic?: string | null };
  onStart: () => void;
  disabled?: boolean;
}

export default function ReviewBanner({ mistake, onStart, disabled }: ReviewBannerProps) {
  return (
    <div className="w-full mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400 text-xs">🔁 복습</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400">
          자주 틀리는 표현
        </span>
      </div>
      <p className="text-gray-100 text-base font-semibold leading-snug">{mistake.corrected}</p>
      <p className="text-gray-500 text-xs mt-1 line-through">{mistake.original}</p>
      {mistake.explanation && (
        <p className="text-gray-400 text-xs mt-1">{mistake.explanation}</p>
      )}
      <button
        onClick={onStart}
        disabled={disabled}
        className="mt-3 w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all active:scale-[0.98]"
      >
        이 표현으로 연습하기
      </button>
    </div>
  );
}
