"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string, gender?: "male" | "female") => void;
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

        let preferred: SpeechSynthesisVoice | undefined;

        if (gender === "male") {
          preferred =
            // 1. en-US 중 남성 힌트 포함
            voices.find((v) => v.lang === "en-US" && maleHints.some((h) => v.name.toLowerCase().includes(h))) ||
            // 2. 모든 영어 중 남성 힌트 포함 (en-GB "Google UK English Male" 등)
            enVoices.find((v) => maleHints.some((h) => v.name.toLowerCase().includes(h))) ||
            // 3. 여성 힌트가 없는 en-US 보이스
            voices.find((v) => v.lang === "en-US" && !femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
            // 4. 여성 힌트가 없는 영어 보이스
            enVoices.find((v) => !femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
            enVoices[0];
        } else {
          preferred =
            voices.find((v) => v.lang === "en-US" && femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
            enVoices.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h))) ||
            voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
            voices.find((v) => v.lang === "en-US") ||
            enVoices[0];
        }

        if (preferred) utterance.voice = preferred;

        // 남성 보이스를 못 찾았거나 여성 보이스로 폴백된 경우 pitch를 더 낮춤
        if (gender === "male" && preferred) {
          const isActuallyMale = maleHints.some((h) => preferred!.name.toLowerCase().includes(h));
          if (!isActuallyMale) {
            utterance.pitch = 0.4;
            utterance.rate = 0.85;
          }
        }

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
