"use client";

export const TOPICS = [
  {
    id: "word-desc", label: "단어 설명하기", en: "Word Description",
    color: "bg-fuchsia-500/15 text-fuchsia-400",
    cardTint: "bg-fuchsia-500/5 border-fuchsia-500/15",
    icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  },
  {
    id: "self-intro", label: "자기소개", en: "Self Introduction",
    color: "bg-blue-500/15 text-blue-400",
    cardTint: "bg-blue-500/5 border-blue-500/15",
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
  {
    id: "daily", label: "일상대화", en: "Daily Conversation",
    color: "bg-orange-500/15 text-orange-400",
    cardTint: "bg-orange-500/5 border-orange-500/15",
    icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>,
  },
  {
    id: "business", label: "비즈니스", en: "Business English",
    color: "bg-slate-500/15 text-slate-300",
    cardTint: "bg-slate-500/5 border-slate-500/15",
    icon: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  },
  {
    id: "travel", label: "여행", en: "Travel",
    color: "bg-cyan-500/15 text-cyan-400",
    cardTint: "bg-cyan-500/5 border-cyan-500/15",
    icon: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  },
  {
    id: "health", label: "건강/운동", en: "Health & Fitness",
    color: "bg-rose-500/15 text-rose-400",
    cardTint: "bg-rose-500/5 border-rose-500/15",
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
  {
    id: "food", label: "음식/요리", en: "Food & Cooking",
    color: "bg-yellow-500/15 text-yellow-400",
    cardTint: "bg-yellow-500/5 border-yellow-500/15",
    icon: <><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></>,
  },
  {
    id: "movies", label: "영화/드라마", en: "Movies & TV",
    color: "bg-purple-500/15 text-purple-400",
    cardTint: "bg-purple-500/5 border-purple-500/15",
    icon: <><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>,
  },
  {
    id: "work", label: "직장생활", en: "Work & Career",
    color: "bg-indigo-500/15 text-indigo-400",
    cardTint: "bg-indigo-500/5 border-indigo-500/15",
    icon: <><rect x="4" y="2" width="16" height="20" rx="1" ry="1" /><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="14" x2="20" y2="14" /><line x1="4" y1="19" x2="20" y2="19" /><line x1="9" y1="2" x2="9" y2="22" /><line x1="15" y1="2" x2="15" y2="22" /></>,
  },
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
            className={`p-3 rounded-xl border text-left transition-all ${
              selected === topic.en
                ? "bg-gradient-to-br from-green-600 to-emerald-500 border-transparent text-white shadow-lg shadow-green-900/30"
                : `${topic.cardTint} text-gray-300 hover:bg-white/5`
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected === topic.en ? "bg-white/15 text-white" : topic.color}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                {topic.icon}
              </svg>
            </div>
            <p className="text-sm font-medium mt-1">{topic.label}</p>
            <p className="text-xs opacity-70">{topic.en}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
