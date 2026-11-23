"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

/** サーバーの SessionRecording と同じ形（app/lib/server/recordingStore.ts） */
type Recording = {
  egressId: string;
  sessionId: string;
  kind: "full" | "vtuber";
  status: "recording" | "ready" | "failed";
  sessionTitle: string;
  hostName: string;
  startedAt: string;
  endedAt?: string;
  sizeBytes?: number;
  durationSec?: number;
  error?: string;
};

const KIND_LABEL: Record<Recording["kind"], { label: string; hint: string }> = {
  full: { label: "全部入り", hint: "VTuber＋話した視聴者の声" },
  vtuber: { label: "VTuberのみ", hint: "視聴者の声なし" },
};

const STATUS_LABEL: Record<Recording["status"], string> = {
  recording: "録画中・書き出し中",
  ready: "ダウンロード可",
  failed: "失敗",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDuration(sec?: number) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function formatSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
}

type SessionGroup = { sessionId: string; title: string; hostName: string; startedAt: string; recordings: Recording[] };

/** 1 回の配信にまとめる（回線切替で VTuber のみの録画が複数本になることがある） */
function groupBySession(recordings: Recording[]): SessionGroup[] {
  const groups = new Map<string, SessionGroup>();
  for (const recording of recordings) {
    const group = groups.get(recording.sessionId);
    if (group) {
      group.recordings.push(recording);
      if (recording.startedAt < group.startedAt) group.startedAt = recording.startedAt;
    } else {
      groups.set(recording.sessionId, {
        sessionId: recording.sessionId,
        title: recording.sessionTitle,
        hostName: recording.hostName,
        startedAt: recording.startedAt,
        recordings: [recording],
      });
    }
  }
  for (const group of groups.values()) {
    group.recordings.sort((a, b) => (a.kind === b.kind ? (a.startedAt < b.startedAt ? -1 : 1) : a.kind === "full" ? -1 : 1));
  }
  return Array.from(groups.values()).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/recordings", { cache: "no-store" });
      const data = (await res.json()) as { recordings?: Recording[]; configured?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRecordings(data.recordings ?? []);
      setConfigured(data.configured !== false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => groupBySession(recordings), [recordings]);

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold">録画</h1>
          <p className="text-sm text-[var(--brand-text-muted)]">
            クラウド録画（R2）の一覧です。「全部入り」と「VTuberのみ」をダウンロードできます（管理者のみ）。
            <br />
            この PC に直接保存するときは「PC に録画」から、配信中に録画を始めてください。
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/recordings/local" className="ui-btn ui-btn-md ui-btn-primary gap-1.5">
            <ComputerDesktopIcon className="h-4 w-4" aria-hidden />
            PC に録画
          </Link>
          <button type="button" onClick={() => void load()} disabled={loading} className="ui-btn ui-btn-md ui-btn-ghost gap-1.5">
            <ArrowPathIcon className="h-4 w-4" aria-hidden />
            {loading ? "読み込み中..." : "更新"}
          </button>
        </div>
      </div>

      {!configured && (
        <div className="mb-4 rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">
          クラウド録画は未設定のため、配信は自動では録画されません（R2_RECORDINGS_BUCKET などの環境変数で有効になります）。
          いまは「PC に録画」を使ってください。
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{error}</div>
      )}

      {!loading && groups.length === 0 ? (
        <p className="ui-panel px-4 py-8 text-center text-sm text-[var(--brand-text-muted)]">録画はまだありません。</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <section key={group.sessionId} className="rounded-xl bg-[var(--brand-surface)] px-4 py-3">
              <p className="truncate text-sm font-semibold">{group.title || group.sessionId}</p>
              <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">
                {group.hostName} ・ {formatDate(group.startedAt)}
              </p>
              <ul className="mt-3 space-y-1.5">
                {group.recordings.map((recording) => (
                  <RecordingRow key={recording.egressId} recording={recording} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordingRow({ recording }: { recording: Recording }) {
  const kind = KIND_LABEL[recording.kind];
  const meta = [formatDuration(recording.durationSec), formatSize(recording.sizeBytes)].filter(Boolean).join(" ・ ");
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{kind.label}</span>
          <span className="ml-2 text-xs text-[var(--brand-text-muted)]">{kind.hint}</span>
        </p>
        <p className="text-xs text-[var(--brand-text-muted)]">
          {formatDate(recording.startedAt)}〜 ・ {STATUS_LABEL[recording.status]}
          {meta ? ` ・ ${meta}` : ""}
        </p>
        {recording.status === "failed" && recording.error && (
          <p className="mt-0.5 break-all text-xs text-[var(--brand-accent-ink)]">{recording.error}</p>
        )}
      </div>
      {recording.status === "ready" && (
        // 管理者確認のうえ、数分だけ有効なリンクへ転送される（app/api/admin/recordings/[egressId]/download）
        <a
          href={`/api/admin/recordings/${encodeURIComponent(recording.egressId)}/download`}
          className="ui-btn ui-btn-sm ui-btn-primary shrink-0 gap-1.5"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
          ダウンロード
        </a>
      )}
    </li>
  );
}
