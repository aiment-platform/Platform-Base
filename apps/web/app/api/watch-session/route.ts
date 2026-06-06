import { NextResponse } from "next/server";
import { resolveSessionUser } from "@/app/lib/server/auth";
import { startWatchSession, endWatchSession } from "@/app/lib/server/watchTimeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StartBody = { action: "start"; hostUserId: string; streamSessionId: string };
type EndBody = { action: "end"; watchSessionId: string };

/**
 * POST /api/watch-session
 * { action: "start", hostUserId, streamSessionId } → { watchSessionId }
 * { action: "end",   watchSessionId }              → 204
 *
 * "end" は navigator.sendBeacon からも呼ばれるため POST で統一。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StartBody | EndBody;

    if (body.action === "end") {
      if (!body.watchSessionId) return new Response(null, { status: 204 });
      await endWatchSession(body.watchSessionId);
      return new Response(null, { status: 204 });
    }

    // start — 認証が必要
    const actor = await resolveSessionUser();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!body.hostUserId || !body.streamSessionId) {
      return NextResponse.json({ error: "hostUserId and streamSessionId are required" }, { status: 400 });
    }

    // host 自身の視聴は計測しない
    if (actor.id === body.hostUserId) {
      return NextResponse.json({ watchSessionId: null });
    }

    const watchSessionId = await startWatchSession(actor.id, body.hostUserId, body.streamSessionId);
    return NextResponse.json({ watchSessionId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
