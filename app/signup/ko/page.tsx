"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isDisposableEmail } from "@/lib/disposableEmailDomains";

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Basic words, simple sentences" },
  { id: "intermediate", label: "Intermediate", desc: "Daily conversations, expanding vocabulary" },
  { id: "advanced", label: "Advanced", desc: "Fluent conversation, nuance & idioms" },
] as const;

const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]{1,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupKoPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem("turingcall_session")) {
        router.replace("/ko");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  const [step, setStep] = useState<"form" | "done">("form");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const usernameError = username && !USERNAME_REGEX.test(username)
    ? "Must start with a letter, 2–20 alphanumeric characters"
    : "";
  const emailError = email && !EMAIL_REGEX.test(email)
    ? "Please enter a valid email address"
    : email && isDisposableEmail(email)
    ? "Disposable/temporary email addresses are not allowed"
    : "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || emailError || !agreedTerms) return;
    setError("");
    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      if (existing) throw new Error("This username is already taken");

      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const userId = data.user?.id;
      if (!userId) throw new Error("Sign up failed");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
        username,
        name,
        level,
        approved: true,
        ko_access: true,
        session_token: null,
      });
      if (profileError) throw profileError;

      await supabase.auth.signOut();
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading...</p>
      </main>
    );
  }

  if (step === "done") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-white text-lg font-bold mb-2">You&apos;re all set!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your account is ready. Log in to start your free trial — 2 sessions included!
          </p>
          <a href="/login/ko" className="mt-6 inline-block text-blue-400 hover:text-blue-300 text-sm">
            Go to login →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🇰🇷
          </div>
          <h1 className="text-white text-xl font-bold">Learn Korean with AI</h1>
          <p className="text-gray-400 text-xs mt-1">2 free trial sessions included</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Letters and numbers, 2–20 characters"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">
              Your name <span className="text-gray-600">(your AI tutor will call you this)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Emily"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-600 text-xs mt-1">Used for things like password reset — please use a real email you can access</p>
            {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Korean level</label>
            <div className="space-y-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`w-full px-4 py-2 rounded-xl text-left transition-all ${
                    level === l.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  <span className="font-medium text-sm">{l.label}</span>
                  <span className="text-xs opacity-70 ml-2">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-500 shrink-0"
            />
            <span className="text-gray-400 text-xs leading-relaxed">
              I agree to the{" "}
              <a href="/terms/en" target="_blank" className="text-blue-400 underline hover:text-blue-300">
                Terms of Service & Privacy Policy
              </a>
            </span>
          </label>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !!usernameError || !!emailError || !agreedTerms}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all"
          >
            {loading ? "Creating account..." : "Sign up for free"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{" "}
          <a href="/login/ko" className="text-blue-400 hover:text-blue-300">Log in</a>
        </p>
      </div>
    </main>
  );
}
