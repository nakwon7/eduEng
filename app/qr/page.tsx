"use client";

import { QRCodeSVG } from "qrcode.react";

const APP_URL = "https://turingcall-ten.vercel.app?openExternalBrowser=1";

export default function QRPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-white text-2xl font-bold">튜링콜</h1>
          <p className="text-green-400 text-sm mt-1">AI 전화영어</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xl">
          <QRCodeSVG
            value={APP_URL}
            size={220}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
          />
        </div>

        <div className="space-y-1">
          <p className="text-gray-400 text-sm">QR코드를 스캔하면 바로 시작!</p>
          <p className="text-gray-600 text-xs">{APP_URL}</p>
        </div>

        <div className="bg-gray-900 rounded-2xl px-6 py-4 space-y-1.5 text-sm text-gray-300 w-full max-w-xs">
          <p>✅ 무료 체험 5회 제공</p>
          <p>✅ 설치 없이 바로 사용</p>
          <p>✅ AI 튜터 Alex · Rachel</p>
        </div>

        <p className="text-gray-600 text-xs">월 9,900원 · Chrome / Samsung 브라우저 권장</p>
      </div>
    </main>
  );
}
