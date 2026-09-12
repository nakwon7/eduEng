"use client";

import Image from "next/image";

// "기본테마(자동)"는 고정 사진이 없어서 대표 계절 4장을 콜라주로 보여준다 —
// 시간대/계절에 따라 자동으로 바뀐다는 걸 한눈에 알 수 있게
const DEFAULT_THEME_PREVIEW = ["04-01.jpg", "07-01.jpg", "10-01.jpg", "01-01.jpg"];

export default function DefaultThemeCollage({ showBadge, badgeLabel = "자동" }: { showBadge?: boolean; badgeLabel?: string }) {
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-gray-900">
      {DEFAULT_THEME_PREVIEW.map((file) => (
        <div key={file} className="relative bg-gray-700">
          <Image src={`/tutors/bg/${file}`} alt="" fill className="object-cover object-top" />
        </div>
      ))}
      {showBadge && (
        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold leading-none shadow">
          {badgeLabel}
        </span>
      )}
    </div>
  );
}
