import { NextRequest, NextResponse } from "next/server";

// 베타 기간: 인증 없이 통과
export function middleware(req: NextRequest) {
  return NextResponse.next();
}
