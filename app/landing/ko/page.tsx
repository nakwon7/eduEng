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
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-blue-900/40">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-11 h-11">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            <path d="M9.5 12.2c.6-.1 1.1.4 1.9.4.9 0 1.5-.7 2.3-.7.6 0 1 .2 1.5.5" strokeWidth="1.3" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">TuringCall</h1>
        <p className="text-blue-400 text-lg font-medium mb-4">AI Korean Tutor</p>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          Have real Korean conversations with AI tutors MinJun & Jia.<br />
          Practice anytime, anywhere — right from your phone.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium">
            📞 Real phone-style calls
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-medium">
            💡 Real-time grammar tips
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-10 max-w-sm mx-auto space-y-3">
        {[
          {
            icon: (
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.95.36 1.87.7 2.75a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.33-1.27a2 2 0 0 1 2.11-.45c.88.34 1.8.57 2.75.7A2 2 0 0 1 22 16.92z" />
            ),
            accent: "bg-blue-500/15 text-blue-400",
            cardTint: "bg-blue-500/5 border-blue-500/15",
            title: "AI Phone-style Conversations",
            desc: "Talk with AI tutor MinJun or Jia just like a real phone call",
          },
          {
            icon: (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            ),
            accent: "bg-violet-500/15 text-violet-400",
            cardTint: "bg-violet-500/5 border-violet-500/15",
            title: "Voice Recognition",
            desc: "Speak naturally — your voice is recognized in real time",
          },
          {
            icon: (
              <>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </>
            ),
            accent: "bg-emerald-500/15 text-emerald-400",
            cardTint: "bg-emerald-500/5 border-emerald-500/15",
            title: "Grammar Correction",
            desc: "Get gentle corrections so you improve with every session",
          },
          {
            icon: (
              <>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </>
            ),
            accent: "bg-amber-500/15 text-amber-400",
            cardTint: "bg-amber-500/5 border-amber-500/15",
            title: "Everyday Topics",
            desc: "Greetings, daily life, food, K-drama, shopping & more",
          },
        ].map((f) => (
          <div key={f.title} className={`flex items-start gap-4 border rounded-2xl p-4 ${f.cardTint}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.accent}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                {f.icon}
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{f.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="px-6 pb-10 max-w-sm mx-auto">
        <div className="bg-blue-500/5 rounded-2xl p-6 text-center border border-blue-500/40">
          <p className="text-blue-400 text-xs font-medium mb-1">Launch Pricing</p>
          <p className="text-4xl font-bold mb-1">$3</p>
          <p className="text-gray-400 text-sm mb-4">/ week · unlimited during subscription</p>
          <div className="bg-gray-900/60 rounded-xl p-3 text-xs text-gray-300 text-left space-y-1">
            <p className="text-blue-400 font-medium mb-2">Free trial included</p>
            <p>✅ 2 free sessions upon sign-up (5 min each)</p>
            <p>✅ Unlimited calls during your subscription week</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-16 max-w-sm mx-auto space-y-3">
        <a
          href="/signup/ko"
          className="block w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-2xl font-semibold text-lg text-center transition-all active:scale-95 shadow-lg shadow-blue-900/40"
        >
          Start for free
        </a>
        <a
          href="/login/ko"
          className="block w-full py-3 bg-gray-800 border border-white/5 hover:bg-gray-700 text-gray-300 rounded-2xl font-medium text-sm text-center transition-all"
        >
          Log in
        </a>

        {/* Install as app */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
          <p className="text-white text-xs font-semibold">📲 Install as an app (free · no app store needed)</p>
          <p>🍎 <span className="text-gray-300">iPhone</span> — Open in Safari → Share (□↑) → Add to Home Screen</p>
          <p>🤖 <span className="text-gray-300">Android</span> — Open in Chrome → Menu (⋮) → Add to Home Screen</p>
          <p>💻 <span className="text-gray-300">PC / Other browsers</span> — Click the install (⊕) button on the right side of the address bar</p>
        </div>
      </div>

      <div className="text-center pb-8 space-y-3">
        <a
          href="https://www.paypal.com/ncp/payment/DC7LDXNCBE4NY"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-900/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect x="1" y="4" width="22" height="16" rx="2.5" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Pay with PayPal — $3/week
        </a>
        <a
          href="https://open.kakao.com/o/sPanl0Ci"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-medium rounded-xl transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Contact us on KakaoTalk
        </a>
        <p className="text-gray-600 text-xs">TuringCall v1.0 · Chrome / Samsung Browser recommended</p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-900 px-6 py-6 text-center space-y-1.5">
        <p className="text-gray-700 text-xs">SongLab | Business Reg. No.: 857-28-01961</p>
        <a href="/terms/en" className="text-gray-600 text-xs hover:text-gray-400 underline">Terms of Service · Privacy Policy</a>
      </div>
    </main>
  );
}
