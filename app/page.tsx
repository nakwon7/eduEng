"use client";

import { useState, useRef, useCallback } from "react";
import TopicSelector from "@/components/TopicSelector";
import TranscriptBox, { Message } from "@/components/TranscriptBox";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type CallState = "idle" | "calling" | "active";

export default function Home() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [topic, setTopic] = useState("Daily Conversation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  const addMessage = useCallback((msg: Message) => {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
  }, []);

  const startCall = useCallback(async () => {
    setCallState("calling");
    setTimeout(() => {
      setCallState("active");
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      const greeting =
        topic === "Self Introduction"
          ? "Hello! I'm Alex, your English tutor. Let's practice self-introductions today. Could you start by telling me your name and what you do?"
          : topic === "Business English"
          ? "Good day! I'm Alex. Let's practice some business English today. Imagine you're in a meeting — how would you introduce yourself to a new colleague?"
          : topic === "Travel"
          ? "Hi there! I'm Alex. Let's talk about travel today. Have you been anywhere interesting lately, or is there somewhere you'd love to visit?"
          : "Hey! This is Alex, your English tutor. How are you doing today? Let's have a nice chat!";

      addMessage({ role: "assistant", content: greeting });
      speak(greeting);
    }, 1500);
  }, [topic, addMessage, speak]);

  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    setCallState("idle");
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);
    resetTranscript();
  }, [stopSpeaking, resetTranscript]);

  const handleMicPress = useCallback(() => {
    if (!isListening) {
      stopSpeaking();
      startListening();
    }
  }, [isListening, stopSpeaking, startListening]);

  const handleMicRelease = useCallback(async () => {
    if (!isListening) return;
    stopListening();

    const userText = transcript.trim();
    if (!userText) return;

    addMessage({ role: "user", content: userText });
    resetTranscript();
    setIsAiTyping(true);

    // Build api messages from history before the new user message
    const history = messagesRef.current.slice(0, -1);
    const apiMessages = [
      ...history,
      { role: "user" as const, content: userText },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topic }),
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
        messagesRef.current[aiMsgIndex] = {
          role: "assistant",
          content: aiText,
        };
        setMessages([...messagesRef.current]);
      }

      speak(aiText);
    } catch {
      setIsAiTyping(false);
      addMessage({
        role: "assistant",
        content:
          "Sorry, I had a little trouble there. Could you say that again?",
      });
    }
  }, [
    isListening,
    stopListening,
    transcript,
    addMessage,
    resetTranscript,
    topic,
    speak,
  ]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
        {/* Header */}
        <div className="bg-gray-800 px-6 pt-8 pb-6 text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🎓
          </div>
          <h1 className="text-white text-lg font-semibold">Alex</h1>
          <p className="text-gray-400 text-sm">AI English Tutor</p>
          {callState === "active" && (
            <p className="text-green-400 text-sm mt-1 font-mono">
              {formatTime(callDuration)}
            </p>
          )}
          {callState === "calling" && (
            <p className="text-yellow-400 text-sm mt-1 animate-pulse">
              연결 중...
            </p>
          )}
          {callState === "idle" && (
            <p className="text-gray-500 text-sm mt-1">통화 대기 중</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {callState === "idle" ? (
            <div className="flex-1 flex flex-col justify-between">
              <TopicSelector selected={topic} onSelect={setTopic} />
              {!isSupported && (
                <p className="text-red-400 text-xs text-center mt-3">
                  ⚠️ Chrome 브라우저에서 사용하세요 (음성 기능 필요)
                </p>
              )}
            </div>
          ) : (
            <TranscriptBox
              messages={messages}
              interimTranscript={isListening ? transcript : ""}
              isAiTyping={isAiTyping}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-8 pt-4">
          {callState === "idle" ? (
            <button
              onClick={startCall}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg"
            >
              📞 통화 시작
            </button>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 shadow-lg"
                title="통화 종료"
              >
                📵
              </button>

              <button
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onTouchStart={handleMicPress}
                onTouchEnd={handleMicRelease}
                disabled={callState === "calling" || isSpeaking}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg ${
                  isListening
                    ? "bg-red-500 scale-110 ring-4 ring-red-400 ring-opacity-50"
                    : isSpeaking
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 active:scale-95"
                }`}
                title={isListening ? "놓으면 전송" : "누르고 말하기"}
              >
                {isListening ? "🔴" : isSpeaking ? "🔊" : "🎤"}
              </button>

              <div className="w-16 h-16" />
            </div>
          )}

          {callState === "active" && (
            <p className="text-gray-500 text-xs text-center mt-3">
              {isListening
                ? "듣는 중... 손을 떼면 전송"
                : isSpeaking
                ? "Alex가 말하는 중..."
                : "마이크 버튼을 누르고 말하세요"}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
