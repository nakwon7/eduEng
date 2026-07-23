import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "튜링콜",
    short_name: "튜링콜",
    description: "AI 튜터와 함께하는 실시간 전화영어",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#03C75A",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
