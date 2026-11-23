import { NextResponse } from "next/server";
import { requireAdminUser } from "@/app/lib/server/auth";
import { getRecording } from "@/app/lib/server/recordingStore";
import { createRecordingDownloadUrl } from "@/app/lib/server/sessionRecording";
import { adminErrorResponse } from "../../../sessions/adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/recordings/:egressId/download — 管理者だけ。数分だけ有効なリンクを作って、そこへ転送する。
 * 動画そのものはこのサーバーを通さず、ブラウザが R2 から直接受け取る（大きなファイルでも詰まらない）。
 */
export async function GET(_request: Request, context: { params: Promise<{ egressId: string }> }) {
  try {
    await requireAdminUser();
    const { egressId } = await context.params;
    const recording = await getRecording(egressId);
    if (!recording) return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    if (recording.status !== "ready") {
      return NextResponse.json({ error: "Recording is not ready yet" }, { status: 409 });
    }
    const url = await createRecordingDownloadUrl(recording);
    return NextResponse.redirect(url, 302);
  } catch (error) {
    return adminErrorResponse(error, "Failed to create download link");
  }
}
