import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
        borderRadius: "96px",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 220,
          fontWeight: 800,
          letterSpacing: "-8px",
          fontFamily: "sans-serif",
          lineHeight: 1,
        }}
      >
        T
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 72,
          fontWeight: 600,
          fontFamily: "sans-serif",
          marginTop: 12,
          letterSpacing: "6px",
        }}
      >
        TuringCall
      </span>
    </div>,
    { ...size }
  );
}
