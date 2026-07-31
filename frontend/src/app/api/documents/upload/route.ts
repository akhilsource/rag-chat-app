import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { backendHeaders, backendUrl, getSessionToken } from "@/lib/backend-proxy";

export async function POST(request: NextRequest) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const res = await fetch(backendUrl("/documents/upload"), {
    method: "POST",
    headers: backendHeaders(token),
    body: formData,
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
