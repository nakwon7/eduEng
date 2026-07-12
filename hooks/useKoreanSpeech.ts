"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseKoreanSpeechReturn {
  speak: (text: string, gender?: "male" | "female") => void;
  stop: () => void;
  unlock: () => void;
  isSpeaking: boolean;
}

export function useKoreanSpeech(): UseKoreanSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFallback(), [clearFallback]);

  const unlock = useCallback(() => {
    if (!isSupported) return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch { /* ignore */ }
    window.speechSynthesis.cancel();
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    silent.rate = 2;
    window.speechSynthesis.speak(silent);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, gender: "male" | "female" = "female") => {
      if (!isSupported || !text.trim()) return;
      clearFallback();
      window.speechSynthesis.cancel();

      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";
        utterance.rate = gender === "male" ? 0.9 : 1.1;
        utterance.pitch = gender === "male" ? 0.1 : 1.6;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const koVoices = voices.filter((v) => v.lang.startsWith("ko"));

        const maleHints = ["injoon", "in-joon", "인준", "남성", "male", "유준", "현우"];
        // Google 한국의 목소리가 Microsoft Heami보다 젊고 자연스러운 편
        const femaleHints = ["google 한국의", "google korean", "female", "여성", "지원", "수진", "heami", "혜미"];
        const hints = gender === "male" ? maleHints : femaleHints;

        const preferred =
          koVoices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) ||
          (gender === "male" ? null : koVoices[0]) ||
          voices.find((v) => v.lang.startsWith("ko"));
        if (preferred) utterance.voice = preferred;

        // 남성 음성 못 찾아 여성 음성으로 폴백된 경우 pitch 조정
        if (gender === "male" && preferred) {
          const isActuallyMale = maleHints.some((h) => preferred!.name.toLowerCase().includes(h));
          if (!isActuallyMale) {
            utterance.pitch = 0.5;
            utterance.rate = 0.85;
          }
        }

        const done = () => { clearFallback(); setIsSpeaking(false); };
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = done;
        utterance.onerror = done;

        const estimatedMs = text.length * 120 + 3000;
        fallbackTimerRef.current = setTimeout(done, estimatedMs);
        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setTimeout(doSpeak, 100);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          setTimeout(doSpeak, 100);
        };
      }
    },
    [isSupported, clearFallback]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    clearFallback();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported, clearFallback]);

  return { speak, stop, unlock, isSpeaking };
}
