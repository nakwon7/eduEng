"use client";

import { useState } from "react";

interface ChangePasswordProps {
  userId: string;
  sessionToken: string;
  lang?: "ko" | "en";
}

const TEXT = {
  ko: {
    title: "비밀번호 변경",
    newPassword: "새 비밀번호",
    confirmPassword: "새 비밀번호 확인",
    placeholder: "6자 이상",
    submit: "변경하기",
    submitting: "변경 중...",
    mismatch: "비밀번호가 서로 일치하지 않습니다",
    tooShort: "비밀번호는 6자 이상이어야 합니다",
    success: "비밀번호가 변경되었습니다",
    fail: "비밀번호 변경에 실패했습니다",
  },
  en: {
    title: "Change Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    placeholder: "At least 6 characters",
    submit: "Change",
    submitting: "Changing...",
    mismatch: "Passwords do not match",
    tooShort: "Password must be at least 6 characters",
    success: "Password changed",
    fail: "Failed to change password",
  },
};

export default function ChangePassword({ userId, sessionToken, lang = "ko" }: ChangePasswordProps) {
  const t = TEXT[lang];
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: t.tooShort });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t.mismatch });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, newPassword }),
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage({ type: "success", text: t.success });
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: t.fail });
    }
  };

  return (
    <div className="mt-4 bg-gray-900 rounded-xl p-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between">
        <p className="text-emerald-400/70 text-xs font-medium">{t.title}</p>
        <span className={`text-gray-400 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 text-xs">{t.newPassword}</label>
              <span className="text-gray-400 text-xs">{newPassword.length}/20</span>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              maxLength={20}
              placeholder={t.placeholder}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">{t.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              maxLength={20}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {message && (
            <p className={`text-xs ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !newPassword || !confirmPassword}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </div>
      )}
    </div>
  );
}
