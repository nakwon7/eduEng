"use client";

import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderKoReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string>;
}

export function useAudioRecorderKo(): UseAudioRecorderKoReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve("");
        return;
      }

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setIsRecording(false);

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationMs = Date.now() - startedAtRef.current;

        // 너무 짧은 녹음(탭)은 Whisper가 "감사합니다" 같은 문구를 환각하므로 전송하지 않음
        if (durationMs < 400 || blob.size < 1000) {
          resolve("");
          return;
        }

        setIsTranscribing(true);
        try {
          const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
          const formData = new FormData();
          formData.append("file", blob, `audio.${ext}`);

          const res = await fetch("/api/transcribe-ko", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          resolve(data.text || "");
        } catch {
          resolve("");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.stop();
    });
  }, []);

  return { isRecording, isTranscribing, startRecording, stopRecording };
}
