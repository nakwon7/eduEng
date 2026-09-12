"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  // 이메일이 겹쳐서(Supabase 자동 이메일 연동) 시작한 쪽과 다른 앱 계정으로 로그인돼버리는
  // 경우 — 조용히 넘기면 "왜 다른 화면이지" 혼란스러우니 안내 후 직접 넘어가게 함.
  // "to-app": /login/ko·/signup/ko(lang=ko)에서 왔는데 영어판 계정(ko_access=false)으로 귀결
  // "to-ko": /login·/signup(lang 없음)에서 왔는데 한국어판 계정(ko_access=true)으로 귀결
  const [crossAppNotice, setCrossAppNotice] = useState<"to-app" | "to-ko" | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

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

      // ?lang=ko 같은 쿼리스트링을 redirectTo에 붙이면 Supabase Redirect URLs
      // 허용목록과 정확히 일치하지 않아 Site URL로 조용히 폴백되며 URL에
      // #access_token=...이 노출되는 버그가 있었음(2026-09 발견) — localStorage로 전달
      const lang = localStorage.getItem("tc_oauth_lang");
      localStorage.removeItem("tc_oauth_lang");

      if (!profile) {
        // /signup/ko에서 시작한 구글 가입은 ?lang=ko로 표시해서, 신규 프로필 온보딩도
        // 한국어판(외국인) 전용 화면(/signup/complete/ko)으로 보낸다
        router.replace(lang === "ko" ? "/signup/complete/ko" : "/signup/complete");
        return;
      }

      if (lang === "ko" && !profile.ko_access) {
        setPendingUserId(userId);
        setCrossAppNotice("to-app");
        return;
      }
      if (lang !== "ko" && profile.ko_access) {
        setPendingUserId(userId);
        setCrossAppNotice("to-ko");
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

  const handleContinueCrossApp = async () => {
    if (!pendingUserId || !crossAppNotice) return;
    setContinuing(true);
    try {
      await establishClientSession(pendingUserId);
    } catch {
      // crossAppNotice가 계속 true라 에러 화면 분기가 안 그려지던 버그가 있었음(2026-09
      // 발견) — 안내 화면은 내려두고 에러 화면으로 넘어가게 함
      setCrossAppNotice(null);
      setError(true);
      return;
    }
    router.replace(crossAppNotice === "to-app" ? "/app" : "/ko");
  };

  if (crossAppNotice === "to-app") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8 text-center">
          <p className="text-white text-sm mb-2">This account is already linked</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-6">
            You already have an account on our English-learning app (Alex/Rachel) with this email,
            so you&apos;ll be signed into that account instead of the Korean-learning app.
          </p>
          <button
            onClick={handleContinueCrossApp}
            disabled={continuing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 disabled:opacity-70 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30"
          >
            {continuing ? "Continuing..." : "Continue"}
          </button>
        </div>
      </main>
    );
  }

  if (crossAppNotice === "to-ko") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8 text-center">
          <p className="text-white text-sm mb-2">이미 연결된 계정이에요</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-6">
            이 이메일로 이미 한국어 학습 앱(외국인 대상) 계정이 있어서, 영어판이 아니라
            해당 계정으로 로그인됩니다.
          </p>
          <button
            onClick={handleContinueCrossApp}
            disabled={continuing}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-70 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-900/30"
          >
            {continuing ? "이동 중..." : "계속하기"}
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
