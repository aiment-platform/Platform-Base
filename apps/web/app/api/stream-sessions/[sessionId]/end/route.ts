import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/lib/server/auth";
import { setStreamSessionStatus } from "@/app/lib/server/aimentStore";
import { stopSessionRecording } from "@/app/lib/server/sessionRecording";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const actor = await requireSessionUser();
    const { sessionId } = await context.params;
    const session = await setStreamSessionStatus(sessionId, actor, "ended");

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 録画を止めて、ファイルの書き出しを始めさせる（失敗しても終了は成功扱い）
    await stopSessionRecording(sessionId);

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
