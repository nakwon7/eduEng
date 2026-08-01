"use client";

import { useEffect, useState } from "react";
import { MONTHLY_BG, MonthlyBg, pickRandomBg } from "@/lib/monthlyBg";

// 서버/클라이언트 첫 렌더는 항상 같은 값(0번째 후보)으로 맞춰 하이드레이션 불일치를 피하고,
// 마운트 후에 후보 중 하나를 랜덤으로 골라 교체한다.
export function useMonthlyBg(): MonthlyBg | null {
  const month = new Date().getMonth() + 1; // 1~12
  const [bg, setBg] = useState<MonthlyBg | null>(() => MONTHLY_BG[month]?.[0] ?? null);

  useEffect(() => {
    setBg(pickRandomBg(month));
  }, [month]);

  return bg;
}
