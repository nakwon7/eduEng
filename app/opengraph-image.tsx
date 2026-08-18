import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 180,
            borderRadius: 40,
            background: "#03C75A",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 76,
              fontWeight: 800,
              fontFamily: "sans-serif",
              letterSpacing: "-2px",
            }}
          >
            TC
          </span>
        </div>

        <span
          style={{
            color: "white",
            fontSize: 64,
            fontWeight: 800,
            fontFamily: "sans-serif",
            marginBottom: 16,
          }}
        >
          튜링콜 - AI 전화영어
        </span>

        <span
          style={{
            color: "#e5e7eb",
            fontSize: 30,
            fontFamily: "sans-serif",
            marginBottom: 36,
          }}
        >
          실수하면 바로 짚어주는 AI 튜터와 매일 영어로 통화 연습
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {[28, 52, 80, 52, 100, 64, 100, 52, 80, 52, 28].map((h, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: h,
                borderRadius: 6,
                background: "#03C75A",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
