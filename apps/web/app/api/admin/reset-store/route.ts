import { NextResponse } from "next/server";
import { resetStore } from "@/app/lib/server/aimentStore";
import { rejectInProduction } from "@/app/lib/server/devOnly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reset-store
 * KVストアをシードデータでリセットする管理エンドポイント。
 * ADMIN_SECRET環境変数で保護されています。本番(NODE_ENV=production)では常に404。
 */
export async function POST(request: Request) {
  // 全ユーザー・配信枠・予約を削除するため開発専用。
  const rejected = rejectInProduction();
  if (rejected) return rejected;

  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET is not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await resetStore();
  return NextResponse.json({ ok: true, message: "Store reset to seed data" });
}
