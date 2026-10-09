import { NextResponse } from "next/server";

/**
 * 開発・E2E専用のエンドポイントを本番で無効化するためのガード。
 * 本番(next build/start, Vercel)では NODE_ENV=production になるため 404 を返す。
 * ルートの存在自体を隠すため 403 ではなく 404 にしている。
 */
export function rejectInProduction(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}
