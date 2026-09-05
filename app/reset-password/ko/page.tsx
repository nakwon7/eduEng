"use client";

import { useState } from "react";

export default function ResetPasswordKoPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trimmedContact = contact.trim();
      const res = await fetch("/api/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), name: name.trim(), contact: trimmedContact }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error("Please try again later.");
        throw new Error("Username or name doesn't match our records.");
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zM8 11V7a4 4 0 1 1 8 0v4" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">Forgot password</h1>
          <p className="text-gray-400 text-sm mt-1">We'll help you get back in</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Your request has been received.<br />We'll verify your identity and send you a new password through the contact info you provided.
            </p>
            <a href="/login/ko" className="inline-block text-blue-400 hover:text-blue-300 text-sm">
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your username"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                Your name <span className="text-gray-600">(the nickname you signed up with — not your legal name)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Emily"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Email to reach you</label>
              <input
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
              />
              <p className="text-gray-600 text-xs mt-1">Your sign-up email might not be reachable, so let us know a working email to send your new password to.</p>
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 disabled:bg-none disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30"
            >
              {loading ? "Submitting..." : "Request reset"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          <a href="/login/ko" className="text-blue-400 hover:text-blue-300">
            Back to login
          </a>
        </p>
      </div>
    </main>
  );
}
