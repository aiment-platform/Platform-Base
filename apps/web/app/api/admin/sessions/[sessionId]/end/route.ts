import { NextResponse } from "next/server";
import { requireAdminUser } from "@/app/lib/server/auth";
import { adminEndStreamSession, getStreamSessionById } from "@/app/lib/server/aimentStore";
import { releaseSessionMedia } from "@/app/lib/server/ingressCleanup";
import { adminErrorResponse } from "../../adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/sessions/:sessionId/end — ホストに関係なく配信を終了し、LiveKitのルームとOBS用のIngressも片付ける */
export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    await requireAdminUser();
    const { sessionId } = await context.params;
    const current = await getStreamSessionById(sessionId);
    if (!current) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const session = await adminEndStreamSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    await releaseSessionMedia(current);
    return NextResponse.json({ session });
  } catch (error) {
    return adminErrorResponse(error, "Failed to end session");
  }
}
