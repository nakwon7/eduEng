"use client";

import { useEffect, useState } from "react";
import { PLANS, PlanId } from "@/lib/plans";

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
  payment_requested_at: string | null;
  payment_note: string | null;
  payment_count: number;
  plan: PlanId;
  requested_plan: PlanId | null;
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

function statusTint(u: User) {
  if (u.unlimited) return "bg-purple-500/5 border-purple-500/15";
  if (u.expires_at && new Date(u.expires_at) > new Date()) return "bg-green-500/5 border-green-500/15";
  if (u.trial_calls > 0) return "bg-yellow-500/5 border-yellow-500/15";
  return "bg-red-500/5 border-red-500/15";
}

function hasActiveMembership(u: User) {
  return !!u.expires_at && new Date(u.expires_at) > new Date();
}

export default function AdminPanel({ userId, sessionToken }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<Record<string, { date: string; seconds: number }[]>>({});
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, { id: string; days: number; approved_at: string; plan: PlanId }[]>>({});
  const [selectedPlan, setSelectedPlan] = useState<Record<string, PlanId>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [membershipOnly, setMembershipOnly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  const handleApprove = async (targetId: string, days: number, plan: PlanId) => {
    setBusy(targetId + "_approve" + days);
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, days, plan }),
    });
    // 결제이력 캐시를 무효화하고 다시 불러옴 — 안 그러면 승인 전에 이미 펼쳐본 적
    // 있는 유저는 방금 추가된 이력이 빠진 예전 목록이 계속 보임(펼침 상태일 때만
    // 재요청하는 구조라 캐시가 있으면 handleTogglePayments가 재요청을 건너뜀)
    if (paymentHistory[targetId]) await fetchPaymentHistory(targetId);
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

  const fetchPaymentHistory = async (targetId: string) => {
    const res = await fetch("/api/admin/payment-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId }),
    });
    const data = await res.json();
    setPaymentHistory((prev) => ({ ...prev, [targetId]: data.history || [] }));
  };

  const handleTogglePayments = async (targetId: string) => {
    if (expandedPaymentId === targetId) {
      setExpandedPaymentId(null);
      return;
    }
    setExpandedPaymentId(targetId);
    if (paymentHistory[targetId]) return;
    await fetchPaymentHistory(targetId);
  };

  const handleDeletePayment = async (targetId: string, historyId: string) => {
    if (!confirm("이 결제 이력을 삭제할까요? 멤버십 만료일이 남은 이력 기준으로 재계산됩니다.")) return;
    setBusy(historyId + "_delpayment");
    await fetch("/api/admin/payment-history/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, historyId }),
    });
    setPaymentHistory((prev) => ({
      ...prev,
      [targetId]: (prev[targetId] || []).filter((h) => h.id !== historyId),
    }));
    await fetchUsers();
    setBusy(null);
  };

  const handleReject = async (targetId: string) => {
    setBusy(targetId + "_reject");
    await fetch("/api/admin/reject-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, targetId, reason: rejectReason }),
    });
    setRejectingId(null);
    setRejectReason("");
    await fetchUsers();
    setBusy(null);
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

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!u.username.toLowerCase().includes(q) && !u.name.toLowerCase().includes(q)) return false;
    }
    if (membershipOnly && !hasActiveMembership(u)) return false;
    if (selectedDay && u.created_at?.slice(0, 10) !== selectedDay) return false;
    return true;
  });
  const hasFilter = !!(searchQuery || membershipOnly || selectedDay);

  const monthUsers = users.filter((u) => u.created_at?.slice(0, 7) === selectedMonth);
  const dailyBreakdown = Object.entries(
    monthUsers.reduce<Record<string, number>>((acc, u) => {
      const day = u.created_at.slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="flex-1 flex flex-col px-2 py-4 overflow-y-auto">
      <h2 className="text-white text-sm font-bold mb-4 text-center">회원 관리</h2>

      <div className="mb-2">
        <a
          href="/flyer"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-xl text-center"
        >
          🖨️ 전단지 인쇄
        </a>
      </div>

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

      {!loading && users.length > 0 && (
        <div className="mb-3 bg-gray-800 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDay(null); }}
              className="bg-gray-900 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark] shrink-0"
            />
            <button
              onClick={() => setStatsOpen((v) => !v)}
              className="flex-1 flex items-center justify-between text-gray-300 text-xs"
            >
              <span>가입자 {monthUsers.length}명</span>
              <span className="text-gray-500">{statsOpen ? "▲" : "▼"}</span>
            </button>
          </div>
          {statsOpen && (
            <div className="mt-2 pt-2 border-t border-gray-700 space-y-1 max-h-48 overflow-y-auto">
              {dailyBreakdown.length === 0 ? (
                <p className="text-gray-600 text-xs text-center">가입자 없음</p>
              ) : (
                dailyBreakdown.map(([date, count]) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDay((d) => (d === date ? null : date))}
                    className={`w-full flex justify-between text-xs rounded-lg px-2 py-1 transition-all ${
                      selectedDay === date ? "bg-blue-700 text-white" : "hover:bg-gray-700 text-gray-500"
                    }`}
                  >
                    <span className={selectedDay === date ? "text-white" : "text-gray-500"}>{date}</span>
                    <span className={selectedDay === date ? "text-white" : "text-gray-300"}>{count}명</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이디 또는 이름 검색"
              className="flex-1 min-w-0 bg-gray-800 border border-white/5 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
            />
            <button
              onClick={() => setMembershipOnly((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all ${
                membershipOnly ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-300"
              }`}
            >
              멤버십만
            </button>
            {hasFilter && (
              <button
                onClick={() => { setSearchQuery(""); setMembershipOnly(false); setSelectedDay(null); }}
                className="text-gray-500 hover:text-gray-300 text-xs whitespace-nowrap shrink-0"
              >
                초기화
              </button>
            )}
          </div>
          {hasFilter && (
            <p className="text-gray-600 text-xs">
              {selectedDay && <>{selectedDay} 가입자만 · </>}
              {filteredUsers.length}명 표시 중 (전체 {users.length}명)
            </p>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-xs text-center">불러오는 중...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-xs text-center">가입된 회원이 없습니다</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500 text-xs text-center">검색 결과가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const status = statusLabel(u);
            return (
              <div
                key={u.id}
                className={`border rounded-2xl p-4 space-y-2 ${statusTint(u)} ${u.payment_requested_at ? "ring-2 ring-emerald-500" : ""}`}
              >
                {u.payment_requested_at && (
                  <p className="text-emerald-400 text-xs font-medium">
                    💰 입금 확인 요청 · {new Date(u.payment_requested_at).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {u.requested_plan && ` · 희망: ${PLANS[u.requested_plan].label}`}
                  </p>
                )}
                {u.payment_note && (
                  <p className="text-emerald-300/80 text-xs">
                    📝 {u.payment_note}
                  </p>
                )}
                {u.payment_requested_at && (
                  rejectingId === u.id ? (
                    <div className="bg-gray-900 rounded-xl p-2 space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        maxLength={100}
                        placeholder="반려 사유 (비우면 기본 문구로 전송)"
                        className="w-full bg-gray-800 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600"
                      />
                      <p className="text-gray-600 text-xs text-right">{rejectReason.length}/100</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(u.id)}
                          disabled={!!busy}
                          className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs rounded-lg"
                        >
                          {busy === u.id + "_reject" ? "..." : "반려 확정"}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(""); }}
                          className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRejectingId(u.id); setRejectReason(""); }}
                      className="text-red-400 hover:text-red-300 text-xs underline"
                    >
                      반려하기
                    </button>
                  )
                )}
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
                  className="block text-gray-500 hover:text-gray-300 text-xs text-left transition-colors"
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

                <button
                  onClick={() => handleTogglePayments(u.id)}
                  className="block text-gray-500 hover:text-gray-300 text-xs text-left transition-colors"
                >
                  결제 {u.payment_count}회 {u.payment_count > 0 ? (expandedPaymentId === u.id ? "▲" : "▼") : ""}
                </button>
                {expandedPaymentId === u.id && (
                  <div className="bg-gray-900 rounded-xl p-2 space-y-1">
                    {!paymentHistory[u.id] ? (
                      <p className="text-gray-600 text-xs text-center">불러오는 중...</p>
                    ) : paymentHistory[u.id].length === 0 ? (
                      <p className="text-gray-600 text-xs text-center">기록 없음</p>
                    ) : (
                      paymentHistory[u.id].map((h) => (
                        <div key={h.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">
                            {new Date(h.approved_at).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-gray-300">+{h.days}일 ({PLANS[h.plan]?.label ?? h.plan})</span>
                            <button
                              onClick={() => handleDeletePayment(u.id, h.id)}
                              disabled={busy === h.id + "_delpayment"}
                              className="text-red-500 hover:text-red-400 disabled:opacity-50"
                            >
                              삭제
                            </button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {(() => {
                  const activeMembership = hasActiveMembership(u);
                  // 신규 첫 결제이거나, 이미 라이트를 이용 중(만료 전)인 조기결제 케이스에만 라이트 허용
                  const isMidCycleLite = u.plan === "lite" && activeMembership;
                  const eligibleForLite = u.payment_count === 0 || isMidCycleLite;
                  const currentPlan: PlanId =
                    selectedPlan[u.id] ?? (isMidCycleLite || u.requested_plan === "lite" ? "lite" : "standard");
                  const liteSelected = eligibleForLite && currentPlan === "lite";
                  return (
                    <div className="space-y-2 pt-1">
                      {eligibleForLite && (
                        <div className="flex gap-2">
                          {(Object.values(PLANS)).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedPlan((prev) => ({ ...prev, [u.id]: p.id }))}
                              className={`flex-1 py-1 text-xs rounded-lg transition-all ${
                                currentPlan === p.id ? "bg-emerald-700 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-300"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {liteSelected && (
                        <p className="text-gray-500 text-xs">라이트는 7일 단위로만 승인돼요</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(u.id, 7, eligibleForLite ? currentPlan : "standard")}
                          disabled={!!busy || u.blocked}
                          className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:opacity-50 text-white text-xs rounded-xl transition-all"
                        >
                          {busy === u.id + "_approve7" ? "..." : "+7일"}
                        </button>
                        <button
                          onClick={() => handleApprove(u.id, 30, eligibleForLite ? currentPlan : "standard")}
                          disabled={!!busy || u.blocked || liteSelected}
                          className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:opacity-50 text-white text-xs rounded-xl transition-all"
                        >
                          {busy === u.id + "_approve30" ? "..." : "+30일"}
                        </button>
                        <button
                          onClick={() => handleToggleUnlimited(u.id, u.unlimited)}
                          disabled={!!busy || activeMembership || u.blocked}
                          className={`flex-1 py-1.5 text-white text-xs rounded-xl transition-all disabled:bg-gray-700 disabled:opacity-50 ${
                            u.unlimited ? "bg-purple-700 hover:bg-purple-600" : "bg-gray-600 hover:bg-gray-500"
                          }`}
                        >
                          {busy === u.id + "_unlimited" ? "..." : u.unlimited ? "무제한 해제" : "무제한"}
                        </button>
                        <button
                          onClick={() => handleResetTrial(u.id)}
                          disabled={!!busy || activeMembership || u.blocked}
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
