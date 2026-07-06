"use client";

import { useState } from "react";
import { UserProfile } from "@/hooks/useUserProfile";

interface UserSetupProps {
  onComplete: (profile: UserProfile) => void;
}

const LEVELS = [
  { id: "beginner", label: "초급", desc: "기초 문법, 간단한 대화" },
  { id: "intermediate", label: "중급", desc: "일상 대화 가능, 표현 확장 중" },
  { id: "advanced", label: "고급", desc: "자유로운 대화, 뉘앙스 학습" },
] as const;

export default function UserSetup({ onComplete }: UserSetupProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<UserProfile["level"]>("intermediate");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onComplete({ name: name.trim(), level });
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-2 py-4">
      <p className="text-green-400 text-sm text-center mb-6">
        처음 오셨군요! 간단히 알려주세요 👋
      </p>

      {/* 이름 */}
      <div className="mb-5">
        <label className="text-gray-400 text-xs mb-2 block">이름 (영어로)</label>
        <input
          type="text"
          placeholder="e.g. Minjun"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600"
        />
      </div>

      {/* 레벨 */}
      <div className="mb-6">
        <label className="text-gray-400 text-xs mb-2 block">영어 레벨</label>
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                level === l.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span className="font-medium text-sm">{l.label}</span>
              <span className="text-xs opacity-70 ml-2">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all"
      >
        시작하기
      </button>
    </div>
  );
}
