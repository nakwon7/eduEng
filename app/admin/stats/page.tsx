"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "daily" | "monthly" | "yearly" | "topic" | "user";

interface DailyStat { date: string; seconds: number; calls: number; }
interface MonthlyStat { month: string; seconds: number; calls: number; }
interface YearlyStat { year: string; seconds: number; calls: number; }
interface TopicStat { topic: string; seconds: number; calls: number; }
interface UserStat { id: string; username: string; name: string; level: string; total_seconds: number; created_at: string; status: string; }

interface Stats {
  daily: DailyStat[];
  monthly: MonthlyStat[];
  yearly: YearlyStat[];
  byTopic: TopicStat[];
  byUser: UserStat[];
}

const LEVEL: Record<string, string> = { beginner: "초급", intermediate: "중급", advanced: "고급" };

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function Bar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("daily");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem("turingcall_session");
    if (!sessionToken) { router.push("/login"); return; }

    supabase.auth.getSession().then(({ data: sessionData }) => {
      const userId = sessionData.session?.user?.id;
      if (!userId) { router.push("/login"); return; }

      fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.error) { setError(true); return; }
          setStats(d);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500">불러오는 중...</p>
    </div>
  );

  if (error || !stats) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-red-400">권한이 없거나 오류가 발생했습니다.</p>
    </div>
  );

  const totalSeconds = stats.byUser.reduce((s, u) => s + u.total_seconds, 0);
  const totalUsers = stats.byUser.length;
  const paidUsers = stats.byUser.filter((u) => u.status === "멤버십" || u.status === "무제한").length;
  const totalCalls = stats.daily.reduce((s, d) => s + d.calls, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "daily", label: "일별" },
    { key: "monthly", label: "월별" },
    { key: "yearly", label: "연별" },
    { key: "topic", label: "주제별" },
    { key: "user", label: "사용자별" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">통계</h1>
          <button onClick={() => router.push("/app")} className="text-gray-400 hover:text-white text-sm transition-colors">
            ← 앱으로
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard label="전체 회원" value={`${totalUsers}명`} />
          <SummaryCard label="유료 회원" value={`${paidUsers}명`} />
          <SummaryCard label="최근 30일 통화" value={`${totalCalls}건`} />
          <SummaryCard label="누적 통화 시간" value={fmt(totalSeconds)} />
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 일별 */}
        {tab === "daily" && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">최근 30일 통화 시간</h2>
            {stats.daily.length === 0 ? (
              <p className="text-gray-500 text-sm">데이터 없음</p>
            ) : (() => {
              const max = Math.max(...stats.daily.map((d) => d.seconds));
              return stats.daily.map((d) => (
                <div key={d.date} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{d.date}</span>
                    <span>{fmt(d.seconds)} · {d.calls}건</span>
                  </div>
                  <Bar value={d.seconds} max={max} color="bg-blue-500" />
                </div>
              ));
            })()}
          </div>
        )}

        {/* 월별 */}
        {tab === "monthly" && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">최근 12개월 통화 시간</h2>
            {stats.monthly.length === 0 ? (
              <p className="text-gray-500 text-sm">데이터 없음</p>
            ) : (() => {
              const max = Math.max(...stats.monthly.map((d) => d.seconds));
              return stats.monthly.map((d) => (
                <div key={d.month} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{d.month}</span>
                    <span>{fmt(d.seconds)} · {d.calls}건</span>
                  </div>
                  <Bar value={d.seconds} max={max} color="bg-indigo-500" />
                </div>
              ));
            })()}
          </div>
        )}

        {/* 연별 */}
        {tab === "yearly" && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">연별 통화 시간</h2>
            {stats.yearly.length === 0 ? (
              <p className="text-gray-500 text-sm">데이터 없음</p>
            ) : (() => {
              const max = Math.max(...stats.yearly.map((d) => d.seconds));
              return stats.yearly.map((d) => (
                <div key={d.year} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{d.year}년</span>
                    <span>{fmt(d.seconds)} · {d.calls}건</span>
                  </div>
                  <Bar value={d.seconds} max={max} color="bg-purple-500" />
                </div>
              ));
            })()}
          </div>
        )}

        {/* 주제별 */}
        {tab === "topic" && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">주제별 사용 현황</h2>
            {stats.byTopic.length === 0 ? (
              <p className="text-gray-500 text-sm">데이터 없음</p>
            ) : (() => {
              const max = Math.max(...stats.byTopic.map((d) => d.seconds));
              return stats.byTopic.map((d) => (
                <div key={d.topic} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{d.topic}</span>
                    <span>{fmt(d.seconds)} · {d.calls}건</span>
                  </div>
                  <Bar value={d.seconds} max={max} color="bg-emerald-500" />
                </div>
              ));
            })()}
          </div>
        )}

        {/* 사용자별 */}
        {tab === "user" && (
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">사용자</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">레벨</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">상태</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">가입일</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">누적 통화</th>
                </tr>
              </thead>
              <tbody>
                {stats.byUser.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "bg-gray-900" : "bg-gray-800/40"}>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{u.username}</p>
                      <p className="text-gray-500 text-xs">{u.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{LEVEL[u.level] || u.level}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        u.status === "무제한" ? "text-purple-400" :
                        u.status === "멤버십" ? "text-green-400" :
                        u.status.startsWith("체험") ? "text-yellow-400" : "text-red-400"
                      }`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200 font-medium">
                      {u.total_seconds > 0 ? fmt(u.total_seconds) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
