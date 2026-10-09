import { NextResponse } from "next/server";
import type { StreamSessionStatus } from "@/app/lib/apiTypes";
import { requireAdminUser } from "@/app/lib/server/auth";
import { listStreamSessions } from "@/app/lib/server/aimentStore";
import { adminErrorResponse } from "./adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: StreamSessionStatus[] = ["prelive", "live", "ended"];

/** GET /api/admin/sessions?status=live — 全ホストの配信枠一覧(管理者のみ) */
export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const status = new URL(request.url).searchParams.get("status");
    const statuses = STATUSES.filter((s) => status?.split(",").includes(s));
    const sessions = await listStreamSessions(statuses.length > 0 ? statuses : undefined);
    return NextResponse.json({ sessions });
  } catch (error) {
    return adminErrorResponse(error, "Failed to list sessions");
  }
}
