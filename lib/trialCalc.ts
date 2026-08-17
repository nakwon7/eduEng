// 무료 체험: 가입 후 1주일 이내에 총 10분을 자유롭게 사용 (매주 재충전되는 방식이 아닌 1회성).
// 7일이 지나면 다 못 썼어도 소멸. 클라이언트/서버 양쪽에서 쓰는 순수 계산 로직 (DB 접근 없음).
export const TRIAL_TOTAL_SECONDS = 10 * 60;
export const TRIAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function trialRemainingSeconds(
  totalSeconds: number,
  trialBaselineSeconds: number,
  trialStartedAt: string | null
): number {
  if (!trialStartedAt) return 0;
  if (Date.now() - new Date(trialStartedAt).getTime() >= TRIAL_WINDOW_MS) return 0;
  const used = Math.max(0, (totalSeconds ?? 0) - (trialBaselineSeconds ?? 0));
  return Math.max(0, TRIAL_TOTAL_SECONDS - used);
}
