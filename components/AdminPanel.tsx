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
  created_at: string;
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

  return (
    <div className="flex-1 flex flex-col px-2 py-4 overflow-y-auto">
      <h2 className="text-white text-sm font-bold mb-4 text-center">회원 관리</h2>

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

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={busy === u.id + "_approve"}
                    className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white text-xs rounded-xl transition-all"
                  >
                    {busy === u.id + "_approve" ? "처리 중..." : "+30일"}
                  </button>
                  <button
                    onClick={() => handleToggleUnlimited(u.id, u.unlimited)}
                    disabled={busy === u.id + "_unlimited"}
                    className={`flex-1 py-1.5 text-white text-xs rounded-xl transition-all disabled:bg-gray-700 ${
                      u.unlimited ? "bg-purple-700 hover:bg-purple-600" : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  >
                    {busy === u.id + "_unlimited" ? "처리 중..." : u.unlimited ? "무제한 해제" : "무제한"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
