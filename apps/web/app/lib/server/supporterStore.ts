import { randomUUID } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { LotteryCandidate } from "../supporter-lottery";
import { drawLottery } from "../supporter-lottery";
import type {
  LotteryResult,
  SupporterApplication,
  SupporterApplicationStatus,
} from "../apiTypes";
import { incrementHostWinCount } from "./watchTimeStore";

// ---------------------------------------------------------------------------
// Storage backend
// ---------------------------------------------------------------------------

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
  await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS watch_time_hours FLOAT NOT NULL DEFAULT 0`;
  await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS supporter_win_count INT NOT NULL DEFAULT 0`;
  await db`
    CREATE TABLE IF NOT EXISTS supporter_applications (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )
  `;
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

type InMemoryApplication = SupporterApplication & {
  watchTimeHours: number;
  winCount: number;
};

const memApplications: InMemoryApplication[] = [];
const memWinCounts = new Map<string, number>();
const memWatchTime = new Map<string, number>();

// ---------------------------------------------------------------------------
// Row converter
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToApplication(row: any): SupporterApplication {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    status: row.status as SupporterApplicationStatus,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function applyForSupporterSession(
  userId: string,
  userName: string,
  sessionId: string,
): Promise<SupporterApplication> {
  const id = `sapply-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  const createdAt = new Date().toISOString();

  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();

    const existing = await db`
      SELECT id FROM supporter_applications
      WHERE session_id = ${sessionId} AND user_id = ${userId} AND status = 'pending'
    `;
    if (existing.length > 0) throw new Error("すでにこのセッションに申請済みです。");

    await db`
      INSERT INTO supporter_applications (id, session_id, user_id, user_name, status, created_at)
      VALUES (${id}, ${sessionId}, ${userId}, ${userName}, 'pending', ${createdAt})
    `;
    return { id, sessionId, userId, userName, status: "pending", createdAt };
  }

  const dup = memApplications.find(
    (a) => a.sessionId === sessionId && a.userId === userId && a.status === "pending",
  );
  if (dup) throw new Error("すでにこのセッションに申請済みです。");

  const app: InMemoryApplication = {
    id,
    sessionId,
    userId,
    userName,
    status: "pending",
    createdAt,
    watchTimeHours: memWatchTime.get(userId) ?? 0,
    winCount: memWinCounts.get(userId) ?? 0,
  };
  memApplications.push(app);
  return app;
}

export async function cancelSupporterApplication(
  userId: string,
  sessionId: string,
): Promise<void> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`
      UPDATE supporter_applications
      SET status = 'cancelled'
      WHERE session_id = ${sessionId} AND user_id = ${userId} AND status = 'pending'
    `;
    return;
  }

  const app = memApplications.find(
    (a) => a.sessionId === sessionId && a.userId === userId && a.status === "pending",
  );
  if (app) app.status = "cancelled";
}

export async function listApplicationsForSession(
  sessionId: string,
): Promise<SupporterApplication[]> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const rows = await db`
      SELECT * FROM supporter_applications WHERE session_id = ${sessionId} ORDER BY created_at ASC
    `;
    return rows.map(rowToApplication);
  }

  return memApplications.filter((a) => a.sessionId === sessionId);
}

export async function getMyApplication(
  userId: string,
  sessionId: string,
): Promise<SupporterApplication | null> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    const rows = await db`
      SELECT * FROM supporter_applications
      WHERE session_id = ${sessionId} AND user_id = ${userId}
      ORDER BY created_at DESC LIMIT 1
    `;
    return rows.length > 0 ? rowToApplication(rows[0]) : null;
  }

  return memApplications.findLast((a) => a.sessionId === sessionId && a.userId === userId) ?? null;
}

export async function runSupporterLottery(
  sessionId: string,
  slots: number,
  hostUserId: string,
): Promise<LotteryResult> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();

    // ホスト別の視聴時間・当選回数を使って重み付き抽選
    const rows = await db`
      SELECT sa.user_id,
             COALESCE(uhs.watch_time_hours, 0) AS watch_time_hours,
             COALESCE(uhs.win_count, 0) AS win_count
      FROM supporter_applications sa
      LEFT JOIN user_host_stats uhs
        ON uhs.viewer_user_id = sa.user_id AND uhs.host_user_id = ${hostUserId}
      WHERE sa.session_id = ${sessionId} AND sa.status = 'pending'
    `;

    const candidates: LotteryCandidate[] = rows.map((r) => ({
      userId: r.user_id as string,
      watchTimeHours: Number(r.watch_time_hours ?? 0),
      winCount: Number(r.win_count ?? 0),
    }));

    const winnerIds = drawLottery(candidates, slots);
    const loserIds = candidates.map((c) => c.userId).filter((id) => !winnerIds.includes(id));

    if (winnerIds.length > 0) {
      await db`
        UPDATE supporter_applications
        SET status = 'won'
        WHERE session_id = ${sessionId} AND user_id = ANY(${winnerIds})
      `;
      for (const id of winnerIds) {
        await incrementHostWinCount(id, hostUserId);
      }
    }
    if (loserIds.length > 0) {
      await db`
        UPDATE supporter_applications
        SET status = 'lost'
        WHERE session_id = ${sessionId} AND user_id = ANY(${loserIds})
      `;
    }

    return { sessionId, slots, totalApplicants: candidates.length, winnerIds };
  }

  // In-memory path — hostUserId ベースの視聴時間を使う
  const pending = memApplications.filter(
    (a) => a.sessionId === sessionId && a.status === "pending",
  );
  const { getUserHostStats } = await import("./watchTimeStore");
  const candidates: LotteryCandidate[] = await Promise.all(
    pending.map(async (a) => {
      const stats = await getUserHostStats(a.userId, hostUserId);
      return { userId: a.userId, watchTimeHours: stats.watchTimeHours, winCount: stats.winCount };
    }),
  );

  const winnerIds = drawLottery(candidates, slots);

  for (const app of pending) {
    if (winnerIds.includes(app.userId)) {
      app.status = "won";
      await incrementHostWinCount(app.userId, hostUserId);
    } else {
      app.status = "lost";
    }
  }

  return { sessionId, slots, totalApplicants: pending.length, winnerIds };
}

export async function addWatchTime(userId: string, hours: number): Promise<void> {
  if (USE_NEON) {
    await ensureSchema();
    const db = getDb();
    await db`
      UPDATE users SET watch_time_hours = watch_time_hours + ${hours} WHERE id = ${userId}
    `;
    return;
  }

  memWatchTime.set(userId, (memWatchTime.get(userId) ?? 0) + hours);
}
