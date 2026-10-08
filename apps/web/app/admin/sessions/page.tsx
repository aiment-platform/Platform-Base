"use client";

import { useCallback, useEffect, useState } from "react";
import type { StreamSession, StreamSessionStatus } from "../../lib/apiTypes";

const TABS: { status: StreamSessionStatus; label: string }[] = [
  { status: "live", label: "配信中" },
  { status: "prelive", label: "配信予定" },
  { status: "ended", label: "終了" },
];

// 予定時間を過ぎてもこれだけ「配信中」のままなら、ホストが終了し忘れた可能性が高い
const STALE_GRACE_MS = 3 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isStale(session: StreamSession) {
  const plannedEnd = new Date(session.startsAt).getTime() + (session.plannedDurationMin ?? 60) * 60 * 1000;
  return session.status === "live" && Date.now() > plannedEnd + STALE_GRACE_MS;
}

export default function AdminSessionsPage() {
  const [tab, setTab] = useState<StreamSessionStatus>("live");
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status: StreamSessionStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sessions?status=${status}`, { cache: "no-store" });
      const data = (await res.json()) as { sessions?: StreamSession[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  async function runAction(session: StreamSession, action: "end" | "delete") {
    const message =
      action === "end"
        ? `「${session.title}」を強制終了しますか？\n配信中の参加者は入室できなくなります。`
        : `「${session.title}」を削除しますか？\n予約はすべてキャンセルされ、元に戻せません。`;
    if (!window.confirm(message)) return;

    setBusyId(session.sessionId);
    setError(null);
    try {
      const path = `/api/admin/sessions/${encodeURIComponent(session.sessionId)}`;
      const res =
        action === "end" ? await fetch(`${path}/end`, { method: "POST" }) : await fetch(path, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await load(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold">セッション管理</h1>
      <p className="mb-6 text-sm text-[var(--brand-text-muted)]">
        全VTuberの配信枠を確認し、終了し忘れた配信の強制終了や、不要な枠の削除ができます。
      </p>

      <div className="mb-6 flex gap-1 rounded-xl bg-black/[0.04] p-1 sm:w-fit">
        {TABS.map(({ status, label }) => (
          <button
            key={status}
            type="button"
            onClick={() => setTab(status)}
            className={`flex-1 rounded-lg px-4 py-1.5 text-sm transition-colors sm:flex-none ${
              tab === status
                ? "bg-[var(--brand-surface)] font-semibold text-[var(--brand-text)] shadow-sm"
                : "text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-[var(--brand-accent)]/15 px-4 py-3 text-sm text-[var(--brand-accent)]">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--brand-text-muted)]">読み込み中...</p>
      ) : sessions.length === 0 ? (
        <p className="rounded-xl bg-black/[0.04] px-4 py-8 text-center text-sm text-[var(--brand-text-muted)]">
          該当する配信枠はありません。
        </p>
      ) : (
        <div className="space-y-1.5">
          {sessions.map((session) => (
            <SessionRow
              key={session.sessionId}
              session={session}
              busy={busyId === session.sessionId}
              onEnd={() => void runAction(session, "end")}
              onDelete={() => void runAction(session, "delete")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({
  session,
  busy,
  onEnd,
  onDelete,
}: {
  session: StreamSession;
  busy: boolean;
  onEnd: () => void;
  onDelete: () => void;
}) {
  const stale = isStale(session);
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center ${
        stale ? "bg-[var(--brand-accent)]/10 ring-1 ring-[var(--brand-accent)]/40" : "bg-black/[0.04]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{session.title}</p>
          {stale && (
            <span className="shrink-0 rounded-full bg-[var(--brand-accent)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-accent)]">
              終了し忘れの可能性
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">
          {session.hostChannelName || session.hostName} ・ 開始 {formatDate(session.startsAt)}
          {session.plannedDurationMin ? ` ・ 予定 ${session.plannedDurationMin}分` : ""}
        </p>
        <p className="font-mono text-[10px] text-[var(--brand-text-muted)]">{session.sessionId}</p>
      </div>
      <div className="shrink-0">
        {session.status === "live" ? (
          <button type="button" onClick={onEnd} disabled={busy} className="ui-btn ui-btn-md ui-btn-primary">
            {busy ? "処理中..." : "強制終了"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-xl bg-[var(--brand-accent)]/15 px-4 py-2 text-sm font-semibold text-[var(--brand-accent)] transition hover:bg-[var(--brand-accent)]/25 disabled:opacity-50"
          >
            {busy ? "処理中..." : "削除"}
          </button>
        )}
      </div>
    </div>
  );
}
