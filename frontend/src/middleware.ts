import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";

const PROTECTED_PATHS = ["/chat"];
const AUTH_PATHS = ["/login", "/signup"];

function isPathMatch(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  const isProtected = PROTECTED_PATHS.some((path) => isPathMatch(pathname, path));
  const isAuthPage = AUTH_PATHS.some((path) => isPathMatch(pathname, path));

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
