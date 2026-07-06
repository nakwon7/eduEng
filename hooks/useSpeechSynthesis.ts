"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  unlock: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // iOS는 speechSynthesis가 중간에 멈추는 버그가 있음 — 주기적으로 resume() 호출
  const startKeepalive = useCallback(() => {
    if (keepaliveRef.current) return;
    keepaliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);
  }, []);

  const stopKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
  }, []);

  useEffect(() => () => stopKeepalive(), [stopKeepalive]);

  // 사용자 터치 시 AudioContext + SpeechSynthesis 동시 잠금 해제
  const unlock = useCallback(() => {
    if (!isSupported) return;

    // 1. AudioContext 잠금 해제
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        audioCtxRef.current = ctx;
      }
    } catch { /* ignore */ }

    // 2. SpeechSynthesis 잠금 해제 (무음 utterance)
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.rate = 2;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(silent);
  }, [isSupported]);

  const doSpeak = useCallback(
    (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => { setIsSpeaking(true); startKeepalive(); };
      utterance.onend = () => { setIsSpeaking(false); stopKeepalive(); };
      utterance.onerror = () => { setIsSpeaking(false); stopKeepalive(); };

      window.speechSynthesis.speak(utterance);
    },
    [startKeepalive, stopKeepalive]
  );

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;
      window.speechSynthesis.cancel();

      // 보이스가 아직 로드 안 됐으면 로드될 때까지 대기
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setTimeout(() => doSpeak(text), 100);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          setTimeout(() => doSpeak(text), 100);
        };
      }
    },
    [isSupported, doSpeak]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopKeepalive();
  }, [isSupported, stopKeepalive]);

  return { speak, stop, unlock, isSpeaking, isSupported };
}
