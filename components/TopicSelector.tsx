"use client";

export const TOPICS = [
  { id: "self-intro", label: "자기소개", emoji: "👋", en: "Self Introduction" },
  { id: "daily", label: "일상대화", emoji: "☕", en: "Daily Conversation" },
  { id: "business", label: "비즈니스", emoji: "💼", en: "Business English" },
  { id: "travel", label: "여행", emoji: "✈️", en: "Travel" },
  { id: "health", label: "건강/운동", emoji: "💪", en: "Health & Fitness" },
  { id: "food", label: "음식/요리", emoji: "🍳", en: "Food & Cooking" },
  { id: "movies", label: "영화/드라마", emoji: "🎬", en: "Movies & TV" },
  { id: "work", label: "직장생활", emoji: "🏢", en: "Work & Career" },
];

interface TopicSelectorProps {
  selected: string;
  onSelect: (topic: string) => void;
}

export default function TopicSelector({ selected, onSelect }: TopicSelectorProps) {
  const handleRandom = () => {
    const others = TOPICS.filter((t) => t.en !== selected);
    const pick = others[Math.floor(Math.random() * others.length)];
    onSelect(pick.en);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">오늘의 주제 선택</p>
        <button
          onClick={handleRandom}
          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg transition-all"
        >
          🎲 랜덤
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic.en)}
            className={`p-3 rounded-xl text-left transition-all ${
              selected === topic.en
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span className="text-xl">{topic.emoji}</span>
            <p className="text-sm font-medium mt-1">{topic.label}</p>
            <p className="text-xs opacity-70">{topic.en}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
