import { NextResponse } from "next/server";
import type { CreateSupporterApplicationInput } from "@/app/lib/apiTypes";
import { checkJapaneseIP, getClientIpFromHeaders, JP_CHECK_MESSAGES } from "@/app/lib/japanese-detection";
import { resolveSessionUser } from "@/app/lib/server/auth";
import {
  applyForSupporterSession,
  cancelSupporterApplication,
  getMyApplication,
} from "@/app/lib/server/supporterStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await resolveSessionUser();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.role !== "supporter") {
      return NextResponse.json({ error: "サポーターアカウントのみ申請できます。" }, { status: 403 });
    }

    const ip = getClientIpFromHeaders(request.headers);
    const jpCheck = await checkJapaneseIP(ip);
    if (!jpCheck.ok) {
      return NextResponse.json({ error: JP_CHECK_MESSAGES[jpCheck.reason] }, { status: 403 });
    }

    const body = (await request.json()) as CreateSupporterApplicationInput;
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const application = await applyForSupporterSession(actor.id, actor.name, body.sessionId);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "申請に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await resolveSessionUser();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    await cancelSupporterApplication(actor.id, sessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "キャンセルに失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const actor = await resolveSessionUser();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const application = await getMyApplication(actor.id, sessionId);
    return NextResponse.json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "取得に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
