import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/api";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (pathname.startsWith("/api/events")) {
    if (!MUTATION_METHODS.has(request.method) || session) {
      return NextResponse.next();
    }

    return errorResponse("Authentication required", 401);
  }

  if (pathname.startsWith("/api/uploads")) {
    if (!session) {
      return errorResponse("Authentication required", 401);
    }

    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return session
      ? NextResponse.redirect(new URL("/admin/dashboard", request.url))
      : NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/events/:path*", "/api/uploads/:path*"],
};
