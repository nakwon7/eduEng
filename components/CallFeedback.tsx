"use client";

export type FeedbackData = {
  summary: string;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  goodPhrases: string[];
  suggestions: string[];
  levelTip: string;
};

type Props = {
  feedback: FeedbackData | null;
  isLoading: boolean;
  onDismiss: () => void;
};

export default function CallFeedback({ feedback, isLoading, onDismiss }: Props) {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">AI가 피드백을 분석 중이에요...</p>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        <h2 className="text-white text-sm font-bold text-center">📋 통화 피드백</h2>

        {/* 종합 평가 */}
        <div className="bg-gray-800 rounded-2xl p-4">
          <p className="text-green-400 text-xs font-semibold mb-1">종합 평가</p>
          <p className="text-gray-200 text-xs leading-relaxed">{feedback.summary}</p>
        </div>

        {/* 문법 교정 */}
        {feedback.corrections && feedback.corrections.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-yellow-400 text-xs font-semibold">✏️ 표현 교정</p>
            {feedback.corrections.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✗</span>
                  <span className="text-gray-400 text-xs line-through">{c.original}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-xs mt-0.5">✓</span>
                  <span className="text-green-300 text-xs font-medium">{c.corrected}</span>
                </div>
                <p className="text-gray-500 text-xs pl-4">{c.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* 잘한 표현 */}
        {feedback.goodPhrases && feedback.goodPhrases.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-blue-400 text-xs font-semibold mb-2">👍 잘 쓴 표현</p>
            <div className="space-y-1">
              {feedback.goodPhrases.map((phrase, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 text-xs mt-0.5">•</span>
                  <span className="text-gray-200 text-xs">&ldquo;{phrase}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 추천 표현 */}
        {feedback.suggestions && feedback.suggestions.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-purple-400 text-xs font-semibold mb-2">💡 이런 표현도 써보세요</p>
            <div className="space-y-1">
              {feedback.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-purple-400 text-xs mt-0.5">•</span>
                  <span className="text-gray-200 text-xs">&ldquo;{s}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 레벨 팁 */}
        {feedback.levelTip && (
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-orange-400 text-xs font-semibold mb-1">🎯 오늘의 팁</p>
            <p className="text-gray-200 text-xs leading-relaxed">{feedback.levelTip}</p>
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="mt-3 w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-sm transition-all active:scale-95"
      >
        📞 다시 통화하기
      </button>
    </div>
  );
}
