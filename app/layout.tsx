import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import KakaoExternalRedirect from "@/components/KakaoExternalRedirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://turingcall.cloud"),
  title: "튜링콜 - AI 전화영어",
  description: "실수하면 바로 짚어주는 AI 튜터와 매일 영어로 통화 연습",
  appleWebApp: {
    title: "튜링콜",
  },
  openGraph: {
    title: "튜링콜 - AI 전화영어",
    description: "실수하면 바로 짚어주는 AI 튜터와 매일 영어로 통화 연습",
    url: "https://turingcall.cloud",
    siteName: "튜링콜",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <KakaoExternalRedirect />
        {children}
      </body>
    </html>
  );
}
