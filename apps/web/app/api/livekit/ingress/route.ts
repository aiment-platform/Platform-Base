import { NextResponse } from "next/server";
import { createRtmpIngress, deleteRtmpIngress } from "@repo/livekit";
import { requireSessionUser } from "@/app/lib/server/auth";
import {
  clearSessionIngress,
  getStreamSessionById,
  setSessionIngress,
} from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getLivekitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!apiKey || !apiSecret || !host) throw new Error("LiveKit not configured");
  return { apiKey, apiSecret, host };
}

export async function GET(request: Request) {
  try {
    const actor = await requireSessionUser();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await getStreamSessionById(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.hostUserId !== actor.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!session.ingressId) return NextResponse.json({ ingress: null });

    return NextResponse.json({
      ingress: {
        ingressId: session.ingressId,
        streamKey: session.streamKey,
        rtmpUrl: session.rtmpUrl,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get ingress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSessionUser();
    if (actor.role !== "vtuber")
      return NextResponse.json({ error: "VTuber accounts only" }, { status: 403 });

    const { sessionId, swap } = (await request.json()) as { sessionId: string; swap?: boolean };
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await getStreamSessionById(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.hostUserId !== actor.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { apiKey, apiSecret, host } = getLivekitConfig();

    // 回線切替(hot-swap): 新しいingressを先に作成し、session を更新してから
    // 古いingressを削除する。VTuber/speaker は別参加者のため接続は維持される。
    // 「先に作る」順序により、作成失敗時も既存回線を壊さない（regenerateより安全）。
    const previousIngressId = swap ? session.ingressId : undefined;

    const result = await createRtmpIngress({
      apiKey,
      apiSecret,
      host,
      roomName: sessionId,
      participantIdentity: `obs-${actor.id}`,
      participantName: actor.name,
      streamName: session.title,
    });

    await setSessionIngress(sessionId, result.ingressId, result.streamKey, result.rtmpUrl);

    if (previousIngressId && previousIngressId !== result.ingressId) {
      // 旧回線を後始末（失敗してもswap自体は成功扱い。残留は /admin/ingresses で掃除可能）。
      try {
        await deleteRtmpIngress({ apiKey, apiSecret, host, ingressId: previousIngressId });
      } catch (err) {
        console.error("[livekit/ingress] failed to delete previous ingress on swap:", err);
      }
    }

    return NextResponse.json({ ingress: result, swapped: Boolean(previousIngressId) }, { status: 201 });
  } catch (error) {
    // 真因（LiveKit設定不足/Ingress API エラー等）をサーバーログに残す
    console.error("[livekit/ingress] create failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create ingress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireSessionUser();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await getStreamSessionById(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.hostUserId !== actor.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (session.ingressId) {
      const { apiKey, apiSecret, host } = getLivekitConfig();
      try {
        await deleteRtmpIngress({ apiKey, apiSecret, host, ingressId: session.ingressId });
      } catch {
        // ingress may already be gone on LiveKit side; clear DB regardless
      }
      await clearSessionIngress(sessionId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete ingress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
