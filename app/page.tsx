"use client";

import { useState, useRef, useCallback } from "react";
import TopicSelector from "@/components/TopicSelector";
import TranscriptBox, { Message } from "@/components/TranscriptBox";
import UserSetup from "@/components/UserSetup";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useUserProfile } from "@/hooks/useUserProfile";

type CallState = "idle" | "calling" | "active";
type View = "home" | "settings";

export default function Home() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [topic, setTopic] = useState("Daily Conversation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [view, setView] = useState<View>("home");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const { profile, saveProfile, loaded } = useUserProfile();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();
  const { speak, stop: stopSpeaking, unlock: unlockTTS, isSpeaking } = useSpeechSynthesis();

  const addMessage = useCallback((msg: Message) => {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
  }, []);

  const startCall = useCallback(async () => {
    // 사용자 제스처 안에서 TTS 잠금 해제 (모바일 자동재생 차단 우회)
    unlockTTS();

    // 마이크 권한 미리 확인
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      alert("마이크 권한이 필요해요. 브라우저 설정에서 허용해주세요.");
      return;
    }

    setCallState("calling");
    setTimeout(() => {
      setCallState("active");
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

      const firstName = profile?.name || "there";
      const greeting =
        topic === "Self Introduction"
          ? `Hello ${firstName}! I'm Alex. Let's practice self-introductions today. Could you start by telling me a bit about yourself?`
          : topic === "Business English"
          ? `Good day ${firstName}! I'm Alex. Let's practice some business English. How would you introduce yourself to a new colleague?`
          : topic === "Travel"
          ? `Hi ${firstName}! I'm Alex. Let's talk about travel today. Have you been anywhere interesting lately?`
          : `Hey ${firstName}! This is Alex, your English tutor. How are you doing today?`;

      addMessage({ role: "assistant", content: greeting });
      speak(greeting);
    }, 1500);
  }, [topic, addMessage, speak, profile]);

  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    setCallState("idle");
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);
  }, [stopSpeaking]);

  const handleMicPress = useCallback(async () => {
    if (isRecording || isSpeaking) return;
    stopSpeaking();
    await startRecording();
  }, [isRecording, isSpeaking, stopSpeaking, startRecording]);

  const handleMicRelease = useCallback(async () => {
    if (!isRecording) return;

    const userText = (await stopRecording()).trim();
    if (!userText) return;

    addMessage({ role: "user", content: userText });
    setIsAiTyping(true);

    const history = messagesRef.current.slice(0, -1);
    const apiMessages = [...history, { role: "user" as const, content: userText }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topic, profile }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      const aiMsgIndex = messagesRef.current.length;
      addMessage({ role: "assistant", content: "" });
      setIsAiTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        messagesRef.current[aiMsgIndex] = { role: "assistant", content: aiText };
        setMessages([...messagesRef.current]);
      }

      speak(aiText);
    } catch {
      setIsAiTyping(false);
      addMessage({
        role: "assistant",
        content: "Sorry, I had a little trouble there. Could you say that again?",
      });
    }
  }, [isRecording, stopRecording, addMessage, topic, speak, profile]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isBusy = isTranscribing || isAiTyping || isSpeaking;
  const micStatus = isRecording
    ? "듣는 중... 손을 떼면 전송"
    : isTranscribing
    ? "인식 중..."
    : isAiTyping
    ? "Alex가 생각 중..."
    : isSpeaking
    ? "Alex가 말하는 중..."
    : "마이크 버튼을 누르고 말하세요";

  if (!loaded) return null;

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
        {/* Header */}
        <div className="bg-gray-800 px-6 pt-8 pb-6 text-center relative">
          {profile && callState === "idle" && view === "home" && (
            <button
              onClick={() => setView("settings")}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-xl"
            >
              ⚙️
            </button>
          )}
          {view === "settings" && (
            <button
              onClick={() => setView("home")}
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-sm"
            >
              ← 뒤로
            </button>
          )}

          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🎓
          </div>
          <h1 className="text-white text-lg font-semibold">Alex</h1>
          <p className="text-gray-400 text-sm">AI English Tutor</p>
          {profile && callState === "idle" && view === "home" && (
            <p className="text-green-400 text-xs mt-1">안녕하세요, {profile.name}님 👋</p>
          )}
          {callState === "active" && (
            <p className="text-green-400 text-sm mt-1 font-mono">{formatTime(callDuration)}</p>
          )}
          {callState === "calling" && (
            <p className="text-yellow-400 text-sm mt-1 animate-pulse">연결 중...</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {view === "settings" ? (
            <UserSetup
              existing={profile || undefined}
              onComplete={(p) => { saveProfile(p); setView("home"); }}
            />
          ) : callState === "idle" ? (
            !profile ? (
              <UserSetup onComplete={saveProfile} />
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <TopicSelector selected={topic} onSelect={setTopic} />
              </div>
            )
          ) : (
            <TranscriptBox
              messages={messages}
              interimTranscript=""
              isAiTyping={isAiTyping || isTranscribing}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-8 pt-4">
          {callState === "idle" && profile && view === "home" && (
            <button
              onClick={startCall}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg"
            >
              📞 통화 시작
            </button>
          )}

          {callState !== "idle" && (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 shadow-lg"
              >
                📵
              </button>

              <button
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onTouchStart={(e) => { e.preventDefault(); handleMicPress(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleMicRelease(); }}
                disabled={callState === "calling" || isBusy && !isRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg select-none ${
                  isRecording
                    ? "bg-red-500 scale-110 ring-4 ring-red-400 ring-opacity-50"
                    : isBusy
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 active:scale-95"
                }`}
              >
                {isRecording ? "🔴" : isTranscribing ? "⏳" : isSpeaking ? "🔊" : "🎤"}
              </button>

              <div className="w-16 h-16" />
            </div>
          )}

          {callState === "active" && (
            <p className="text-gray-500 text-xs text-center mt-3">{micStatus}</p>
          )}
        </div>
      </div>
    </main>
  );
}
