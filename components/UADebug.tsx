"use client";

// TEMP: 당근마켓 인앱브라우저 User-Agent 문자열 확인용. 확인 끝나면 제거할 것.
import { useEffect, useState } from "react";

export default function UADebug() {
  const [ua, setUa] = useState("");

  useEffect(() => {
    setUa(navigator.userAgent);
  }, []);

  if (!ua) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/80 text-yellow-300 text-[10px] leading-tight p-2 break-all font-mono">
      UA: {ua}
    </div>
  );
}
