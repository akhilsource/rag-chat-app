import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "session";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function getSessionToken(): string | null {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function backendUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function backendHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}
