"use client";

import { useCallback, useEffect, useState } from "react";

interface UsageHistoryProps {
  userId: string;
  sessionToken: string;
  lang?: "ko" | "en";
}

const MONTH_LABELS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TEXT = {
  ko: {
    title: "사용 내역",
    loading: "불러오는 중...",
    total: (min: number) => `합계: ${min}분`,
    empty: "해당 월 사용 기록이 없습니다",
    minute: (min: number) => `${min}분`,
    month: (m: number) => `${m}월`,
  },
  en: {
    title: "Usage History",
    loading: "Loading...",
    total: (min: number) => `Total: ${min} min`,
    empty: "No usage this month",
    minute: (min: number) => `${min} min`,
    month: (m: number) => MONTH_LABELS_EN[m - 1],
  },
};

export default function UsageHistory({ userId, sessionToken, lang = "ko" }: UsageHistoryProps) {
  const t = TEXT[lang];
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [logs, setLogs] = useState<{ date: string; seconds: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/usage/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, year, month }),
    });
    const data = await res.json();
    setLogs(res.ok ? data.logs || [] : []);
    setLoading(false);
  }, [userId, sessionToken, year, month]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalMinutes = Math.floor(logs.reduce((s, l) => s + l.seconds, 0) / 60);
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  return (
    <div className="mt-4 bg-gray-900 rounded-xl p-4 space-y-2">
      <p className="text-gray-400 text-xs font-medium">{t.title}</p>
      <div className="flex gap-2">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{t.month(m)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600 text-xs text-center py-2">{t.loading}</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-2">{t.empty}</p>
      ) : (
        <>
          <p className="text-gray-300 text-xs font-medium pt-1">{t.total(totalMinutes)}</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((l) => (
              <div key={l.date} className="flex justify-between text-xs">
                <span className="text-gray-500">{l.date}</span>
                <span className="text-gray-300">{t.minute(Math.floor(l.seconds / 60))}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
