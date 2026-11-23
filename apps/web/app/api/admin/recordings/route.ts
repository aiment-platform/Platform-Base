import { NextResponse } from "next/server";
import { requireAdminUser } from "@/app/lib/server/auth";
import { listRecordings } from "@/app/lib/server/recordingStore";
import { isRecordingConfigured, refreshRecordingStatuses } from "@/app/lib/server/sessionRecording";
import { adminErrorResponse } from "../sessions/adminErrorResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/recordings — 録画の一覧（新しい順）。「録画中」のものは LiveKit に状態を聞いて更新してから返す */
export async function GET() {
  try {
    await requireAdminUser();
    const recordings = await refreshRecordingStatuses(await listRecordings());
    return NextResponse.json({ recordings, configured: isRecordingConfigured() });
  } catch (error) {
    return adminErrorResponse(error, "Failed to list recordings");
  }
}
