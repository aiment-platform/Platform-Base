import { NextResponse } from "next/server";
import type { ParticipationTicketScope } from "@/app/lib/apiTypes";
import { resolveSessionUser } from "@/app/lib/server/auth";
import {
  getStreamSessionById,
  getUserById,
  grantParticipationTickets,
  listParticipationTicketsForUser,
} from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function assertAdmin(userId: string) {
  if (!ADMIN_IDS.includes(userId)) throw new Error("Admin access required");
}

/** GET /api/admin/tickets?userId=... — 指定ユーザーのチケット一覧 */
export async function GET(req: Request) {
  const actor = await resolveSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertAdmin(actor.id);
    const userId = new URL(req.url).searchParams.get("userId")?.trim();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const tickets = await listParticipationTicketsForUser(userId);
    return NextResponse.json({ tickets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 500 });
  }
}

/** POST /api/admin/tickets — チケットを付与
 *  Body: { userId, scope: "all"|"session", sessionId?, quantity }
 */
export async function POST(req: Request) {
  const actor = await resolveSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertAdmin(actor.id);
    const body = (await req.json()) as {
      userId?: unknown;
      scope?: unknown;
      sessionId?: unknown;
      quantity?: unknown;
    };

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const scope: ParticipationTicketScope = body.scope === "session" ? "session" : "all";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "quantity must be >= 1" }, { status: 400 });
    }

    // 対象ユーザーの存在確認
    const target = await getUserById(userId);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // session スコープは対象配信の存在確認
    if (scope === "session") {
      if (!sessionId) return NextResponse.json({ error: "sessionId required for session scope" }, { status: 400 });
      const session = await getStreamSessionById(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const granted = await grantParticipationTickets({
      grantedBy: actor.id,
      userId,
      scope,
      sessionId: scope === "session" ? sessionId : undefined,
      quantity,
    });

    return NextResponse.json({ granted }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to grant tickets";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 400 });
  }
}
