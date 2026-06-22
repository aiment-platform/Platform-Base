import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/lib/server/auth";
import { getStreamSessionById, redeemParticipationTicket } from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

/**
 * POST /api/stream-sessions/[sessionId]/reservations/redeem-ticket
 * 参加チケットを1枚使ってスピーカー予約を支払い済みにする（Stripe支払いをスキップ）。
 */
export async function POST(_req: Request, ctx: RouteContext) {
  try {
    const { sessionId } = await ctx.params;
    const actor = await requireSessionUser();

    const session = await getStreamSessionById(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === "ended") {
      return NextResponse.json({ error: "この配信枠は終了しています" }, { status: 400 });
    }

    const reservation = await redeemParticipationTicket(actor.id, sessionId);
    return NextResponse.json({ reservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to redeem ticket";
    const isAuth = message === "No session user is configured" || message === "Authentication required";
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 400 });
  }
}
