import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isBotUserAgent, fetchRegionAndHosting } from "@/lib/visitorBot";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function logVisit(ip: string, userAgent: string | null) {
  const admin = supabaseAdmin();

  // UA로 봇이 확정이면 불필요한 외부 API 호출(ipwho.is) 스킵
  const knownBot = isBotUserAgent(userAgent);
  const { region, isHosting } = knownBot ? { region: null, isHosting: false } : await fetchRegionAndHosting(ip);

  // (ip, hour_bucket) 유니크 제약으로 중복을 DB가 원자적으로 막음 — 동시에 여러 요청이
  // 들어와도 "조회 후 삽입" 방식과 달리 레이스 컨디션으로 중복 삽입될 수 없음
  const hourBucket = new Date().toISOString().slice(0, 13); // 예: "2026-08-25T14"
  const { error } = await admin
    .from("visitor_logs")
    .insert({ ip, hour_bucket: hourBucket, user_agent: userAgent, region, is_hosting: isHosting });

  if (error && error.code !== "23505") {
    console.error("[visitor_logs] insert error:", error.message);
  }
}

// 베타 기간: 인증 없이 통과, 방문자만 IP당 1시간에 한 번 기록
// gooster(관리자) 로그인 시 login/page.tsx에서 심는 쿠키 — 관리자 본인 접속은 집계 제외
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const ip = getClientIp(request);
  const isAdmin = request.cookies.get("tc_skip_visit")?.value === "1";
  if (ip !== "unknown" && !isAdmin) {
    event.waitUntil(logVisit(ip, request.headers.get("user-agent")));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif)$).*)",
  ],
};
