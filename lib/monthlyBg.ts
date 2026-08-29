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
  8: "Summer beach",
  9: "Cosmos flowers",
  10: "Autumn leaves",
  11: "Late autumn fog",
  12: "Christmas snow",
};

// 월별로 채워진 시간대 슬롯 개수 (1=주간 사진 1장뿐, 4=아침/오후/저녁/밤 전부)
// public/tutors/bg/ 에 0X-02.jpg, 0X-03.jpg, 0X-04.jpg 를 채운 뒤에만 숫자를 올릴 것
// (숫자만 먼저 올리면 아직 없는 파일을 가리켜서 이미지가 깨짐)
// 2026-08-29: 12개월 전부 4슬롯 채워짐 (48장 완비)
const MONTH_SLOT_COUNT: Record<number, number> = {
  1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4,
  7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4,
};

// 파일을 다른 달과 공유할 때 사용. 이제 8월도 자체 사진 세트가 있어서 비워둠
// (필요하면 여기에 { 달: 재사용할달 } 형태로 다시 추가)
const FILE_MONTH_ALIAS: Record<number, number> = {};

// 슬롯 번호가 뜻하는 시간대 (파일명 0X-01~0X-04 순서와 대응)
function timeSlotForHour(hour: number): number {
  if (hour >= 5 && hour < 11) return 1;   // 아침/주간
  if (hour >= 11 && hour < 17) return 2;  // 오후
  if (hour >= 17 && hour < 20) return 3;  // 저녁
  return 4;                                // 밤
}

// 현재 시각(로컬) 기준으로 그 달의 시간대에 맞는 배경을 고른다.
// 그 달에 아직 다 채워지지 않은 슬롯이면 채워진 것 중 가장 늦은 슬롯으로 대체.
// overrideMonth를 주면 실제 달력 월 대신 그 달로 고정하되(설정에서 테마를 직접 고른 경우),
// 시간대별 슬롯 로테이션은 그대로 접속 시각 기준으로 유지한다.
export function getMonthlyBg(date: Date, overrideMonth?: number | null): MonthlyBg {
  const month = overrideMonth ?? date.getMonth() + 1;
  const srcMonth = FILE_MONTH_ALIAS[month] ?? month;
  const mm = String(srcMonth).padStart(2, "0");
  const available = MONTH_SLOT_COUNT[srcMonth] || 1;
  const slot = Math.min(timeSlotForHour(date.getHours()), available);
  return {
    file: `${mm}-${String(slot).padStart(2, "0")}.jpg`,
    label: MONTH_LABEL[month],
  };
}
