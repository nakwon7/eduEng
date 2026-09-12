"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { establishClientSession } from "@/lib/session";

export default function OAuthSignupCompleteKoPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login/ko");
        return;
      }
      setEmail(session.user.email || "");
      setName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");
      setChecking(false);
    };
    check();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy");
      setTermsHighlight(true);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired. Please log in again.");

      const res = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accessToken: session.access_token, lang: "ko" }),
      });
      const result = await res.json();

      if (!res.ok && result.error !== "already_onboarded") {
        if (result.error === "rate_limited") {
          throw new Error("Too many attempts. Please try again later");
        }
        throw new Error(result.error || "Sign up failed");
      }

      // signup/complete/page.tsx와 동일한 이유 — UserSetup.tsx가 이 플래그를 공용으로 읽음
      localStorage.setItem("tc_level_default", "1");

      await establishClientSession(session.user.id);
      router.replace("/ko");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">Almost there</h1>
          <p className="text-gray-400 text-xs mt-1">Just pick a nickname to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-emerald-400/70 text-xs mb-1 block">Email</label>
            <div className="w-full bg-gray-800/50 border border-white/5 text-gray-400 rounded-xl px-4 py-3 text-sm">
              {email || "No email on file"}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-emerald-400/70 text-xs">
                Nickname <span className="text-gray-400">(your AI tutor will call you this)</span>
              </label>
              <span className="text-gray-400 text-xs">{name.length}/20</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={20}
              autoFocus
              placeholder="e.g. Emily"
              className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label
            className={`flex items-start gap-2 cursor-pointer px-2 py-2 -mx-2 rounded-lg border transition-colors ${
              termsHighlight ? "border-red-500/60 bg-red-500/5" : "border-transparent"
            }`}
          >
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => {
                setAgreedTerms(e.target.checked);
                if (e.target.checked) setTermsHighlight(false);
              }}
              className="mt-0.5 w-4 h-4 accent-blue-500 shrink-0"
            />
            <span className="text-gray-400 text-xs leading-relaxed">
              I agree to the{" "}
              <a href="/terms/en" target="_blank" className="text-blue-400 underline hover:text-blue-300">
                Terms of Service & Privacy Policy
              </a>{" "}
              (required)
            </span>
          </label>

          {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 disabled:bg-none disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30"
          >
            {loading ? "Signing up..." : "Get started"}
          </button>
        </form>
      </div>
    </main>
  );
}
