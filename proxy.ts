import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isBotUserAgent, fetchRegionAndHosting } from "@/lib/visitorBot";

const VISIT_WINDOW_MS = 60 * 60 * 1000; // 1시간

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function logVisit(ip: string, userAgent: string | null) {
  const admin = supabaseAdmin();
  const windowStart = new Date(Date.now() - VISIT_WINDOW_MS).toISOString();

  const { count } = await admin
    .from("visitor_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", windowStart);

  if ((count ?? 0) > 0) return;

  // UA로 봇이 확정이면 불필요한 외부 API 호출(ipwho.is) 스킵
  const knownBot = isBotUserAgent(userAgent);
  const { region, isHosting } = knownBot ? { region: null, isHosting: false } : await fetchRegionAndHosting(ip);

  await admin.from("visitor_logs").insert({ ip, user_agent: userAgent, region, is_hosting: isHosting });
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
