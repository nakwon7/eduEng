"use client";

import { useEffect, useState } from "react";

export default function KakaoExternalRedirect() {
  const [showBanner, setShowBanner] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent;
    const isKakao = /KAKAOTALK/i.test(ua) || /KAKAO/i.test(ua);
    if (!isKakao) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("openExternalBrowser") === "1") return;

    url.searchParams.set("openExternalBrowser", "1");
    const targetUrl = url.toString();
    setExternalUrl(targetUrl);

    // Android KakaoTalk은 이 리다이렉트로 자동으로 외부 브라우저 오픈
    window.location.href = targetUrl;

    // iOS는 위 방법이 안 되므로 500ms 후 배너 표시
    const t = setTimeout(() => setShowBanner(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-5">🎙️</div>
      <h2 className="text-white text-xl font-bold mb-2">외부 브라우저에서 열어주세요</h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        카카오톡 내부 브라우저에서는 마이크 및 음성이 작동하지 않아요.
        <br />
        Chrome 또는 Safari에서 열어주세요.
      </p>
      <a
        href={externalUrl}
        className="block w-full max-w-xs py-4 bg-green-600 text-white rounded-2xl font-bold text-lg"
      >
        외부 브라우저로 열기
      </a>
      <p className="text-gray-500 text-xs mt-5 leading-relaxed">
        버튼이 안 되면: 우측 하단 <strong className="text-gray-400">···</strong> →{" "}
        <strong className="text-gray-400">다른 브라우저로 열기</strong>
      </p>
    </div>
  );
}
