import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendHeaders, backendUrl, getSessionToken } from "@/lib/backend-proxy";

export async function POST(request: NextRequest) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const res = await fetch(backendUrl("/chat/sessions"), {
    method: "POST",
    headers: {
      ...backendHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function GET() {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(backendUrl("/chat/sessions"), {
    headers: backendHeaders(token),
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
