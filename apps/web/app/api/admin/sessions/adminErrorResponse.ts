import { NextResponse } from "next/server";

/** 管理APIの例外をHTTPレスポンスに変換する。 */
export function adminErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
  if (message === "No session user is configured") return NextResponse.json({ error: message }, { status: 401 });
  if (message.startsWith("Invalid transition") || message.includes("currently live")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}
