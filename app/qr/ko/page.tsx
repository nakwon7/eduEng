"use client";

import { QRCodeSVG } from "qrcode.react";

const SIGNUP_URL = "https://turingcall.vercel.app/signup/ko";

export default function QRKoPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-white text-2xl font-bold">TuringCall</h1>
          <p className="text-blue-400 text-sm mt-1">AI Korean Tutor</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xl">
          <QRCodeSVG
            value={SIGNUP_URL}
            size={220}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
          />
        </div>

        <div className="space-y-1">
          <p className="text-gray-400 text-sm">Scan to sign up & start learning Korean!</p>
          <p className="text-gray-600 text-xs">{SIGNUP_URL}</p>
        </div>

        <div className="bg-gray-900 rounded-2xl px-6 py-4 space-y-1.5 text-sm text-gray-300 w-full max-w-xs">
          <p>✅ 3 free trial sessions</p>
          <p>✅ No app download needed</p>
          <p>✅ AI tutor available 24/7</p>
        </div>

        <p className="text-gray-600 text-xs">Recommended: Chrome or Samsung Browser</p>
      </div>
    </main>
  );
}
