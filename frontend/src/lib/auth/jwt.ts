// Server-only JWT helpers for the app's own session cookie.
//
// Flow:
//   1. User signs up / logs in with Firebase on the client.
//   2. Client sends the Firebase ID token to POST /api/auth/session.
//   3. That route verifies the Firebase token, then signs OUR OWN jwt
//      (this file) and sets it as an httpOnly cookie.
//   4. middleware.ts + server components read/verify that cookie to decide
//      whether a request is authenticated.
//   5. The same JWT is forwarded as `Authorization: Bearer <token>` to the
//      Python RAG backend, which verifies it with the same JWT_SECRET.

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";

const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  uid: string;
  email: string;
  name?: string;
}

/** Sign a new session JWT for the given user. */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secretKey);
}

/** Verify a session JWT, returning its payload or throwing if invalid/expired. */
export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as SessionPayload;
}
