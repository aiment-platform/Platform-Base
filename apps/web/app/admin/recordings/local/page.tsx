"use client";

/**
 * 管理者のブラウザで配信を録画して、この PC（SSD など、選んだフォルダ）に保存する画面。
 * 録画の中身は localRecorder.ts。ここは「保存先を選ぶ → 配信を選ぶ → 録画の様子を見せる」だけ。
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, FolderOpenIcon, StopIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import type { StreamSession } from "../../../lib/apiTypes";
import {
  canPickDirectory,
  ESTIMATED_GB_PER_HOUR,
  KIND_LABEL,
  LocalSessionRecorder,
  pickDirectory,
  type DirectoryHandle,
  type RecorderState,
} from "./localRecorder";

const PHASE_LABEL: Record<RecorderState["phase"], string> = {
  connecting: "配信に接続中...",
  "waiting-video": "OBS の映像を待っています",
  recording: "録画中",
  stopping: "ファイルを確定しています...",
  done: "保存しました",
  error: "エラーで止まりました",
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(total / 3600)}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}

type WakeLockSentinelLike = { release(): Promise<void> };

export default function LocalRecordingPage() {
  const [dir, setDir] = useState<DirectoryHandle | null>(null);
  const [supportsDir, setSupportsDir] = useState(true);
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<StreamSession | null>(null);
  const [state, setState] = useState<RecorderState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const recorderRef = useRef<LocalSessionRecorder | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const isBusy = state !== null && state.phase !== "done" && state.phase !== "error";

  useEffect(() => {
    setSupportsDir(canPickDirectory());
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/sessions?status=live", { cache: "no-store" });
      const data = (await res.json()) as { sessions?: StreamSession[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  // 経過時間の表示を 1 秒ごとに進める
  useEffect(() => {
    if (state?.phase !== "recording") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state?.phase]);

  // 録画中にタブを閉じようとしたら止める（閉じると最後の区切りが保存されない）
  useEffect(() => {
    if (!isBusy) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isBusy]);

  // 録画中は画面を消さない（スリープすると録画が止まる）。タブが前面にある間だけ効く
  useEffect(() => {
    if (!isBusy) return;
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;
    let cancelled = false;
    const acquire = () => {
      void nav.wakeLock!
        .request("screen")
        .then((lock) => {
          if (cancelled) void lock.release();
          else wakeLockRef.current = lock;
        })
        .catch(() => undefined);
    };
    acquire();
    // タブを裏に回すと解除されるので、戻ってきたら取り直す
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
    };
  }, [isBusy]);

  // ページを離れるときは、書けたところまで確定させる
  useEffect(() => {
    return () => {
      void recorderRef.current?.stop();
    };
  }, []);

  async function chooseDirectory() {
    setError(null);
    try {
      setDir(await pickDirectory());
    } catch (err) {
      // 選ぶ画面を閉じただけなら何もしない
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "フォルダを選べませんでした");
    }
  }

  async function startRecording(session: StreamSession) {
    setError(null);
    if (supportsDir && !dir) {
      setError("先に保存先フォルダを選んでください。");
      return;
    }
    try {
      const res = await fetch("/api/admin/recordings/local-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      const data = (await res.json()) as { token?: string; livekitUrl?: string; error?: string };
      if (!res.ok || !data.token || !data.livekitUrl) throw new Error(data.error ?? "録画用の鍵を取得できませんでした");

      const recorder = new LocalSessionRecorder({
        url: data.livekitUrl,
        token: data.token,
        title: session.title,
        dir,
        preview: previewRef.current,
        onChange: setState,
      });
      recorderRef.current = recorder;
      setActiveSession(session);
      await recorder.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "録画を始められませんでした");
      void recorderRef.current?.stop();
    }
  }

  async function stopRecording() {
    if (!window.confirm("録画を止めますか？")) return;
    await recorderRef.current?.stop();
  }

  const elapsed = state?.startedAt ? now - state.startedAt : 0;

  return (
    <div className="px-4 py-6 sm:p-8">
      <Link href="/admin/recordings" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--brand-text-muted)]">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        録画一覧
      </Link>
      <h1 className="mb-1 text-2xl font-bold">PC に録画</h1>
      <p className="mb-6 text-sm text-[var(--brand-text-muted)]">
        このブラウザが見えない視聴者として配信に入り、「全部入り」と「VTuberのみ」を録画して、この PC に保存します。
        録画中はこのタブを開いたままにしてください。
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{error}</div>
      )}

      {/* 1. 保存先 */}
      <section className="mb-4 rounded-xl bg-[var(--brand-surface)] px-4 py-3">
        <p className="mb-2 text-sm font-semibold">1. 保存先</p>
        {supportsDir ? (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void chooseDirectory()} disabled={isBusy} className="ui-btn ui-btn-md ui-btn-ghost gap-1.5">
              <FolderOpenIcon className="h-4 w-4" aria-hidden />
              {dir ? "フォルダを変える" : "フォルダを選ぶ（SSD など）"}
            </button>
            <span className="text-sm">{dir ? `📁 ${dir.name}` : "未選択"}</span>
          </div>
        ) : (
          <p className="text-sm text-[var(--brand-text-muted)]">
            このブラウザではフォルダを選べません。録画は区切りごとに「ダウンロード」フォルダへ保存されます
            （保存先はブラウザの設定で変えられます）。Chrome なら SSD などのフォルダへ直接保存できます。
          </p>
        )}
        <p className="mt-2 text-xs text-[var(--brand-text-muted)]">
          容量の目安: 1 時間で 1 本あたり約 {ESTIMATED_GB_PER_HOUR.toFixed(1)}GB、2 本で約 {(ESTIMATED_GB_PER_HOUR * 2).toFixed(1)}GB。
          30 分ごとにファイルを区切ります。
        </p>
      </section>

      {/* 2. 配信を選ぶ */}
      <section className="mb-4 rounded-xl bg-[var(--brand-surface)] px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">2. 録画する配信（配信中のみ）</p>
          <button type="button" onClick={() => void loadSessions()} disabled={loadingSessions} className="ui-btn ui-btn-sm ui-btn-ghost">
            {loadingSessions ? "読み込み中..." : "更新"}
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--brand-text-muted)]">いま配信中の枠はありません。</p>
        ) : (
          <ul className="space-y-1.5">
            {sessions.map((session) => (
              <li key={session.sessionId} className="flex flex-col gap-2 rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{session.title}</p>
                  <p className="text-xs text-[var(--brand-text-muted)]">{session.hostChannelName || session.hostName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void startRecording(session)}
                  disabled={isBusy}
                  className="ui-btn ui-btn-sm ui-btn-primary shrink-0 gap-1.5"
                >
                  <VideoCameraIcon className="h-4 w-4" aria-hidden />
                  録画開始
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. 録画の様子。preview の video は録画開始前から置いておく（録画側が映像をつなぐため） */}
      <section className={`rounded-xl bg-[var(--brand-surface)] px-4 py-3 ${state ? "" : "hidden"}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{activeSession?.title}</p>
            <p className="text-xs text-[var(--brand-text-muted)]">
              {state ? PHASE_LABEL[state.phase] : ""}
              {state?.phase === "recording" ? ` ・ ${formatElapsed(elapsed)}` : ""}
              {state ? ` ・ 音声 ${state.audioSources} 本` : ""}
              {state?.mimeType ? ` ・ ${state.mimeType.split(";")[0]}` : ""}
            </p>
          </div>
          {isBusy && (
            <button type="button" onClick={() => void stopRecording()} disabled={state?.phase === "stopping"} className="ui-btn ui-btn-md ui-btn-danger gap-1.5">
              <StopIcon className="h-4 w-4" aria-hidden />
              録画を止める
            </button>
          )}
        </div>
        {state?.error && <p className="mb-2 break-all text-xs text-[var(--brand-accent-ink)]">{state.error}</p>}
        <video ref={previewRef} autoPlay playsInline muted className="mb-3 aspect-video w-full max-w-xl rounded-lg bg-black" />
        <ul className="space-y-1 text-xs">
          {state?.parts.map((part) => (
            <li key={part.name} className="flex justify-between gap-3">
              <span className="truncate">
                {part.done ? "✅" : "⏺"} {KIND_LABEL[part.kind]} ・ {part.name}
              </span>
              <span className="shrink-0 tabular-nums">{formatBytes(part.bytes)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
