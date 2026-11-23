/**
 * 配信の録画（アーカイブ）。
 *
 * 1 回の配信で 2 種類を同時に録る:
 *   full   … 部屋全体。VTuber の映像に、VTuber と話した視聴者の声を全部重ねたもの（RoomComposite）
 *   vtuber … OBS から入る VTuber の参加者だけ。視聴者の声は入らない（ParticipantEgress）
 *
 * 録画は LiveKit Cloud が行い、できたファイルを LiveKit が直接 R2 の録画用バケットへ書き込む。
 * このアプリは「始めて」「止めて」「どうなった？」と頼むだけで、動画データは通らない。
 *
 * ダウンロードできるのは管理者だけ（API 側で requireAdminUser を通す）。
 * 録画用バケットは公開しないこと。画像用（R2_BUCKET）は誰でも読めるので使わない。
 */
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  checkObsConnected,
  EgressStatus,
  getEgress,
  isEgressRunning,
  listRoomEgresses,
  startParticipantRecording,
  startRoomRecording,
  stopEgress,
  type EgressConfig,
  type EgressInfo,
  type RecordingStorage,
} from "@repo/livekit";
import type { StreamSession } from "../apiTypes";
import {
  finishRecording,
  insertRecording,
  releaseRecordingLock,
  tryAcquireRecordingLock,
  type RecordingKind,
  type SessionRecording,
} from "./recordingStore";

type RecordingConfig = {
  livekit: EgressConfig;
  storage: RecordingStorage;
};

/** 録画に必要な設定がそろっていれば返す。足りなければ null（＝録画しない） */
function getRecordingConfig(): RecordingConfig | null {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const accountId = process.env.R2_ACCOUNT_ID;
  // 録画は LiveKit に鍵を渡して書き込んでもらうので、録画用バケットだけに絞った鍵を別に用意できるようにする
  const accessKeyId = process.env.R2_RECORDINGS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_RECORDINGS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_RECORDINGS_BUCKET;
  if (!apiKey || !apiSecret || !host || !accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    livekit: { apiKey, apiSecret, host },
    storage: {
      accessKeyId,
      secretAccessKey,
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      bucket,
    },
  };
}

export function isRecordingConfigured() {
  return getRecordingConfig() !== null;
}

/** OBS（Ingress）から入る VTuber の参加者名。api/livekit/ingress と同じ決め方 */
function obsIdentity(session: StreamSession) {
  return `obs-${session.hostUserId}`;
}

function fileKeyFor(sessionId: string, kind: RecordingKind, startedAt: Date) {
  const safeId = sessionId.replace(/[^A-Za-z0-9_-]/g, "_");
  const stamp = startedAt.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  return `recordings/${safeId}/${kind}-${stamp}.mp4`;
}

/**
 * 全部入りの録画に使う画面（app/recording-template）。LiveKit の録画用ブラウザが開くので、
 * インターネットから見える URL でないといけない。localhost のときは LiveKit 標準の画面で録る。
 */
function templateUrl(requestOrigin: string | undefined) {
  const base = process.env.RECORDING_TEMPLATE_BASE_URL?.replace(/\/$/, "") || requestOrigin;
  if (!base) return undefined;
  try {
    const { hostname } = new URL(base);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) return undefined;
  } catch {
    return undefined;
  }
  return `${base}/recording-template`;
}

function isKind(info: EgressInfo, kind: RecordingKind, identity: string) {
  if (kind === "full") return info.request.case === "roomComposite";
  return info.request.case === "participant" && info.request.value.identity === identity;
}

export type EnsureResult = { started: RecordingKind[]; skipped?: string };

/**
 * 配信中で OBS がつながっていれば、まだ動いていない種類の録画を始める。何度呼んでもよい。
 * 配信者の画面が「配信開始」と「OBS の映像が届いた」ときに呼ぶ。
 */
export async function ensureSessionRecording(session: StreamSession, requestOrigin?: string): Promise<EnsureResult> {
  const config = getRecordingConfig();
  if (!config) return { started: [], skipped: "not-configured" };
  if (session.status !== "live") return { started: [], skipped: "not-live" };

  const identity = obsIdentity(session);
  // VTuber のみの録画は、その参加者が部屋にいないと始められない
  const connected = await checkObsConnected({
    ...config.livekit,
    roomName: session.sessionId,
    participantIdentity: identity,
  });
  if (!connected) return { started: [], skipped: "obs-not-connected" };

  if (!(await tryAcquireRecordingLock(session.sessionId))) return { started: [], skipped: "busy" };
  try {
    // 「終了処理中」は数えない。OBS の回線切替で前の VTuber のみ録画が終わりかけていても、新しい録画を始めるため
    const running = (await listRoomEgresses(config.livekit, { roomName: session.sessionId, active: true })).filter(
      (info) => info.status === EgressStatus.EGRESS_STARTING || info.status === EgressStatus.EGRESS_ACTIVE,
    );
    const missing = (["full", "vtuber"] as const).filter(
      (kind) => !running.some((info) => isKind(info, kind, identity)),
    );

    const started: RecordingKind[] = [];
    for (const kind of missing) {
      const startedAt = new Date();
      const fileKey = fileKeyFor(session.sessionId, kind, startedAt);
      try {
        const info =
          kind === "full"
            ? await startRoomRecording(config.livekit, {
                roomName: session.sessionId,
                storage: config.storage,
                filepath: fileKey,
                customBaseUrl: templateUrl(requestOrigin),
              })
            : await startParticipantRecording(config.livekit, {
                roomName: session.sessionId,
                identity,
                storage: config.storage,
                filepath: fileKey,
              });
        await insertRecording({
          egressId: info.egressId,
          sessionId: session.sessionId,
          kind,
          fileKey,
          status: "recording",
          sessionTitle: session.title,
          hostName: session.hostChannelName || session.hostName || "",
          startedAt: startedAt.toISOString(),
        });
        started.push(kind);
      } catch (err) {
        // 片方が失敗しても、もう片方は録る
        console.error(`[recording] failed to start ${kind} recording:`, session.sessionId, err);
      }
    }
    return { started };
  } finally {
    await releaseRecordingLock(session.sessionId);
  }
}

/** 配信終了時に、その部屋で動いている録画を全部止める。失敗しても終了処理は止めない */
export async function stopSessionRecording(sessionId: string): Promise<void> {
  const config = getRecordingConfig();
  if (!config) return;
  try {
    const running = (await listRoomEgresses(config.livekit, { roomName: sessionId, active: true })).filter(
      isEgressRunning,
    );
    await Promise.all(
      running.map((info) =>
        stopEgress({ ...config.livekit, egressId: info.egressId }).catch((err) => {
          console.error("[recording] failed to stop egress:", info.egressId, err);
        }),
      ),
    );
  } catch (err) {
    console.error("[recording] failed to list egresses on stop:", sessionId, err);
  }
}

// ---------------------------------------------------------------------------
// 状態の確認とダウンロード（管理者用）
// ---------------------------------------------------------------------------

function createS3Client(storage: RecordingStorage) {
  return new S3Client({
    region: "auto",
    endpoint: storage.endpoint,
    credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey },
  });
}

function toIso(nanos: bigint) {
  return nanos > BigInt(0) ? new Date(Number(nanos / BigInt(1_000_000))).toISOString() : undefined;
}

/**
 * 「録画中」のままの記録について、LiveKit に今の状態を聞いて書き直す。
 * LiveKit からの完了通知（webhook）を受ける仕組みをまだ作っていないので、一覧を開いたときに確かめる。
 */
export async function refreshRecordingStatuses(recordings: SessionRecording[]): Promise<SessionRecording[]> {
  const config = getRecordingConfig();
  if (!config) return recordings;

  return Promise.all(
    recordings.map(async (recording) => {
      if (recording.status !== "recording") return recording;
      try {
        const info = await getEgress(config.livekit, recording.egressId);
        if (info && isEgressRunning(info)) return recording;

        if (!info) {
          // LiveKit 側の履歴から消えていた。ファイルが R2 にあれば録れているとみなす
          const exists = await headObject(config.storage, recording.fileKey);
          if (!exists) return recording;
          const next = { status: "ready" as const, sizeBytes: exists.size };
          await finishRecording(recording.egressId, next);
          return { ...recording, ...next };
        }

        const file = info.fileResults[0] ?? (info.result.case === "file" ? info.result.value : undefined);
        const ok =
          info.status === EgressStatus.EGRESS_COMPLETE ||
          // 時間の上限に達した場合も、そこまでのファイルはできている
          (info.status === EgressStatus.EGRESS_LIMIT_REACHED && Boolean(file));
        const next = {
          status: ok ? ("ready" as const) : ("failed" as const),
          endedAt: toIso(info.endedAt),
          sizeBytes: file ? Number(file.size) : undefined,
          durationSec: file ? Math.round(Number(file.duration) / 1e9) : undefined,
          error: info.error || undefined,
        };
        await finishRecording(recording.egressId, next);
        return { ...recording, ...next };
      } catch (err) {
        console.error("[recording] failed to refresh status:", recording.egressId, err);
        return recording;
      }
    }),
  );
}

async function headObject(storage: RecordingStorage, key: string): Promise<{ size?: number } | null> {
  try {
    const res = await createS3Client(storage).send(new HeadObjectCommand({ Bucket: storage.bucket, Key: key }));
    return { size: res.ContentLength };
  } catch {
    return null;
  }
}

const KIND_LABEL: Record<RecordingKind, string> = { full: "全部入り", vtuber: "VTuberのみ" };

function downloadFileName(recording: SessionRecording) {
  const date = recording.startedAt.slice(0, 10);
  const title = recording.sessionTitle.replace(/[\\/:*?"<>|\r\n]+/g, " ").trim().slice(0, 60) || recording.sessionId;
  return `${title}_${KIND_LABEL[recording.kind]}_${date}.mp4`;
}

/**
 * 数分だけ使えるダウンロード用リンク（署名付き URL）を作る。
 * バケットは公開しないので、このリンクがないとファイルは読めない。
 */
export async function createRecordingDownloadUrl(recording: SessionRecording, expiresInSec = 300): Promise<string> {
  const config = getRecordingConfig();
  if (!config) throw new Error("Recording storage is not configured");
  const fileName = downloadFileName(recording);
  // 日本語のファイル名は filename* で送る（RFC 5987）。古いブラウザ向けに ASCII だけの filename も付ける
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_");
  const disposition = `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  return getSignedUrl(
    createS3Client(config.storage),
    new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: recording.fileKey,
      ResponseContentDisposition: disposition,
      ResponseContentType: "video/mp4",
    }),
    { expiresIn: expiresInSec },
  );
}
