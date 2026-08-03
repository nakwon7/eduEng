export type PlanId = "standard" | "lite";

export interface PlanConfig {
  id: PlanId;
  label: string;
  priceWon: number;
  minutesPerMonth: number;
  secondsPerMonth: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  standard: { id: "standard", label: "스탠다드", priceWon: 9900, minutesPerMonth: 900, secondsPerMonth: 900 * 60 },
  lite: { id: "lite", label: "라이트", priceWon: 5000, minutesPerMonth: 300, secondsPerMonth: 300 * 60 },
};

export function planOf(plan: string | null | undefined): PlanConfig {
  return PLANS[plan as PlanId] ?? PLANS.standard;
}

export function isLiteEligible(paymentCount: number): boolean {
  return paymentCount === 0;
}
