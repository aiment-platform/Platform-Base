import { randomUUID } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const USE_NEON = Boolean(process.env.DATABASE_URL);

let _sql: NeonQueryFunction<false, false> | null = null;
function getDb() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

let _schemaReady: Promise<void> | null = null;
function ensureSchema() {
  if (!_schemaReady) _schemaReady = initSchema();
  return _schemaReady;
}

async function initSchema() {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS watch_sessions (
      id TEXT PRIMARY KEY,
      viewer_user_id TEXT NOT NULL,
      host_user_id TEXT NOT NULL,
      stream_session_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS user_host_stats (
      viewer_user_id TEXT NOT NULL,
      host_user_id TEXT NOT NULL,
      watch_time_hours FLOAT NOT NULL DEFAULT 0,
      win_count INT NOT NULL DEFAULT 0,
      PRIMARY KEY (viewer_user_id, host_user_id)
    )
  `;
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

type MemWatchSession = {
  id: string;
  viewerUserId: string;
  hostUserId: string;
  streamSessionId: string;
  startedAt: string;
  endedAt: string | null;
};

const memSessions: MemWatchSession[] = [];
// key: `${viewerUserId}:${hostUserId}`
const memStats = new Map<string, { watchTimeHours: number; winCount: number }>();

function memStatsKey(viewerUserId: string, hostUserId: string) {
  return `${viewerUserId}:${hostUserId}`;
}

function addMemStats(viewerUserId: string, hostUserId: string, hours: number) {
  const key = memStatsKey(viewerUserId, hostUserId);
  const existing = memStats.get(key) ?? { watchTimeHours: 0, winCount: 0 };
  memStats.set(key, { ...existing, watchTimeHours: existing.watchTimeHours + hours });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function startWatchSession(
  viewerUserId: string,
  hostUserId: string,
  streamSessionId: string,
): Promise<string> {
  const id = `watch-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  const startedAt = new Date().toISOString();

  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`
      INSERT INTO watch_sessions (id, viewer_user_id, host_user_id, stream_session_id, started_at)
      VALUES (${id}, ${viewerUserId}, ${hostUserId}, ${streamSessionId}, ${startedAt})
    `;
    return id;
  }

  memSessions.push({ id, viewerUserId, hostUserId, streamSessionId, startedAt, endedAt: null });
  return id;
}

export async function endWatchSession(watchSessionId: string): Promise<void> {
  const endedAt = new Date().toISOString();

  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();

    const rows = await db`
      SELECT viewer_user_id, host_user_id, started_at
      FROM watch_sessions
      WHERE id = ${watchSessionId} AND ended_at IS NULL
    `;
    if (rows.length === 0) return;

    const { viewer_user_id, host_user_id, started_at } = rows[0];
    const hours = (new Date(endedAt).getTime() - new Date(started_at as string).getTime()) / 3_600_000;
    if (hours < 0.001) return; // 4秒未満は無視

    await db`UPDATE watch_sessions SET ended_at = ${endedAt} WHERE id = ${watchSessionId}`;
    await db`
      INSERT INTO user_host_stats (viewer_user_id, host_user_id, watch_time_hours)
      VALUES (${viewer_user_id}, ${host_user_id}, ${hours})
      ON CONFLICT (viewer_user_id, host_user_id)
      DO UPDATE SET watch_time_hours = user_host_stats.watch_time_hours + EXCLUDED.watch_time_hours
    `;
    return;
  }

  const session = memSessions.find((s) => s.id === watchSessionId && !s.endedAt);
  if (!session) return;
  session.endedAt = endedAt;
  const hours = (new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 3_600_000;
  if (hours >= 0.001) addMemStats(session.viewerUserId, session.hostUserId, hours);
}

export async function getUserHostStats(
  viewerUserId: string,
  hostUserId: string,
): Promise<{ watchTimeHours: number; winCount: number }> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const rows = await db`
      SELECT watch_time_hours, win_count FROM user_host_stats
      WHERE viewer_user_id = ${viewerUserId} AND host_user_id = ${hostUserId}
    `;
    if (rows.length === 0) return { watchTimeHours: 0, winCount: 0 };
    return {
      watchTimeHours: Number(rows[0].watch_time_hours),
      winCount: Number(rows[0].win_count),
    };
  }

  return memStats.get(memStatsKey(viewerUserId, hostUserId)) ?? { watchTimeHours: 0, winCount: 0 };
}

export async function incrementHostWinCount(viewerUserId: string, hostUserId: string): Promise<void> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`
      INSERT INTO user_host_stats (viewer_user_id, host_user_id, win_count)
      VALUES (${viewerUserId}, ${hostUserId}, 1)
      ON CONFLICT (viewer_user_id, host_user_id)
      DO UPDATE SET win_count = user_host_stats.win_count + 1
    `;
    return;
  }

  const key = memStatsKey(viewerUserId, hostUserId);
  const existing = memStats.get(key) ?? { watchTimeHours: 0, winCount: 0 };
  memStats.set(key, { ...existing, winCount: existing.winCount + 1 });
}

/** 24時間以上 ended_at が NULL のセッションを強制終了（cronから呼ぶ） */
export async function cleanupStaleWatchSessions(): Promise<number> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const cutoff = new Date(Date.now() - 24 * 3_600_000).toISOString();

    const stale = await db`
      SELECT id, viewer_user_id, host_user_id, started_at
      FROM watch_sessions
      WHERE ended_at IS NULL AND started_at < ${cutoff}
    `;

    for (const row of stale) {
      // 最大24時間として集計
      const cappedHours = Math.min(
        24,
        (Date.now() - new Date(row.started_at as string).getTime()) / 3_600_000,
      );
      await db`UPDATE watch_sessions SET ended_at = ${new Date().toISOString()} WHERE id = ${row.id}`;
      if (cappedHours >= 0.001) {
        await db`
          INSERT INTO user_host_stats (viewer_user_id, host_user_id, watch_time_hours)
          VALUES (${row.viewer_user_id}, ${row.host_user_id}, ${cappedHours})
          ON CONFLICT (viewer_user_id, host_user_id)
          DO UPDATE SET watch_time_hours = user_host_stats.watch_time_hours + EXCLUDED.watch_time_hours
        `;
      }
    }

    return stale.length;
  }

  // In-memory: mark stale sessions
  const cutoffMs = Date.now() - 24 * 3_600_000;
  let count = 0;
  for (const session of memSessions) {
    if (!session.endedAt && new Date(session.startedAt).getTime() < cutoffMs) {
      session.endedAt = new Date().toISOString();
      const hours = Math.min(24, (Date.now() - new Date(session.startedAt).getTime()) / 3_600_000);
      if (hours >= 0.001) addMemStats(session.viewerUserId, session.hostUserId, hours);
      count++;
    }
  }
  return count;
}
