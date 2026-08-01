"use client";

interface BetaGateProps {
  onConfirm: () => void;
}

export default function BetaGate({ onConfirm }: BetaGateProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-2 py-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-white text-lg font-bold">시작하기 전에</h2>
        <p className="text-gray-400 text-xs mt-1">TuringCall v1.0</p>
      </div>

      <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-4 mb-6 space-y-2 text-gray-300 text-sm">
        <p>✅ AI 튜터 Alex와 실시간 영어 대화</p>
        <p>✅ 음성 인식 + 음성 응답</p>
        <p>✅ 문법 교정 피드백</p>
        <p className="text-gray-500 text-xs pt-2 border-t border-gray-700">
          Chrome 또는 Samsung 브라우저를 권장합니다.
        </p>
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-green-900/30"
      >
        확인하고 시작하기
      </button>
    </div>
  );
}
