import { NextResponse } from "next/server";
import { listUsers } from "@/app/lib/server/aimentStore";
import { rejectInProduction } from "@/app/lib/server/devOnly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // 全ユーザーの個人情報を返すため開発専用。
  const rejected = rejectInProduction();
  if (rejected) return rejected;

  const users = await listUsers();
  return NextResponse.json({ users });
}
