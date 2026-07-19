"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  level: string;
  trial_calls: number;
  expires_at: string | null;
  unlimited: boolean;
  blocked: boolean;
  total_seconds: number;
  created_at: string;
  ko_access: boolean;
}

interface AdminPanelProps {
  userId: string;
  sessionToken: string;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function statusLabel(u: User) {
  if (u.unlimited) return { text: "무제한", color: "text-purple-400" };
  if (u.expires_at && new Date(u.expires_at) > new Date()) return { text: "멤버십", color: "text-green-400" };
  if (u.trial_calls > 0) return { text: `체험 ${u.trial_calls}회 남음`, color: "text-yellow-400" };
  return { text: "체험 소진", color: "text-red-400" };
}

export default function AdminPanel({ userId, sessionToken }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<Record<string, { date: string; seconds: number }[]>>({});

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken }),
    });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (targetId: string) => {
    setBusy(targetId + "_approve");
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, days: 30 }),
    });
    await fetchUsers();
    setBusy(null);
  };

  const handleBlock = async (targetId: string, current: boolean) => {
    setBusy(targetId + "_block");
    await fetch("/api/admin/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, blocked: !current }),
    });
    await fetchUsers();
    setBusy(null);
  };

  const handleToggleUnlimited = async (targetId: string, current: boolean) => {
    setBusy(targetId + "_unlimited");
    await fetch("/api/admin/toggle-unlimited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, unlimited: !current }),
    });
    await fetchUsers();
    setBusy(null);
  };

  const handleToggleKo = async (targetId: string, current: boolean) => {
    setBusy(targetId + "_ko");
    await fetch("/api/admin/toggle-ko", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, ko_access: !current }),
    });
    await fetchUsers();
    setBusy(null);
  };

  const handleToggleLogs = async (targetId: string) => {
    if (expandedUserId === targetId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(targetId);
    if (callLogs[targetId]) return;
    const res = await fetch("/api/admin/call-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId }),
    });
    const data = await res.json();
    setCallLogs((prev) => ({ ...prev, [targetId]: data.logs || [] }));
  };

  const handleResetTrial = async (targetId: string) => {
    setBusy(targetId + "_trial");
    await fetch("/api/admin/reset-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId }),
    });
    await fetchUsers();
    setBusy(null);
  };

  return (
    <div className="flex-1 flex flex-col px-2 py-4 overflow-y-auto">
      <h2 className="text-white text-sm font-bold mb-4 text-center">회원 관리</h2>

      <div className="flex gap-2 mb-4">
        <a
          href="/qr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-green-800 hover:bg-green-700 text-green-300 text-xs font-medium rounded-xl text-center"
        >
          🇺🇸 영어판 QR
        </a>
        <a
          href="/qr/ko"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-blue-800 hover:bg-blue-700 text-blue-300 text-xs font-medium rounded-xl text-center"
        >
          🇰🇷 한국어판 QR
        </a>
      </div>

      {loading ? (
        <p className="text-gray-500 text-xs text-center">불러오는 중...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-xs text-center">가입된 회원이 없습니다</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const status = statusLabel(u);
            return (
              <div key={u.id} className="bg-gray-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white text-sm font-medium">{u.username}</p>
                    <p className="text-gray-400 text-xs">{u.name} · {LEVEL_LABEL[u.level] || u.level}</p>
                  </div>
                  <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
                </div>

                {u.expires_at && new Date(u.expires_at) > new Date() && (
                  <p className="text-gray-500 text-xs">
                    만료: {new Date(u.expires_at).toLocaleDateString("ko-KR")}
                  </p>
                )}
                <button
                  onClick={() => handleToggleLogs(u.id)}
                  className="text-gray-500 hover:text-gray-300 text-xs text-left transition-colors"
                >
                  누적 사용: {u.total_seconds > 0 ? formatTime(u.total_seconds) : "없음"} {u.total_seconds > 0 ? (expandedUserId === u.id ? "▲" : "▼") : ""}
                </button>
                {expandedUserId === u.id && (
                  <div className="bg-gray-900 rounded-xl p-2 space-y-1">
                    {!callLogs[u.id] ? (
                      <p className="text-gray-600 text-xs text-center">불러오는 중...</p>
                    ) : callLogs[u.id].length === 0 ? (
                      <p className="text-gray-600 text-xs text-center">기록 없음</p>
                    ) : (
                      callLogs[u.id].map((log) => (
                        <div key={log.date} className="flex justify-between text-xs">
                          <span className="text-gray-500">{log.date}</span>
                          <span className="text-gray-300">{formatTime(log.seconds)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {(() => {
                  const hasActiveMembership = !!u.expires_at && new Date(u.expires_at) > new Date();
                  return (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={!!busy || u.blocked}
                          className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:opacity-50 text-white text-xs rounded-xl transition-all"
                        >
                          {busy === u.id + "_approve" ? "..." : "+30일"}
                        </button>
                        <button
                          onClick={() => handleToggleUnlimited(u.id, u.unlimited)}
                          disabled={!!busy || hasActiveMembership || u.blocked}
                          className={`flex-1 py-1.5 text-white text-xs rounded-xl transition-all disabled:bg-gray-700 disabled:opacity-50 ${
                            u.unlimited ? "bg-purple-700 hover:bg-purple-600" : "bg-gray-600 hover:bg-gray-500"
                          }`}
                        >
                          {busy === u.id + "_unlimited" ? "..." : u.unlimited ? "무제한 해제" : "무제한"}
                        </button>
                        <button
                          onClick={() => handleResetTrial(u.id)}
                          disabled={!!busy || hasActiveMembership || u.blocked}
                          className="flex-1 py-1.5 bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-700 disabled:opacity-50 text-white text-xs rounded-xl transition-all"
                        >
                          {busy === u.id + "_trial" ? "..." : "체험초기화"}
                        </button>
                      </div>
                      <button
                        onClick={() => handleToggleKo(u.id, u.ko_access)}
                        disabled={!!busy || u.blocked}
                        className={`w-full py-1.5 text-white text-xs rounded-xl transition-all disabled:bg-gray-700 disabled:opacity-50 ${
                          u.ko_access ? "bg-blue-700 hover:bg-blue-600" : "bg-gray-600 hover:bg-gray-500"
                        }`}
                      >
                        {busy === u.id + "_ko" ? "..." : u.ko_access ? "한국어판 ON" : "한국어판 OFF"}
                      </button>
                      <button
                        onClick={() => handleBlock(u.id, u.blocked)}
                        disabled={!!busy}
                        className={`w-full py-1.5 text-white text-xs rounded-xl transition-all disabled:opacity-50 ${
                          u.blocked ? "bg-gray-600 hover:bg-gray-500" : "bg-red-800 hover:bg-red-700"
                        }`}
                      >
                        {busy === u.id + "_block" ? "..." : u.blocked ? "차단 해제" : "차단"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
