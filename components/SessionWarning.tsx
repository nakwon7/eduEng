"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SessionWarningProps {
  onRelogin: () => void;
}

export default function SessionWarning({ onRelogin }: SessionWarningProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRelogin = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem("edueng_session");
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-white text-lg font-bold mb-2">다른 기기에서 로그인됨</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          다른 기기에서 이 계정으로 로그인했습니다.<br />
          에듀잉은 1인 1기기만 지원합니다.<br />
          이 기기에서 계속하려면 다시 로그인하세요.
        </p>
        <button
          onClick={handleRelogin}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-all"
        >
          {loading ? "이동 중..." : "다시 로그인하기"}
        </button>
        <button
          onClick={onRelogin}
          className="mt-3 text-gray-500 text-sm hover:text-gray-400"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
