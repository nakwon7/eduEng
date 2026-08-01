export type MonthlyBg = { file: string; label: string };

// 월별 대표 라벨 (배경 설명용, 파일명과는 무관)
const MONTH_LABEL: Record<number, string> = {
  1: "Winter snow",
  2: "Snowy forest",
  3: "Early cherry blossoms",
  4: "Cherry blossoms in full bloom",
  5: "Green fields",
  6: "Rainy café window",
  7: "Summer beach",
  8: "Sunflower field",
  9: "Cosmos flowers",
  10: "Autumn leaves",
  11: "Late autumn fog",
  12: "Christmas snow",
};

// 월별 배경 이미지 후보 개수. 지금은 각 월에 -01.jpg 1장만 있음.
// public/tutors/bg/ 에 01-02.jpg, 01-03.jpg ... 를 12개월 모두 채워 넣은 뒤에만 이 숫자를 올릴 것
// (숫자만 먼저 올리면 아직 없는 파일을 가리켜서 이미지가 깨짐)
const BG_VARIANTS_PER_MONTH = 1;

// { file: "01-01.jpg", label: "Winter snow" } 형태로 월별 후보 배열을 자동 생성
function buildMonthlyBg(): Record<number, MonthlyBg[]> {
  const result: Record<number, MonthlyBg[]> = {};
  for (let month = 1; month <= 12; month++) {
    const mm = String(month).padStart(2, "0");
    result[month] = Array.from({ length: BG_VARIANTS_PER_MONTH }, (_, i) => ({
      file: `${mm}-${String(i + 1).padStart(2, "0")}.jpg`,
      label: MONTH_LABEL[month],
    }));
  }
  return result;
}

export const MONTHLY_BG: Record<number, MonthlyBg[]> = buildMonthlyBg();

export function pickRandomBg(month: number): MonthlyBg | null {
  const variants = MONTHLY_BG[month];
  if (!variants || variants.length === 0) return null;
  return variants[Math.floor(Math.random() * variants.length)];
}
