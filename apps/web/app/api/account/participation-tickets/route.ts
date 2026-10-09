import { NextResponse } from "next/server";
import { resolveSessionUser } from "@/app/lib/server/auth";
import { listParticipationTicketsForUser } from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/account/participation-tickets — ログイン中ユーザー本人の参加チケット一覧 */
export async function GET() {
  const actor = await resolveSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tickets = await listParticipationTicketsForUser(actor.id);
    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}
