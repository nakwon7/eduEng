import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/pending"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // API 라우트는 자체 검증
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Supabase 세션 확인
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = req.cookies.get("sb-access-token")?.value;
  if (!authHeader) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
