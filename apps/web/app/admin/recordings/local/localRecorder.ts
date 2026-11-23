/**
 * 管理者のブラウザで配信を録画し、この PC（選んだフォルダ）に保存する。Cloudflare などは使わない。
 *
 * 流れ:
 *   1. 見えない参加者として配信の部屋に入る（/api/admin/recordings/local-token の鍵を使う）
 *   2. 届いた音を Web Audio で 2 つの出口に配線する
 *        full   … VTuber（OBS）の音＋話した視聴者の声を全部
 *        vtuber … VTuber（OBS）の音だけ
 *   3. OBS の映像と、それぞれの出口の音を MediaRecorder（ブラウザの録画機能）で録る
 *   4. 1 秒ごとに出てくる録画データを、選んだフォルダのファイルへ追記する
 *
 * ファイルは 30 分ごと・OBS の回線切替ごとに区切る（part1, part2 ...）。Chrome のフォルダ書き込みは
 * 「閉じたときに確定」なので、タブが落ちたとき失うのを最後の区切りの分だけにするため。
 */
import { Room, RoomEvent, Track, VideoQuality, type RemoteParticipant, type RemoteTrack, type RemoteTrackPublication } from "livekit-client";
import { isIngressIdentity } from "../../../lib/hostVideo";

export type RecordKind = "full" | "vtuber";

export const KIND_LABEL: Record<RecordKind, string> = { full: "全部入り", vtuber: "VTuberのみ" };

/** 書き出したファイル 1 本 */
export type RecordedPart = {
  kind: RecordKind;
  name: string;
  bytes: number;
  done: boolean;
};

export type RecorderPhase = "connecting" | "waiting-video" | "recording" | "stopping" | "done" | "error";

export type RecorderState = {
  phase: RecorderPhase;
  startedAt?: number;
  parts: RecordedPart[];
  /** いま録音に入っている声の数（VTuber を含む） */
  audioSources: number;
  mimeType?: string;
  error?: string;
};

// ---------------------------------------------------------------------------
// 保存先（フォルダに直接書く / 使えないブラウザはふつうのダウンロード）
// ---------------------------------------------------------------------------

/** Chrome の File System Access API のうち、ここで使う分だけの型 */
type WritableFile = { write(data: Blob): Promise<void>; close(): Promise<void> };
export type DirectoryHandle = {
  name: string;
  getFileHandle(name: string, options: { create: boolean }): Promise<{ createWritable(): Promise<WritableFile> }>;
};
type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options: { id?: string; mode?: "read" | "readwrite" }) => Promise<DirectoryHandle>;
};

/** このブラウザがフォルダへ直接保存できるか（Chrome / Edge は可、Safari / Firefox は不可） */
export function canPickDirectory() {
  return typeof window !== "undefined" && typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

/** 保存先フォルダを選ぶ。id を付けると、次回は前に選んだフォルダ（SSD など）から始まる */
export async function pickDirectory(): Promise<DirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("このブラウザはフォルダを選べません");
  return picker({ id: "aiment-recordings", mode: "readwrite" });
}

type Sink = { write(blob: Blob): Promise<void>; close(): Promise<void> };

async function createSink(dir: DirectoryHandle | null, name: string, mimeType: string): Promise<Sink> {
  if (dir) {
    const file = await dir.getFileHandle(name, { create: true });
    const writable = await file.createWritable();
    return { write: (blob) => writable.write(blob), close: () => writable.close() };
  }
  // フォルダに書けないブラウザ: メモリに貯めて、区切りごとにダウンロードさせる（保存先はブラウザの設定に従う）
  const chunks: Blob[] = [];
  return {
    write: async (blob) => {
      chunks.push(blob);
    },
    close: async () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
  };
}

// ---------------------------------------------------------------------------
// 録画の形式
// ---------------------------------------------------------------------------

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.640028,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

/** 最近の Chrome なら MP4、無理なら WebM */
export function pickMimeType(): string {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
}

/** 映像 4Mbps＋音声 128kbps。1 時間でおよそ 1.8GB / 1 本 */
const VIDEO_BPS = 4_000_000;
const AUDIO_BPS = 128_000;
export const ESTIMATED_GB_PER_HOUR = ((VIDEO_BPS + AUDIO_BPS) * 3600) / 8 / 1e9;

const SEGMENT_MS = 30 * 60 * 1000;

function sanitize(text: string) {
  return text.replace(/[\\/:*?"<>|\r\n]+/g, " ").trim().slice(0, 50) || "session";
}

function stamp(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// 本体
// ---------------------------------------------------------------------------

type Segment = { video: MediaStreamTrack; recorders: MediaRecorder[]; closed: Promise<void> };

export class LocalSessionRecorder {
  private room = new Room({ adaptiveStream: false, dynacast: false });
  private audioContext = new AudioContext();
  private outputs: Record<RecordKind, MediaStreamAudioDestinationNode>;
  private audioNodes = new Map<string, { source: MediaStreamAudioSourceNode; element: HTMLMediaElement }>();
  private videoTrack: MediaStreamTrack | null = null;
  private segment: Segment | null = null;
  private partNumber = 0;
  private segmentTimer: number | null = null;
  private rotating: Promise<void> = Promise.resolve();
  private mimeType = pickMimeType();
  private state: RecorderState = { phase: "connecting", parts: [], audioSources: 0 };
  private readonly baseName: string;

  constructor(
    private readonly options: {
      url: string;
      token: string;
      title: string;
      dir: DirectoryHandle | null;
      /** 録っている映像を画面で確かめるための video 要素 */
      preview?: HTMLVideoElement | null;
      onChange: (state: RecorderState) => void;
    },
  ) {
    // AudioContext はボタンを押した流れの中で作る（ブラウザは、操作なしに音を扱い始めるのを止めるため）
    this.outputs = {
      full: this.audioContext.createMediaStreamDestination(),
      vtuber: this.audioContext.createMediaStreamDestination(),
    };
    this.baseName = sanitize(options.title);
    this.state.mimeType = this.mimeType;
  }

  private emit(patch: Partial<RecorderState>) {
    this.state = { ...this.state, ...patch };
    this.options.onChange(this.state);
  }

  private updatePart(name: string, patch: Partial<RecordedPart>) {
    this.emit({ parts: this.state.parts.map((part) => (part.name === name ? { ...part, ...patch } : part)) });
  }

  async start() {
    this.emit({ phase: "connecting" });
    await this.audioContext.resume();

    this.room
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) =>
        this.onTrackSubscribed(track, publication, participant),
      )
      .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => this.onTrackUnsubscribed(track, participant))
      // 配信が終わって部屋が閉じたら、録画も閉じる
      .on(RoomEvent.Disconnected, () => {
        void this.stop();
      });

    await this.room.connect(this.options.url, this.options.token, { autoSubscribe: true });
    if (this.state.phase === "connecting") this.emit({ phase: "waiting-video" });
  }

  private onTrackSubscribed(track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) {
    const fromObs = isIngressIdentity(participant.identity);

    if (track.kind === Track.Kind.Video) {
      if (!fromObs) return;
      publication.setVideoQuality(VideoQuality.HIGH);
      if (this.options.preview) track.attach(this.options.preview);
      this.videoTrack = track.mediaStreamTrack;
      // 初めて映像が届いたら録画開始。回線切替で映像が入れ替わったら、ファイルを区切って続ける
      void this.queueRotate("video");
      return;
    }

    if (track.kind !== Track.Kind.Audio) return;
    // Chrome では、相手から届いた音は一度 audio 要素につながないと Web Audio に流れない。音は出さない
    const element = track.attach();
    element.muted = true;
    const source = this.audioContext.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
    source.connect(this.outputs.full);
    if (fromObs) source.connect(this.outputs.vtuber);
    this.audioNodes.set(track.sid ?? publication.trackSid, { source, element });
    this.emit({ audioSources: this.audioNodes.size });
  }

  private onTrackUnsubscribed(track: RemoteTrack, participant: RemoteParticipant) {
    if (track.kind === Track.Kind.Video) {
      if (isIngressIdentity(participant.identity) && this.videoTrack === track.mediaStreamTrack) this.videoTrack = null;
      track.detach();
      return;
    }
    const sid = track.sid;
    const node = sid ? this.audioNodes.get(sid) : undefined;
    if (!node || !sid) return;
    node.source.disconnect();
    track.detach(node.element);
    this.audioNodes.delete(sid);
    this.emit({ audioSources: this.audioNodes.size });
  }

  /** 区切りの切り替えは順番に 1 つずつ行う（同時に走ると同じ part 番号ができてしまう） */
  private queueRotate(reason: "video" | "timer") {
    this.rotating = this.rotating.then(() => this.rotate(reason)).catch((err) => this.fail(err));
    return this.rotating;
  }

  private async rotate(reason: "video" | "timer") {
    if (this.state.phase === "stopping" || this.state.phase === "done" || this.state.phase === "error") return;
    // 映像が届いたが、今の区切りがもうその映像で録っているなら何もしない
    if (reason === "video" && this.segment && this.segment.video === this.videoTrack) return;
    await this.closeSegment();
    if (!this.videoTrack) return;
    this.segment = await this.openSegment(this.videoTrack);
    if (this.state.phase !== "recording") this.emit({ phase: "recording", startedAt: Date.now() });
    this.scheduleNextSegment();
  }

  private scheduleNextSegment() {
    if (this.segmentTimer !== null) window.clearTimeout(this.segmentTimer);
    this.segmentTimer = window.setTimeout(() => void this.queueRotate("timer"), SEGMENT_MS);
  }

  private async openSegment(video: MediaStreamTrack): Promise<Segment> {
    this.partNumber += 1;
    const ext = this.mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    const time = stamp(new Date());
    const closings: Promise<void>[] = [];
    const recorders: MediaRecorder[] = [];

    for (const kind of ["full", "vtuber"] as const) {
      const name = `${time}_${this.baseName}_${KIND_LABEL[kind]}_part${this.partNumber}.${ext}`;
      const sink = await createSink(this.options.dir, name, this.mimeType);
      const audio = this.outputs[kind].stream.getAudioTracks()[0];
      const recorder = new MediaRecorder(new MediaStream([video, audio]), {
        mimeType: this.mimeType,
        videoBitsPerSecond: VIDEO_BPS,
        audioBitsPerSecond: AUDIO_BPS,
      });

      let bytes = 0;
      // 書き込みは届いた順に 1 つずつ（並べて書くとファイルの中身が前後する）
      let writing: Promise<void> = Promise.resolve();
      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) return;
        writing = writing.then(async () => {
          await sink.write(event.data);
          bytes += event.data.size;
          this.updatePart(name, { bytes });
        });
        writing.catch((err) => this.fail(err));
      };
      closings.push(
        new Promise<void>((resolve) => {
          recorder.onstop = () => {
            writing
              .then(() => sink.close())
              .then(() => this.updatePart(name, { done: true }))
              .catch((err) => this.fail(err))
              .finally(resolve);
          };
        }),
      );

      this.emit({ parts: [...this.state.parts, { kind, name, bytes: 0, done: false }] });
      recorders.push(recorder);
    }

    // 2 本をできるだけ同時に始める。1 秒ごとにデータを出させて、少しずつ書き込む
    recorders.forEach((recorder) => recorder.start(1000));
    return { video, recorders, closed: Promise.all(closings).then(() => undefined) };
  }

  private async closeSegment() {
    const segment = this.segment;
    if (!segment) return;
    this.segment = null;
    segment.recorders.forEach((recorder) => {
      if (recorder.state !== "inactive") recorder.stop();
    });
    await segment.closed;
  }

  /** 録画を止めて、書きかけのファイルを確定させる。何度呼んでもよい */
  async stop() {
    if (this.state.phase === "stopping" || this.state.phase === "done") return this.rotating;
    const failed = this.state.phase === "error";
    if (!failed) this.emit({ phase: "stopping" });
    if (this.segmentTimer !== null) window.clearTimeout(this.segmentTimer);
    // 進行中の区切り替えを待ってから閉じる
    await this.rotating.catch(() => undefined);
    await this.closeSegment().catch((err) => this.fail(err));
    this.audioNodes.forEach((node) => node.source.disconnect());
    this.audioNodes.clear();
    await this.room.disconnect().catch(() => undefined);
    await this.audioContext.close().catch(() => undefined);
    if (!failed && this.state.phase !== "error") this.emit({ phase: "done" });
  }

  private fail(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[local-recorder]", err);
    if (this.state.phase === "error") return;
    this.emit({ phase: "error", error: message });
    // 書けたところまでは確定させる
    void this.closeSegment().catch(() => undefined);
  }
}
