"use client";

import Image from "next/image";

// 월별 배경 이미지 (1~12월, public/tutors/bg/ 에 01.jpg ~ 12.jpg 넣으면 됨)
const MONTHLY_BG: Record<number, { file: string; label: string }> = {
  1:  { file: "01.jpg", label: "Winter snow" },
  2:  { file: "02.jpg", label: "Snowy forest" },
  3:  { file: "03.jpg", label: "Early cherry blossoms" },
  4:  { file: "04.jpg", label: "Cherry blossoms in full bloom" },
  5:  { file: "05.jpg", label: "Green fields" },
  6:  { file: "06.jpg", label: "Rainy café window" },
  7:  { file: "07.jpg", label: "Summer beach" },
  8:  { file: "08.jpg", label: "Sunflower field" },
  9:  { file: "09.jpg", label: "Cosmos flowers" },
  10: { file: "10.jpg", label: "Autumn leaves" },
  11: { file: "11.jpg", label: "Late autumn fog" },
  12: { file: "12.jpg", label: "Christmas snow" },
};

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
  /** 배경 원 색상 — 이미지 없을 때만 보임 */
  fallbackBg?: string;
};

export default function TutorAvatar({ tutor, fallbackBg = "bg-green-600" }: Props) {
  const month = new Date().getMonth() + 1; // 1~12
  const bg = MONTHLY_BG[month];
  const charSrc = TUTOR_IMAGE[tutor];
  const bgSrc = bg ? `/tutors/bg/${bg.file}` : null;

  // 캐릭터 이미지가 있으면 배경+캐릭터 레이어 구조
  // 없으면 기존 이모지 fallback
  if (charSrc) {
    return (
      <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 shadow-lg">
        {/* 배경 레이어 */}
        {bgSrc ? (
          <Image
            src={bgSrc}
            alt={bg?.label ?? ""}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={`absolute inset-0 ${fallbackBg}`} />
        )}
        {/* 캐릭터 레이어 */}
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
    <div className={`w-20 h-20 ${fallbackBg} rounded-full flex items-center justify-center text-3xl mx-auto mb-3`}>
      {TUTOR_EMOJI[tutor] ?? "🎓"}
    </div>
  );
}
