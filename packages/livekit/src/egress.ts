import {
  EgressClient,
  EgressStatus,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  StreamOutput,
  StreamProtocol,
  type EgressInfo,
} from "livekit-server-sdk";

function toHttpHost(wsUrl: string): string {
  return wsUrl.replace(/^wss?:\/\//, "https://");
}

export type EgressConfig = {
  apiKey: string;
  apiSecret: string;
  /** LiveKit の URL（wss://... でも https://... でもよい） */
  host: string;
};

function createClient(config: EgressConfig) {
  return new EgressClient(toHttpHost(config.host), config.apiKey, config.apiSecret);
}

export type StartEgressParams = {
  apiKey: string;
  apiSecret: string;
  host: string;
  roomName: string;
  rtmpUrl: string;
  vtuberIdentity: string;
};

/**
 * Start egress of the VTuber's video+audio tracks to an RTMP destination
 * (e.g. Cloudflare Stream).
 *
 * Uses `startParticipantEgress` which captures a specific participant's
 * camera + microphone tracks automatically by identity.
 */
export async function startVtuberEgress(
  params: StartEgressParams,
): Promise<string> {
  const egressClient = createClient(params);

  const egress = await egressClient.startParticipantEgress(
    params.roomName,
    params.vtuberIdentity,
    {
      stream: new StreamOutput({
        protocol: StreamProtocol.RTMP,
        urls: [params.rtmpUrl],
      }),
    },
  );

  return egress.egressId;
}

export type StopEgressParams = {
  apiKey: string;
  apiSecret: string;
  host: string;
  egressId: string;
};

/**
 * Stop a running egress by its ID.
 */
export async function stopEgress(params: StopEgressParams): Promise<void> {
  await createClient(params).stopEgress(params.egressId);
}

// ---------------------------------------------------------------------------
// 録画（ファイルに書き出して S3 互換の置き場に保存する）
// ---------------------------------------------------------------------------

/** 録画ファイルの保存先。Cloudflare R2 は S3 と同じ話し方ができるので S3Upload で渡す */
export type RecordingStorage = {
  accessKeyId: string;
  secretAccessKey: string;
  /** 例: https://<accountId>.r2.cloudflarestorage.com */
  endpoint: string;
  bucket: string;
};

function fileOutput(storage: RecordingStorage, filepath: string) {
  return new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: storage.accessKeyId,
        secret: storage.secretAccessKey,
        region: "auto",
        endpoint: storage.endpoint,
        bucket: storage.bucket,
        forcePathStyle: true,
      }),
    },
  });
}

/**
 * 部屋全体を 1 枚の画面に合成して録る（全部入り）。
 * 録画用のブラウザが部屋に入り、その画面と、部屋で鳴っているすべての音を録る。
 * customBaseUrl を渡すとその画面（自前のレイアウト）を使い、渡さなければ LiveKit 標準の layout を使う。
 */
export async function startRoomRecording(
  config: EgressConfig,
  params: { roomName: string; storage: RecordingStorage; filepath: string; customBaseUrl?: string; layout?: string },
): Promise<EgressInfo> {
  return createClient(config).startRoomCompositeEgress(
    params.roomName,
    { file: fileOutput(params.storage, params.filepath) },
    {
      customBaseUrl: params.customBaseUrl,
      layout: params.customBaseUrl ? undefined : (params.layout ?? "speaker"),
    },
  );
}

/**
 * 1 人の参加者（ここでは OBS から入る VTuber）の映像と音だけを録る。
 * ほかの参加者（話す視聴者）の声は入らない。
 */
export async function startParticipantRecording(
  config: EgressConfig,
  params: { roomName: string; identity: string; storage: RecordingStorage; filepath: string },
): Promise<EgressInfo> {
  return createClient(config).startParticipantEgress(params.roomName, params.identity, {
    file: fileOutput(params.storage, params.filepath),
  });
}

/** 部屋の録画の一覧。active: true で、いま録っているものだけ */
export async function listRoomEgresses(
  config: EgressConfig,
  params: { roomName: string; active?: boolean },
): Promise<EgressInfo[]> {
  return createClient(config).listEgress({ roomName: params.roomName, active: params.active });
}

/** egressId 1 件の今の状態。見つからなければ null */
export async function getEgress(config: EgressConfig, egressId: string): Promise<EgressInfo | null> {
  const list = await createClient(config).listEgress({ egressId });
  return list[0] ?? null;
}

/** まだ終わっていない（録画中・開始中・終了処理中）か */
export function isEgressRunning(info: EgressInfo): boolean {
  return (
    info.status === EgressStatus.EGRESS_STARTING ||
    info.status === EgressStatus.EGRESS_ACTIVE ||
    info.status === EgressStatus.EGRESS_ENDING
  );
}

export { EgressStatus };
export type { EgressInfo };
