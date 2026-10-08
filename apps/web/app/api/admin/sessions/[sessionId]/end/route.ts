import { NextResponse } from "next/server";
import { requireAdminUser } from "@/app/lib/server/auth";
import { adminEndStreamSession } from "@/app/lib/server/aimentStore";
import { adminErrorResponse } from "../../adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/sessions/:sessionId/end — ホストに関係なく配信を終了する */
export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    await requireAdminUser();
    const { sessionId } = await context.params;
    const session = await adminEndStreamSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json({ session });
  } catch (error) {
    return adminErrorResponse(error, "Failed to end session");
  }
}
