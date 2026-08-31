"use client";

import { useRef, useState } from "react";

interface Question {
  ko: string;
  en: string;
  categoryId?: string;
  categoryLabel?: string;
}

interface DailyQuestionBannerProps {
  questions: Question[];
  onStart: (question: Question) => void;
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

export default function DailyQuestionBanner({ questions, onStart, disabled }: DailyQuestionBannerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  // 터치 스와이프가 없는 PC(마우스)에서는 스크롤바까지 숨겨놔서 카드를 넘길 방법이 아예 없었음 —
  // 화살표 버튼 + 클릭 가능한 점 인디케이터로 마우스로도 넘길 수 있게 함
  const scrollToIndex = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-gray-400 text-xs">💬 오늘의 질문</span>
        {questions.length > 1 && (
          <span className="text-gray-600 text-[10px]">좌우로 넘겨서 다른 주제 보기</span>
        )}
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {questions.map((q, i) => {
            const tagStyle = CATEGORY_STYLES[q.categoryId || "daily"] || CATEGORY_STYLES.daily;
            return (
              <div
                key={q.categoryId || i}
                className="w-full flex-shrink-0 snap-center rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                {q.categoryLabel && (
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 ${tagStyle}`}>
                    {q.categoryLabel}
                  </span>
                )}
                <p className="text-gray-100 text-base font-semibold leading-snug min-h-[3.5rem]">{q.ko}</p>
                <button
                  onClick={() => onStart(q)}
                  disabled={disabled}
                  className="mt-3 w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all active:scale-[0.98]"
                >
                  이 질문으로 바로 시작
                </button>
              </div>
            );
          })}
        </div>
        {questions.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="이전 질문"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:border-emerald-500/50 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === questions.length - 1}
              aria-label="다음 질문"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:border-emerald-500/50 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            >
              ›
            </button>
          </>
        )}
      </div>
      {questions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`${i + 1}번째 질문으로 이동`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-4 bg-emerald-500" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
