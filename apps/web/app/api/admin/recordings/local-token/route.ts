import { NextResponse } from "next/server";
import { createRecorderToken } from "@repo/livekit";
import { requireAdminUser } from "@/app/lib/server/auth";
import { getStreamSessionById } from "@/app/lib/server/aimentStore";
import { adminErrorResponse } from "../../sessions/adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/recordings/local-token — 管理者のブラウザで録画するための鍵（トークン）。
 * 見えない参加者（hidden）として入るので、配信者の参加者一覧や視聴者数には出ない。
 * identity は毎回別にする（同じ管理者が視聴者として入っていても、追い出し合わないように）。
 */
export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const { sessionId } = (await request.json()) as { sessionId?: string };
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await getStreamSessionById(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== "live") return NextResponse.json({ error: "Broadcast is not live" }, { status: 409 });

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
    }

    const token = await createRecorderToken({
      apiKey,
      apiSecret,
      roomName: sessionId,
      userId: `recorder-${admin.id}-${crypto.randomUUID().slice(0, 8)}`,
      userName: "recorder",
    });
    return NextResponse.json({ token, livekitUrl });
  } catch (error) {
    return adminErrorResponse(error, "Failed to create recorder token");
  }
}
