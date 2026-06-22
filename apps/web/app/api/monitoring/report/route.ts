import { NextResponse } from "next/server";
import type { MonitoringMeta } from "@/app/lib/apiTypes";
import { requireSessionUser } from "@/app/lib/server/auth";
import { getStreamSessionById } from "@/app/lib/server/aimentStore";
import { recordMonitoringEvent } from "@/app/lib/server/opsStore";
import { sendTroubleshootingReport } from "@/app/lib/server/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NOTE = 2000;

/**
 * POST /api/monitoring/report
 * 配信者の自己診断結果を運営に送信し、監視イベントとして記録する。
 * Body: { sessionId: string; note?: string; diagnostics?: Record<string, string|number|boolean|null> }
 */
export async function POST(request: Request) {
  try {
    const actor = await requireSessionUser();
    const body = (await request.json()) as {
      sessionId?: unknown;
      note?: unknown;
      diagnostics?: unknown;
    };

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const note = typeof body.note === "string" ? body.note.slice(0, MAX_NOTE) : "";

    // diagnostics はプリミティブのみ許可（任意の巨大/危険な値を排除）
    const diagnostics: Record<string, string | number | boolean | null> = {};
    if (body.diagnostics && typeof body.diagnostics === "object") {
      for (const [k, v] of Object.entries(body.diagnostics as Record<string, unknown>)) {
        if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
          diagnostics[k.slice(0, 64)] = v as string | number | boolean | null;
        }
      }
    }

    const session = await getStreamSessionById(sessionId);
    const sessionTitle = session?.title ?? sessionId;

    // 監視イベントとして記録（運営ダッシュボードの集計に乗る）
    await recordMonitoringEvent({
      source: "webrtc",
      level: "warn",
      code: "webrtc.diag.report",
      message: "配信者からトラブル報告",
      meta: { userId: actor.id, sessionId, ...diagnostics } as MonitoringMeta,
    });

    // 運営にメール送信（SENDGRID未設定時は console フォールバック。失敗しても記録は成功扱い）
    await sendTroubleshootingReport({
      reporterName: actor.name,
      reporterEmail: actor.email,
      sessionId,
      sessionTitle,
      note,
      diagnostics,
    }).catch((err) => console.error("[monitoring/report] mail failed:", err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit report";
    const isAuth = message === "No session user is configured" || message === "Authentication required";
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 400 });
  }
}
