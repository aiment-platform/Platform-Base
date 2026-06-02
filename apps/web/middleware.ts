import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name must match SESSION_COOKIE in app/lib/server/auth.ts
const SESSION_COOKIE = "aiment_dev_session";

const ADMIN_IDS = new Set(
  (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Middleware is a UX-layer redirect only.
  // Handler and DAL each independently verify admin identity — see CVE-2025-29927.
  if (ADMIN_IDS.size > 0) {
    const userId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!userId || !ADMIN_IDS.has(userId)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
