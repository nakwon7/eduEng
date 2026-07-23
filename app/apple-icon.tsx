import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "39px",
        background: "#03C75A",
      }}
    >
      {/* TC 이니셜 */}
      <span
        style={{
          color: "white",
          fontSize: 74,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        TC
      </span>

      {/* 음성 파형 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {[10, 18, 28, 18, 35, 22, 35, 18, 28, 18, 10].map((h, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: h,
              borderRadius: 3,
              background: "rgba(255,255,255,0.85)",
            }}
          />
        ))}
      </div>
    </div>,
    { ...size }
  );
}
