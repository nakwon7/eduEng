"use client";

import { useEffect, useRef } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TranscriptBoxProps {
  messages: Message[];
  interimTranscript: string;
  isAiTyping: boolean;
}

export default function TranscriptBox({
  messages,
  interimTranscript,
  isAiTyping,
}: TranscriptBoxProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript, isAiTyping]);

  return (
    <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
      {messages.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          통화 시작 후 마이크 버튼을 누르고 말하세요
        </p>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-green-600 text-white rounded-br-sm"
                : "bg-gray-700 text-gray-100 rounded-bl-sm"
            }`}
          >
            {msg.role === "assistant" && (
              <p className="text-xs text-gray-400 mb-1">Alex (AI Tutor)</p>
            )}
            {msg.content}
          </div>
        </div>
      ))}

      {/* Interim user speech */}
      {interimTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-green-800 text-green-200 rounded-br-sm opacity-70 italic">
            {interimTranscript}
          </div>
        </div>
      )}

      {/* AI typing indicator */}
      {isAiTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-700 px-3 py-2 rounded-2xl rounded-bl-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
