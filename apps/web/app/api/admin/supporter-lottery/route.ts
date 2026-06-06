import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/lib/server/auth";
import {
  listApplicationsForSession,
  runSupporterLottery,
} from "@/app/lib/server/supporterStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function requireAdmin() {
  const user = await requireSessionUser();
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(user.id)) {
    throw new Error("Forbidden");
  }
  return user;
}

/** GET /api/admin/supporter-lottery?sessionId=xxx — 申請者一覧 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const applications = await listApplicationsForSession(sessionId);
    return NextResponse.json({ applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "取得に失敗しました。";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** POST /api/admin/supporter-lottery — 抽選実行 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as { sessionId: string; slots: number };
    if (!body.sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const slots = typeof body.slots === "number" && body.slots > 0 ? body.slots : 1;
    const result = await runSupporterLottery(body.sessionId, slots);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "抽選に失敗しました。";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
