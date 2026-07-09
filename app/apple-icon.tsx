import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "#16a34a",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "36px",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "-3px",
          fontFamily: "sans-serif",
          lineHeight: 1,
        }}
      >
        E
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 24,
          fontWeight: 600,
          fontFamily: "sans-serif",
          marginTop: 4,
          letterSpacing: "2px",
        }}
      >
        EduEng
      </span>
    </div>,
    { ...size }
  );
}
