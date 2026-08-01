"use client";

import { useEffect, useState } from "react";
import { getMonthlyBg, MonthlyBg } from "@/lib/monthlyBg";

// 서버/클라이언트 첫 렌더는 항상 같은 값(1번 슬롯)으로 맞춰 하이드레이션 불일치를 피하고,
// 마운트 후에 클라이언트의 현재 시각 기준 시간대 배경으로 교체한다.
export function useMonthlyBg(): MonthlyBg {
  const [bg, setBg] = useState<MonthlyBg>(() => getMonthlyBg(new Date(new Date().setHours(6, 0, 0, 0))));

  useEffect(() => {
    setBg(getMonthlyBg(new Date()));
  }, []);

  return bg;
}
