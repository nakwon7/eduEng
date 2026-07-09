import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "에듀잉",
    short_name: "에듀잉",
    description: "AI 튜터와 함께하는 실시간 전화영어",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
