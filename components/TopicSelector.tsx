"use client";

const TOPICS = [
  { id: "self-intro", label: "자기소개", emoji: "👋", en: "Self Introduction" },
  { id: "daily", label: "일상대화", emoji: "☕", en: "Daily Conversation" },
  { id: "business", label: "비즈니스", emoji: "💼", en: "Business English" },
  { id: "travel", label: "여행", emoji: "✈️", en: "Travel" },
];

interface TopicSelectorProps {
  selected: string;
  onSelect: (topic: string) => void;
}

export default function TopicSelector({ selected, onSelect }: TopicSelectorProps) {
  return (
    <div className="w-full">
      <p className="text-gray-400 text-sm mb-3 text-center">오늘의 주제 선택</p>
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
