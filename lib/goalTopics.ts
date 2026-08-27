// 온보딩/설정에서 고르는 "관심 주제" 목록. TopicSelector.tsx의 TOPICS와 카테고리는 맞추되
// 아이콘 등 UI 전용 데이터가 없는 경량 버전 — 서버(API route)에서도 그대로 import해서 쓴다.
export const GOAL_TOPICS = [
  { id: "daily", label: "일상대화", en: "Daily Conversation" },
  { id: "business", label: "비즈니스", en: "Business English" },
  { id: "travel", label: "여행", en: "Travel" },
  { id: "health", label: "건강/운동", en: "Health & Fitness" },
  { id: "food", label: "음식/요리", en: "Food & Cooking" },
  { id: "movies", label: "영화/드라마", en: "Movies & TV" },
  { id: "work", label: "직장생활", en: "Work & Career" },
] as const;

export type GoalTopicId = (typeof GOAL_TOPICS)[number]["id"];

export const GOAL_TOPIC_IDS: string[] = GOAL_TOPICS.map((t) => t.id);
