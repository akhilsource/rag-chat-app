import { NextResponse } from "next/server";
import { backendHeaders, backendUrl, getSessionToken } from "@/lib/backend-proxy";

export async function GET() {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(backendUrl("/documents/list"), {
    headers: backendHeaders(token),
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
