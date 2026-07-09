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
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFallback(), [clearFallback]);

  const unlock = useCallback(() => {
    if (!isSupported) return;

    // AudioContext 잠금 해제
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

    // SpeechSynthesis 잠금 해제
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
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = gender === "male" ? 0.8 : 1.1;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const enVoices = voices.filter((v) => v.lang.startsWith("en"));

        const maleHints = ["male", "david", "mark", "james", "daniel", "fred", "oliver", "guy", "rishi"];
        const femaleHints = ["female", "zira", "samantha", "google us english", "susan", "victoria", "karen", "moira", "fiona"];
        const hints = gender === "male" ? maleHints : femaleHints;

        const preferred =
          voices.find((v) => v.lang === "en-US" && hints.some((h) => v.name.toLowerCase().includes(h))) ||
          enVoices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) ||
          voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
          voices.find((v) => v.lang === "en-US") ||
          enVoices[0];
        if (preferred) utterance.voice = preferred;

        const done = () => {
          clearFallback();
          setIsSpeaking(false);
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = done;
        utterance.onerror = done;

        // 텍스트 길이 기반 fallback 타이머 (onend 안 오는 경우 대비)
        // 약 80ms/글자 + 여유 3초
        const estimatedMs = text.length * 80 + 3000;
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

  return { speak, stop, unlock, isSpeaking, isSupported };
}
