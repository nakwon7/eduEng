"use client";

import { useEffect, useState } from "react";

const DEBUG = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_UA_DEBUG === "1";

export default function KakaoExternalRedirect() {
  const [show, setShow] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [intentUrl, setIntentUrl] = useState("");
  const [ua, setUa] = useState("");

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setUa(userAgent);

    const isKakao = /KAKAOTALK/i.test(userAgent) || /KAKAO/i.test(userAgent);

    if (DEBUG) {
      // 디버그 모드: 항상 배너 표시해서 UA 확인
      setIsAndroid(/Android/i.test(userAgent));
      setShow(true);
      return;
    }

    if (!isKakao) return;

    const android = /Android/i.test(userAgent);
    setIsAndroid(android);

    if (android) {
      const path = window.location.pathname + window.location.search + window.location.hash;
      const host = window.location.host;
      setIntentUrl(
        `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`
      );
    }

    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-5">🎙️</div>
      <h2 className="text-white text-xl font-bold mb-2">외부 브라우저에서 열어주세요</h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        카카오톡 내부 브라우저에서는 마이크와 튜터 목소리가 작동하지 않아요.
        <br />
        {isAndroid ? "Chrome" : "Safari"}에서 열어주세요.
      </p>

      {isAndroid ? (
        <a
          href={intentUrl}
          className="block w-full max-w-xs py-4 bg-green-600 text-white rounded-2xl font-bold text-lg"
        >
          Chrome으로 열기
        </a>
      ) : (
        <div className="w-full max-w-xs bg-gray-900 rounded-2xl p-5 text-left space-y-3 text-sm text-gray-300">
          <p className="font-semibold text-white">Safari에서 여는 방법</p>
          <p>1. 하단 가운데 <strong className="text-gray-100">공유 버튼(↑)</strong> 탭</p>
          <p>2. <strong className="text-gray-100">Safari로 열기</strong> 선택</p>
        </div>
      )}

      <p className="text-gray-600 text-xs mt-5">
        또는 우측 하단 <strong className="text-gray-500">···</strong> → 다른 브라우저로 열기
      </p>

      {DEBUG && (
        <div className="mt-6 w-full max-w-xs bg-gray-900 rounded-xl p-3 text-left">
          <p className="text-yellow-400 text-xs font-mono font-bold mb-1">UA DEBUG</p>
          <p className="text-gray-400 text-xs font-mono break-all">{ua}</p>
          <p className="text-gray-500 text-xs mt-2">
            isKakao: <span className="text-white">{String(/KAKAOTALK/i.test(ua) || /KAKAO/i.test(ua))}</span>
          </p>
        </div>
      )}
    </div>
  );
}
