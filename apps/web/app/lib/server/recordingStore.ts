/**
 * 配信の録画（アーカイブ）の記録。録画ファイルそのものは R2 にあり、ここには「どの配信の、どの種類の録画が、
 * どのファイルにあるか」と状態だけを持つ。
 *
 * 1 回の配信に録画は何本もありうる（OBS の回線切替で VTuber が入り直すと、VTuber のみの録画は区切られる）。
 * そのため 1 行 = 1 本の録画（LiveKit の egress 1 件）にしている。
 *
 * 同じ配信に「録画を始めて」が同時に何度も届いても二重に始めないよう、短い時間だけ効く鍵（lock）も持つ。
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** full = 全部入り（VTuber＋話した視聴者の声）、vtuber = VTuber の映像と音だけ */
export type RecordingKind = "full" | "vtuber";
export type RecordingStatus = "recording" | "ready" | "failed";

export type SessionRecording = {
  egressId: string;
  sessionId: string;
  kind: RecordingKind;
  /** R2 の中の置き場所（例: recordings/<sessionId>/full-20261123-120000.mp4） */
  fileKey: string;
  status: RecordingStatus;
  sessionTitle: string;
  hostName: string;
  startedAt: string;
  endedAt?: string;
  sizeBytes?: number;
  durationSec?: number;
  error?: string;
};

const USE_NEON = Boolean(process.env.DATABASE_URL);

let _sql: NeonQueryFunction<false, false> | null = null;
function getDb() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

let _schemaReady: Promise<void> | null = null;
function ensureSchema() {
  if (!_schemaReady) {
    _schemaReady = initSchema().catch((err) => {
      _schemaReady = null;
      throw err;
    });
  }
  return _schemaReady;
}

async function initSchema() {
  const db = getDb();
  // 起動のたびに走るので、全文を 1 回の HTTP リクエスト(1 トランザクション)にまとめて送る。
  await db.transaction([
    db`
      CREATE TABLE IF NOT EXISTS session_recordings (
        egress_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        file_key TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'recording',
        session_title TEXT NOT NULL DEFAULT '',
        host_name TEXT NOT NULL DEFAULT '',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        size_bytes BIGINT,
        duration_sec INTEGER,
        error TEXT
      )
    `,
    db`CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON session_recordings (session_id)`,
    db`CREATE INDEX IF NOT EXISTS idx_session_recordings_started ON session_recordings (started_at)`,
    db`
      CREATE TABLE IF NOT EXISTS session_recording_locks (
        session_id TEXT PRIMARY KEY,
        locked_until TEXT NOT NULL
      )
    `,
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecording(row: any): SessionRecording {
  return {
    egressId: row.egress_id,
    sessionId: row.session_id,
    kind: row.kind === "vtuber" ? "vtuber" : "full",
    fileKey: row.file_key,
    status: row.status === "ready" || row.status === "failed" ? row.status : "recording",
    sessionTitle: row.session_title ?? "",
    hostName: row.host_name ?? "",
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    sizeBytes: row.size_bytes === null || row.size_bytes === undefined ? undefined : Number(row.size_bytes),
    durationSec: row.duration_sec ?? undefined,
    error: row.error ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// DB がないとき（ローカル開発）の置き場。プロセスが落ちると消える
// ---------------------------------------------------------------------------
const memRecordings = new Map<string, SessionRecording>();
const memLocks = new Map<string, number>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function insertRecording(recording: SessionRecording): Promise<void> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`
      INSERT INTO session_recordings
        (egress_id, session_id, kind, file_key, status, session_title, host_name, started_at)
      VALUES
        (${recording.egressId}, ${recording.sessionId}, ${recording.kind}, ${recording.fileKey},
         ${recording.status}, ${recording.sessionTitle}, ${recording.hostName}, ${recording.startedAt})
      ON CONFLICT (egress_id) DO NOTHING
    `;
    return;
  }
  memRecordings.set(recording.egressId, { ...recording });
}

/** 録画が終わった（または失敗した）ときに、状態とファイルの情報を書き込む */
export async function finishRecording(
  egressId: string,
  result: { status: Exclude<RecordingStatus, "recording">; endedAt?: string; sizeBytes?: number; durationSec?: number; error?: string },
): Promise<void> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`
      UPDATE session_recordings
      SET status = ${result.status},
          ended_at = ${result.endedAt ?? null},
          size_bytes = ${result.sizeBytes ?? null},
          duration_sec = ${result.durationSec ?? null},
          error = ${result.error ?? null}
      WHERE egress_id = ${egressId}
    `;
    return;
  }
  const current = memRecordings.get(egressId);
  if (current) memRecordings.set(egressId, { ...current, ...result });
}

export async function listRecordings(options: { sessionId?: string; limit?: number } = {}): Promise<SessionRecording[]> {
  const limit = options.limit ?? 200;
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const rows = options.sessionId
      ? await db`
          SELECT * FROM session_recordings WHERE session_id = ${options.sessionId}
          ORDER BY started_at DESC LIMIT ${limit}
        `
      : await db`SELECT * FROM session_recordings ORDER BY started_at DESC LIMIT ${limit}`;
    return rows.map(rowToRecording);
  }
  return Array.from(memRecordings.values())
    .filter((r) => !options.sessionId || r.sessionId === options.sessionId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit);
}

export async function getRecording(egressId: string): Promise<SessionRecording | null> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const rows = await db`SELECT * FROM session_recordings WHERE egress_id = ${egressId}`;
    return rows[0] ? rowToRecording(rows[0]) : null;
  }
  return memRecordings.get(egressId) ?? null;
}

/**
 * 配信ごとの短い鍵を取る。取れたら true。ttlMs のあいだ、ほかの呼び出しは false になる。
 * 録画の開始は「今動いている録画を調べる → 足りないものを始める」の 2 段なので、
 * 同時に 2 つ走ると両方が「足りない」と判断して二重に始めてしまう。それを防ぐ。
 */
export async function tryAcquireRecordingLock(sessionId: string, ttlMs = 20_000): Promise<boolean> {
  const now = new Date();
  const until = new Date(now.getTime() + ttlMs).toISOString();
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const rows = await db`
      INSERT INTO session_recording_locks (session_id, locked_until)
      VALUES (${sessionId}, ${until})
      ON CONFLICT (session_id) DO UPDATE SET locked_until = EXCLUDED.locked_until
      WHERE session_recording_locks.locked_until < ${now.toISOString()}
      RETURNING session_id
    `;
    return rows.length > 0;
  }
  const current = memLocks.get(sessionId) ?? 0;
  if (current > now.getTime()) return false;
  memLocks.set(sessionId, now.getTime() + ttlMs);
  return true;
}

export async function releaseRecordingLock(sessionId: string): Promise<void> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`DELETE FROM session_recording_locks WHERE session_id = ${sessionId}`;
    return;
  }
  memLocks.delete(sessionId);
}
