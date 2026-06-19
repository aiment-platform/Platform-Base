import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/lib/server/auth";
import {
  createReservation,
  getStreamSessionById,
  hasActiveSpeakerReservation,
  hasPaidSpeakerReservation,
  listReservationsForSession,
} from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

/** GET /api/stream-sessions/[sessionId]/reservations
 *  - 通常: 現在ユーザーの予約状況を返す
 *  - ?asHost=1: ホスト本人のみ全スピーカー予約一覧を返す
 */
export async function GET(req: Request, ctx: RouteContext) {
  try {
    const { sessionId } = await ctx.params;
    const url = new URL(req.url);
    const asHost = url.searchParams.get("asHost") === "1";

    if (asHost) {
      const actor = await requireSessionUser();
      const reservations = await listReservationsForSession(sessionId, actor);
      const speakers = reservations.filter((r) => r.type === "speaker" && r.status === "reserved");
      return NextResponse.json({ reservations: speakers });
    }

    const actor = await requireSessionUser();
    const session = await getStreamSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isSpeaker = await hasActiveSpeakerReservation(actor.id, sessionId);
    const isPaid = isSpeaker ? await hasPaidSpeakerReservation(actor.id, sessionId) : false;

    // Payment window opens 24h before startsAt
    const startsAt = new Date(session.startsAt);
    const paymentWindowOpen = Date.now() >= startsAt.getTime() - 24 * 60 * 60 * 1000;

    return NextResponse.json({
      hasSpeakerReservation: isSpeaker,
      hasPaidSpeakerReservation: isPaid,
      paymentWindowOpen,
      speakerSlotsLeft: session.speakerSlotsLeft,
      speakerSlotsTotal: session.speakerSlotsTotal,
      speakerRequiredPlan: session.speakerRequiredPlan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** POST /api/stream-sessions/[sessionId]/reservations
 *  Body: { type: "speaker" | "listener" }
 *  予約はログインのみで可能（無料）。スピーカー参加費の支払いは配信24時間前から
 *  /reservations/confirm-payment で行い、支払い完了後に入室できる。
 */
export async function POST(req: Request, ctx: RouteContext) {
  try {
    const { sessionId } = await ctx.params;
    const actor = await requireSessionUser();
    const body = (await req.json()) as { type?: string };
    const type = body.type === "speaker" ? "speaker" : "listener";

    // 枠の残数・必要プランなどの検証は createReservation 側で行う。
    const reservation = await createReservation(actor, { sessionId, type });
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Authentication required"
        ? 401
        : message.includes("already have") || message.includes("plan") || message.includes("slots left")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
