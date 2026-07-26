import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { signSessionToken } from "@/lib/auth/jwt";

const SESSION_COOKIE_NAME = "session";

/**
 * POST /api/auth/session
 * Body: { idToken: string }  <-- the Firebase ID token from the client SDK
 *
 * Verifies the Firebase ID token server-side, then mints OUR OWN JWT and
 * stores it in an httpOnly cookie. This JWT (not the Firebase token) is
 * what gets sent to the Python backend and what middleware.ts checks.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await verifyFirebaseIdToken(idToken);

    const sessionToken = await signSessionToken({
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name,
    });

    const response = NextResponse.json({
      user: { uid: decoded.uid, email: decoded.email, name: decoded.name ?? null },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour, keep in sync with JWT_EXPIRES_IN
    });

    return response;
  } catch (err) {
    console.error("Session creation failed:", err);
    return NextResponse.json({ error: "Invalid or expired Firebase token" }, { status: 401 });
  }
}
