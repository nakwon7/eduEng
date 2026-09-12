"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  // /login/ko, /signup/ko에서 온(lang=ko) 사람이 구글 계정 이메일이 기존 영어판 계정과
  // 겹쳐서(Supabase 자동 이메일 연동) ko_access=false인 그 계정으로 로그인돼버리는 경우 —
  // 조용히 /app으로 보내면 "왜 한국어판이 아니지" 혼란스러우니 안내 후 직접 넘어가게 함
  const [crossAppNotice, setCrossAppNotice] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(true);
        return;
      }

      const userId = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, ko_access")
        .eq("id", userId)
        .single();

      const lang = new URLSearchParams(window.location.search).get("lang");

      if (!profile) {
        // /signup/ko에서 시작한 구글 가입은 ?lang=ko로 표시해서, 신규 프로필 온보딩도
        // 한국어판(외국인) 전용 화면(/signup/complete/ko)으로 보낸다
        router.replace(lang === "ko" ? "/signup/complete/ko" : "/signup/complete");
        return;
      }

      if (lang === "ko" && !profile.ko_access) {
        setPendingUserId(userId);
        setCrossAppNotice(true);
        return;
      }

      try {
        await establishClientSession(userId);
      } catch {
        setError(true);
        return;
      }
      router.replace(profile.ko_access ? "/ko" : "/app");
    };
    run();
  }, [router]);

  const handleContinueToApp = async () => {
    if (!pendingUserId) return;
    try {
      await establishClientSession(pendingUserId);
    } catch {
      setError(true);
      return;
    }
    router.replace("/app");
  };

  if (crossAppNotice) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8 text-center">
          <p className="text-white text-sm mb-2">This Google account is already linked</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-6">
            You already have an account on our English-learning app (Alex/Rachel) with this email,
            so you&apos;ll be signed into that account instead of the Korean-learning app.
          </p>
          <button
            onClick={handleContinueToApp}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-gray-300 text-sm mb-4">로그인에 실패했습니다.</p>
            <a href="/login" className="text-green-400 hover:text-green-300 text-sm">
              로그인 화면으로 돌아가기
            </a>
          </>
        ) : (
          <p className="text-gray-400 text-sm">로그인 처리 중...</p>
        )}
      </div>
    </main>
  );
}
