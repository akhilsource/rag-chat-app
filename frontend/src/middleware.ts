import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";

const PROTECTED_PATHS = ["/chat"];
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  let isAuthenticated = false;
  if (token) {
    try {
      await verifySessionToken(token);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Guard protected routes: bounce unauthenticated users to /login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in? Skip the auth pages and go straight to chat.
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/signup"],
};
