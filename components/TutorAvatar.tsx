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
  /** 통화 연결 중일 때 은은한 링 펄스 효과 */
  connecting?: boolean;
  /** 튜터가 말하는 중일 때 은은하게 숨쉬는 링 효과 */
  speaking?: boolean;
};

// 배경은 헤더 전체에 깔리므로(useMonthlyBg), 여기서는 캐릭터만 투명하게 얹는다.
export default function TutorAvatar({ tutor, fallbackBg = "bg-green-600", connecting, speaking }: Props) {
  const charSrc = TUTOR_IMAGE[tutor];

  // connecting은 짧게 튀는 ping, speaking은 발화가 몇 초씩 이어져도 산만하지 않게
  // 숨쉬듯 저물었다 켜지는 pulse로 구분한다
  const ring = connecting ? (
    <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/60 animate-ping" />
  ) : speaking ? (
    <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/50 animate-pulse" />
  ) : null;

  if (charSrc) {
    return (
      <div className="relative w-28 h-28 mx-auto mb-3">
        {ring}
        <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg ring-4 ring-white/10">
          <Image
            src={charSrc}
            alt={tutor}
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
    );
  }

  // fallback: 이미지 파일 없을 때 기존 이모지 표시
  return (
    <div className="relative w-28 h-28 mx-auto mb-3">
      {ring}
      <div className={`relative w-full h-full ${fallbackBg} rounded-full flex items-center justify-center text-3xl`}>
        {TUTOR_EMOJI[tutor] ?? "🎓"}
      </div>
    </div>
  );
}
