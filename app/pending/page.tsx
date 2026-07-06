export default function PendingPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-white text-lg font-bold mb-2">승인 대기 중</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          관리자 승인 후 이용 가능합니다.<br />
          승인 완료 후 다시 로그인해 주세요.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block text-green-400 hover:text-green-300 text-sm"
        >
          로그인으로 돌아가기 →
        </a>
      </div>
    </main>
  );
}
