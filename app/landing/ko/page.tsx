"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LandingKoPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem("turingcall_session")) {
        router.replace("/ko");
      }
    };
    check();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-10 text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-5xl mb-5 shadow-lg">
          🇰🇷
        </div>
        <h1 className="text-3xl font-bold mb-2">TuringCall</h1>
        <p className="text-blue-400 text-lg font-medium mb-4">AI Korean Tutor</p>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          Have real Korean conversations with AI tutors MinJun & Jia.<br />
          Practice anytime, anywhere — right from your phone.
        </p>
      </div>

      {/* Features */}
      <div className="px-6 pb-10 max-w-sm mx-auto space-y-3">
        {[
          { icon: "📞", title: "AI Phone-style Conversations", desc: "Talk with AI tutor MinJun or Jia just like a real phone call" },
          { icon: "🎙️", title: "Voice Recognition", desc: "Speak naturally — your voice is recognized in real time" },
          { icon: "✍️", title: "Grammar Correction", desc: "Get gentle corrections so you improve with every session" },
          { icon: "📚", title: "Everyday Topics", desc: "Greetings, daily life, food, K-drama, shopping & more" },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-4 bg-gray-900 rounded-2xl p-4">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="text-white text-sm font-semibold">{f.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="px-6 pb-10 max-w-sm mx-auto">
        <div className="bg-gray-900 rounded-2xl p-6 text-center border border-blue-600">
          <p className="text-blue-400 text-xs font-medium mb-1">Beta Pricing</p>
          <p className="text-4xl font-bold mb-1">$3</p>
          <p className="text-gray-400 text-sm mb-4">/ week · unlimited during subscription</p>
          <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 text-left space-y-1">
            <p className="text-blue-400 font-medium mb-2">Free trial included</p>
            <p>✅ 5 free sessions upon sign-up (10 min each)</p>
            <p>✅ Unlimited calls during your subscription week</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-16 max-w-sm mx-auto space-y-3">
        <a
          href="/signup/ko"
          className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-lg text-center transition-all active:scale-95 shadow-lg"
        >
          Start for free
        </a>
        <a
          href="/login"
          className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-medium text-sm text-center transition-all"
        >
          Log in
        </a>

        {/* Install as app */}
        <div className="bg-gray-900 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
          <p className="text-white text-xs font-semibold">📲 Install as an app (free · no app store needed)</p>
          <p>🍎 <span className="text-gray-300">iPhone</span> — Open in Safari → Share (□↑) → Add to Home Screen</p>
          <p>🤖 <span className="text-gray-300">Android</span> — Open in Chrome → Menu (⋮) → Add to Home Screen</p>
          <p>💻 <span className="text-gray-300">PC / Other browsers</span> — Click the install (⊕) button on the right side of the address bar</p>
        </div>
      </div>

      <div className="text-center pb-8 space-y-3">
        <a
          href="https://open.kakao.com/o/sPanl0Ci"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-medium rounded-xl transition-all"
        >
          💬 Contact us on KakaoTalk
        </a>
        <p className="text-gray-600 text-xs">TuringCall Beta v0.1 · Chrome / Samsung Browser recommended</p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-900 px-6 py-6 text-center space-y-1.5">
        <p className="text-gray-700 text-xs">SongLab | Business Reg. No.: 857-28-01961</p>
        <a href="/terms/en" className="text-gray-600 text-xs hover:text-gray-400 underline">Terms of Service · Privacy Policy</a>
      </div>
    </main>
  );
}
