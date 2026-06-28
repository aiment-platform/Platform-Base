"use client";

import { useCallback, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import { useI18n } from "../../../lib/i18n";

export type Diagnostics = Record<string, string | number | boolean | null>;

type CheckItem = { label: string; ok: boolean; hint?: string };

type Props = {
  sessionId: string;
  // 現在の配信状態から診断値を集める。送信時にも最新値を取得する。
  collect: () => { diagnostics: Diagnostics; checks: CheckItem[] };
};

export function TroubleshootPanel({ sessionId, collect }: Props) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ diagnostics: Diagnostics; checks: CheckItem[] } | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = useCallback(() => {
    setResult(collect());
    setSent(false);
    setError(null);
  }, [collect]);

  const send = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      const snapshot = collect();
      const res = await fetch("/api/monitoring/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, note, diagnostics: snapshot.diagnostics }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? tx("送信に失敗しました。", "Failed to send."));
        return;
      }
      setSent(true);
      setNote("");
    } catch {
      setError(tx("通信エラーが発生しました。", "A network error occurred."));
    } finally {
      setSending(false);
    }
  }, [collect, sessionId, note, tx]);

  return (
    <div className="rounded-2xl bg-[var(--brand-surface)] p-3 shadow-lg shadow-black/25">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && !result) runDiagnostics();
        }}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--brand-text)]">
          <WrenchScrewdriverIcon className="h-4 w-4 text-[var(--brand-primary)]" />
          {tx("トラブルシューティング", "Troubleshooting")}
        </span>
        <span className="text-xs text-[var(--brand-text-muted)]">{open ? tx("閉じる", "Close") : tx("開く", "Open")}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--brand-text-muted)]">
              {tx("音声・映像・接続の状態を確認します。", "Check audio, video and connection status.")}
            </p>
            <button
              type="button"
              onClick={runDiagnostics}
              className="rounded-lg bg-[var(--brand-bg-900)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
            >
              {tx("再診断", "Re-run")}
            </button>
          </div>

          {result && (
            <div className="space-y-1.5">
              {result.checks.map((c) => (
                <div
                  key={c.label}
                  className="flex items-start gap-2 rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 text-xs"
                >
                  {c.ok ? (
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" />
                  )}
                  <span className="min-w-0">
                    <span className={c.ok ? "text-[var(--brand-text)]" : "text-[var(--brand-accent)]"}>{c.label}</span>
                    {!c.ok && c.hint && (
                      <span className="mt-0.5 block text-[var(--brand-text-muted)]">{c.hint}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={tx("症状や状況を記入（任意）", "Describe the issue (optional)")}
            className="w-full rounded-lg bg-[var(--brand-bg-900)] px-3 py-2 text-xs text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />

          {error && <p className="text-xs text-[var(--brand-accent)]">{error}</p>}
          {sent && <p className="text-xs text-green-400">{tx("運営に送信しました。", "Sent to the operators.")}</p>}

          <button
            type="button"
            onClick={() => void send()}
            disabled={sending}
            className="w-full rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? tx("送信中...", "Sending...") : tx("診断結果を運営に送信", "Send report to operators")}
          </button>
        </div>
      )}
    </div>
  );
}
