"use client";

import Image from "next/image";

// 튜터별 캐릭터 이미지 (public/tutors/ 에 넣으면 됨)
const TUTOR_IMAGE: Record<string, string> = {
  rachel: "/tutors/rachel.png",
  alex:   "/tutors/alex.png",
  jia:    "/tutors/jia.png",
  minjun: "/tutors/minjun.png",
};

// 이미지 없을 때 fallback 이모지
const TUTOR_EMOJI: Record<string, string> = {
  rachel: "🌸",
  alex:   "🎓",
  jia:    "🌸",
  minjun: "🎓",
};

type Props = {
  tutor: string;
  /** 배경 원 색상 — 캐릭터 이미지 없을 때만 보임 */
  fallbackBg?: string;
};

// 배경은 헤더 전체에 깔리므로(useMonthlyBg), 여기서는 캐릭터만 투명하게 얹는다.
export default function TutorAvatar({ tutor, fallbackBg = "bg-green-600" }: Props) {
  const charSrc = TUTOR_IMAGE[tutor];

  if (charSrc) {
    return (
      <div className="relative w-28 h-28 rounded-full overflow-hidden mx-auto mb-3 shadow-lg ring-4 ring-white/10">
        <Image
          src={charSrc}
          alt={tutor}
          fill
          className="object-contain object-bottom"
          priority
        />
      </div>
    );
  }

  // fallback: 이미지 파일 없을 때 기존 이모지 표시
  return (
    <div className={`w-28 h-28 ${fallbackBg} rounded-full flex items-center justify-center text-3xl mx-auto mb-3`}>
      {TUTOR_EMOJI[tutor] ?? "🎓"}
    </div>
  );
}
