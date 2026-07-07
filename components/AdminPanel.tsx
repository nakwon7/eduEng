"use client";

import { useEffect, useState } from "react";

interface PendingUser {
  id: string;
  username: string;
  name: string;
  email: string;
  level: string;
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

export default function AdminPanel({ userId, sessionToken }: AdminPanelProps) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchPending = async () => {
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
    fetchPending();
  }, []);

  const handleApprove = async (targetId: string) => {
    setApproving(targetId);
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, days: 30 }),
    });
    await fetchPending();
    setApproving(null);
  };

  return (
    <div className="flex-1 flex flex-col px-2 py-4">
      <h2 className="text-white text-sm font-bold mb-4 text-center">승인 대기 회원</h2>

      {loading ? (
        <p className="text-gray-500 text-xs text-center">불러오는 중...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-xs text-center">대기 중인 회원이 없습니다</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-gray-800 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{u.username}</p>
                  <p className="text-gray-400 text-xs">{u.name} · {LEVEL_LABEL[u.level] || u.level}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </div>
                <button
                  onClick={() => handleApprove(u.id)}
                  disabled={approving === u.id}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white text-xs rounded-xl transition-all"
                >
                  {approving === u.id ? "승인 중..." : "승인 (30일)"}
                </button>
              </div>
              <p className="text-gray-600 text-xs">
                가입: {new Date(u.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
