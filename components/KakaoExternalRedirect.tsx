"use client";

import { useEffect } from "react";

/**
 * 카카오톡 인앱브라우저 감지 시 외부 브라우저로 강제 리다이렉트.
 * URL에 ?openExternalBrowser=1 을 추가하면 카카오톡이 자동으로 외부 브라우저를 열어줍니다.
 */
export default function KakaoExternalRedirect() {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isKakao = /KAKAOTALK/i.test(ua) || /kakao/i.test(ua);
    if (!isKakao) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("openExternalBrowser") === "1") return;

    url.searchParams.set("openExternalBrowser", "1");
    window.location.replace(url.toString());
  }, []);

  return null;
}
