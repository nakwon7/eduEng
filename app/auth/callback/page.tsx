"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

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

      if (!profile) {
        router.replace("/signup/google");
        return;
      }

      await establishClientSession(userId);
      router.replace(profile.ko_access ? "/ko" : "/app");
    };
    run();
  }, [router]);

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
