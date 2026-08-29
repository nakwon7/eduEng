// 설정 화면의 "배경 테마 선택" 팝업에서 쓰는 월별 테마 목록.
// thumb은 항상 해당 월의 첫 시간대 슬롯(0X-01.jpg)을 미리보기로 쓴다.
export const BG_THEMES = [
  { id: 1, label: "포근한 겨울밤", thumb: "01-01.jpg" },
  { id: 2, label: "눈 덮인 숲", thumb: "02-01.jpg" },
  { id: 3, label: "이른 벚꽃", thumb: "03-01.jpg" },
  { id: 4, label: "만개한 벚꽃", thumb: "04-01.jpg" },
  { id: 5, label: "푸른 들판", thumb: "05-01.jpg" },
  { id: 6, label: "비 내리는 카페", thumb: "06-01.jpg" },
  { id: 7, label: "여름 바다", thumb: "07-01.jpg" },
  { id: 8, label: "해바라기밭", thumb: "08-01.jpg" },
  { id: 9, label: "코스모스", thumb: "09-01.jpg" },
  { id: 10, label: "단풍", thumb: "10-01.jpg" },
  { id: 11, label: "늦가을 안개", thumb: "11-01.jpg" },
  { id: 12, label: "크리스마스", thumb: "12-01.jpg" },
] as const;

export type BgThemeId = (typeof BG_THEMES)[number]["id"];
