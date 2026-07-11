"use client";

interface BetaGateProps {
  onConfirm: () => void;
}

export default function BetaGate({ onConfirm }: BetaGateProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-2 py-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🧪</div>
        <h2 className="text-white text-lg font-bold">베타 테스트</h2>
        <p className="text-gray-400 text-xs mt-1">TuringCall Beta v0.1</p>
      </div>

      <div className="bg-gray-800 rounded-2xl p-4 mb-6 space-y-2 text-gray-300 text-sm">
        <p>✅ AI 튜터 Alex와 실시간 영어 대화</p>
        <p>✅ 음성 인식 + 음성 응답</p>
        <p>✅ 문법 교정 피드백</p>
        <p className="text-gray-500 text-xs pt-2 border-t border-gray-700">
          베타 버전으로 일부 기능이 불안정할 수 있습니다.<br />
          Chrome 또는 Samsung 브라우저를 권장합니다.
        </p>
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95"
      >
        확인하고 시작하기
      </button>
    </div>
  );
}
