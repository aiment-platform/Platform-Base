import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/lib/server/auth";
import { getStreamSessionById } from "@/app/lib/server/aimentStore";
import { ensureSessionRecording } from "@/app/lib/server/sessionRecording";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream-sessions/:sessionId/recording — 配信中なら録画を始める（もう動いていれば何もしない）。
 * 配信者の画面が「配信開始」と「OBS の映像が届いた」ときに呼ぶ。録画の中身は配信者には返さない。
 */
export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const actor = await requireSessionUser();
    const { sessionId } = await context.params;
    const session = await getStreamSessionById(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.hostUserId !== actor.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const result = await ensureSessionRecording(session, new URL(request.url).origin);
    return NextResponse.json({ ok: true, started: result.started, skipped: result.skipped });
  } catch (error) {
    console.error("[recording] ensure failed:", error);
    const message = error instanceof Error ? error.message : "Failed to start recording";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
