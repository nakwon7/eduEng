import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "112px",
        background: "linear-gradient(135deg, #16a34a 0%, #0ea5e9 100%)",
      }}
    >
      {/* TC 이니셜 */}
      <span
        style={{
          color: "white",
          fontSize: 210,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-6px",
          lineHeight: 1,
          marginBottom: 24,
        }}
      >
        TC
      </span>

      {/* 음성 파형 */}
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
              width: 14,
              height: h,
              borderRadius: 8,
              background: "rgba(255,255,255,0.85)",
            }}
          />
        ))}
      </div>
    </div>,
    { ...size }
  );
}
