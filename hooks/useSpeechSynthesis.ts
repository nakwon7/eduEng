"use client";

import { useState, useCallback, useRef } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  unlock: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const unlockedRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // 모바일에서 TTS 자동재생 차단 해제 — 반드시 사용자 제스처(터치/클릭) 안에서 호출
  const unlock = useCallback(() => {
    if (!isSupported || unlockedRef.current) return;
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.onend = () => { unlockedRef.current = true; };
    window.speechSynthesis.speak(silent);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, unlock, isSpeaking, isSupported };
}
