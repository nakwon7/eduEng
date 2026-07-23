"use client";

import { QRCodeSVG } from "qrcode.react";

const APP_URL = "https://turingcall-ten.vercel.app?openExternalBrowser=1";

export default function FlyerPage() {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        body { background: white; }
      `}</style>

      {/* 인쇄 버튼 */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-xl shadow hover:bg-gray-700"
        >
          🖨️ 인쇄하기
        </button>
      </div>

      {/* A4 전단지 본문 */}
      <div
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          background: "white",
          fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14mm 16mm",
          boxSizing: "border-box",
          color: "#111827",
        }}
      >
        {/* 상단 태그라인 */}
        <p style={{ fontSize: "11pt", color: "#16a34a", fontWeight: 600, letterSpacing: "2px", marginBottom: "4mm" }}>
          AI 전화영어 · TuringCall
        </p>

        {/* 메인 헤드라인 */}
        <h1 style={{ fontSize: "28pt", fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: "5mm", color: "#111827" }}>
          원어민 AI와 매일<br />영어로 전화하세요
        </h1>

        <p style={{ fontSize: "12pt", color: "#6b7280", textAlign: "center", marginBottom: "10mm", lineHeight: 1.6 }}>
          스마트폰 하나로 언제 어디서나<br />
          AI 튜터 Alex · Rachel과 실전 영어 대화
        </p>

        {/* 구분선 */}
        <div style={{ width: "40mm", height: "2px", background: "#16a34a", marginBottom: "10mm", borderRadius: "2px" }} />

        {/* QR 코드 */}
        <div style={{
          background: "white",
          border: "3px solid #16a34a",
          borderRadius: "16px",
          padding: "8mm",
          marginBottom: "6mm",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        }}>
          <QRCodeSVG
            value={APP_URL}
            size={180}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
          />
        </div>

        <p style={{ fontSize: "11pt", fontWeight: 700, color: "#111827", marginBottom: "2mm" }}>
          📱 QR코드를 찍어보세요
        </p>
        <p style={{ fontSize: "9pt", color: "#9ca3af", marginBottom: "10mm" }}>
          앱 설치 없이 바로 시작 · Chrome / Safari 권장
        </p>

        {/* 구분선 */}
        <div style={{ width: "100%", height: "1px", background: "#e5e7eb", marginBottom: "8mm" }} />

        {/* 특징 3가지 */}
        <div style={{ display: "flex", gap: "4mm", width: "100%", marginBottom: "10mm" }}>
          {[
            { icon: "📞", title: "실시간 AI 전화영어", desc: "실제 전화 통화처럼 AI 튜터와 대화" },
            { icon: "🎙️", title: "음성 인식 & 교정", desc: "말하면 바로 인식, 문법 교정 제공" },
            { icon: "📚", title: "다양한 주제", desc: "일상·비즈니스·여행 등 상황별 대화" },
          ].map((f) => (
            <div key={f.title} style={{
              flex: 1,
              background: "#f9fafb",
              borderRadius: "10px",
              padding: "5mm 4mm",
              textAlign: "center",
              border: "1px solid #e5e7eb",
            }}>
              <div style={{ fontSize: "22pt", marginBottom: "2mm" }}>{f.icon}</div>
              <p style={{ fontSize: "9pt", fontWeight: 700, color: "#111827", marginBottom: "1mm" }}>{f.title}</p>
              <p style={{ fontSize: "8pt", color: "#6b7280", lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 가격 박스 */}
        <div style={{
          width: "100%",
          background: "#f0fdf4",
          border: "2px solid #16a34a",
          borderRadius: "12px",
          padding: "6mm 8mm",
          marginBottom: "8mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: "10pt", color: "#16a34a", fontWeight: 700, marginBottom: "1mm" }}>베타 특가</p>
            <p style={{ fontSize: "9pt", color: "#374151" }}>✅ 가입 즉시 무료 체험 2회 (회당 5분)</p>
            <p style={{ fontSize: "9pt", color: "#374151" }}>✅ 설치 없이 바로 사용 가능</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "22pt", fontWeight: 800, color: "#111827", lineHeight: 1 }}>9,900원</p>
            <p style={{ fontSize: "9pt", color: "#6b7280" }}>/ 월 · 매월 900분 제공</p>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ width: "100%", height: "1px", background: "#e5e7eb", marginBottom: "6mm" }} />

        {/* 하단 푸터 */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "8pt", color: "#d1d5db" }}>
            turingcall-ten.vercel.app
          </p>
        </div>
      </div>
    </>
  );
}
