export type PlanId = "standard" | "lite";

export interface PlanConfig {
  id: PlanId;
  label: string;
  priceWon: number;
  periodLabel: string; // "월" | "주"
  minutes: number;
  seconds: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  standard: { id: "standard", label: "스탠다드", priceWon: 9900, periodLabel: "월", minutes: 600, seconds: 600 * 60 },
  lite: { id: "lite", label: "라이트", priceWon: 5000, periodLabel: "주", minutes: 2, seconds: 2 * 60 }, // TEMP TEST VALUE — revert to 140 after testing
};

export function planOf(plan: string | null | undefined): PlanConfig {
  return PLANS[plan as PlanId] ?? PLANS.standard;
}

export function isLiteEligible(paymentCount: number): boolean {
  return paymentCount === 0;
}
