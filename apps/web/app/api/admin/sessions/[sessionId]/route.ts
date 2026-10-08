import { NextResponse } from "next/server";
import { requireAdminUser } from "@/app/lib/server/auth";
import { adminDeleteStreamSession } from "@/app/lib/server/aimentStore";
import { adminErrorResponse } from "../adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/admin/sessions/:sessionId — 配信枠を削除し、予約をキャンセルする(配信中は不可。先に終了する) */
export async function DELETE(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    await requireAdminUser();
    const { sessionId } = await context.params;
    const result = await adminDeleteStreamSession(sessionId);
    if (!result) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error, "Failed to delete session");
  }
}
