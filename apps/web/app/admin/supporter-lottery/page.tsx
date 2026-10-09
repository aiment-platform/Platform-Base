"use client";

import { useState } from "react";
import type { SupporterApplication, LotteryResult } from "../../lib/apiTypes";

export default function AdminSupporterLotteryPage() {
  const [sessionId, setSessionId] = useState("");
  const [hostUserId, setHostUserId] = useState("");
  const [slots, setSlots] = useState("5");

  const [applications, setApplications] = useState<SupporterApplication[] | null>(null);
  const [lotteryResult, setLotteryResult] = useState<LotteryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadApplications() {
    const id = sessionId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setLotteryResult(null);
    try {
      const res = await fetch(`/api/admin/supporter-lottery?sessionId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { applications?: SupporterApplication[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setApplications(data.applications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function runLottery() {
    const id = sessionId.trim();
    const host = hostUserId.trim();
    const n = parseInt(slots, 10);
    if (!id || !host || isNaN(n) || n <= 0) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/supporter-lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, hostUserId: host, slots: n }),
      });
      const data = (await res.json()) as { result?: LotteryResult; error?: string };
      if (!res.ok) throw new Error(data.error ?? "抽選に失敗しました。");
      setLotteryResult(data.result ?? null);
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "抽選に失敗しました。");
    } finally {
      setRunning(false);
    }
  }

  const pending = applications?.filter((a) => a.status === "pending") ?? [];
  const won = applications?.filter((a) => a.status === "won") ?? [];
  const lost = applications?.filter((a) => a.status === "lost") ?? [];
  const cancelled = applications?.filter((a) => a.status === "cancelled") ?? [];

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold">サポーター抽選</h1>
      <p className="mb-8 text-sm text-[var(--brand-text-muted)]">申請者の視聴時間を加味した重み付き抽選</p>

      {/* Inputs */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-[var(--brand-text-muted)]">セッション ID</label>
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void loadApplications(); }}
            placeholder="session-xxx"
            className="w-full rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--brand-text-muted)]/60 focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--brand-text-muted)]">ホスト ユーザー ID</label>
          <input
            value={hostUserId}
            onChange={(e) => setHostUserId(e.target.value)}
            placeholder="vtuber-xxx"
            className="w-full rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--brand-text-muted)]/60 focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--brand-text-muted)]">当選枠数</label>
          <input
            type="number"
            min={1}
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            className="w-full rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void loadApplications()}
          disabled={loading || !sessionId.trim()}
          className="ui-btn ui-btn-md ui-btn-ghost"
        >
          {loading ? "読み込み中..." : "申請者を確認"}
        </button>
        <button
          type="button"
          onClick={() => void runLottery()}
          disabled={running || !sessionId.trim() || !hostUserId.trim() || pending.length === 0}
          className="ui-btn ui-btn-md ui-btn-primary"
        >
          {running ? "抽選中..." : `抽選実行（申請者 ${pending.length} 名）`}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-[var(--brand-accent)]/15 px-4 py-3 text-sm text-[var(--brand-accent)]">{error}</div>
      )}

      {/* Lottery result banner */}
      {lotteryResult && (
        <div className="mb-6 rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 px-5 py-4">
          <p className="font-semibold text-[var(--brand-primary)]">抽選完了</p>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            申請 {lotteryResult.totalApplicants} 名 → 当選 {lotteryResult.winnerIds.length} 名
          </p>
        </div>
      )}

      {/* Applications list */}
      {applications !== null && (
        <div className="space-y-5">
          {[
            { label: "当選", items: won, color: "bg-green-500/20 text-green-600" },
            { label: "申請中（未抽選）", items: pending, color: "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]" },
            { label: "落選", items: lost, color: "bg-black/[0.06] text-[var(--brand-text-muted)]" },
            { label: "キャンセル", items: cancelled, color: "bg-black/[0.04] text-[var(--brand-text-muted)]/70" },
          ].map(({ label, items, color }) =>
            items.length > 0 ? (
              <section key={label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-text-muted)]">{label} ({items.length})</p>
                <div className="space-y-1.5">
                  {items.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-sm font-bold">
                        {a.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.userName}</p>
                        <p className="font-mono text-[10px] text-[var(--brand-text-muted)]">{a.userId}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${color}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          )}
          {applications.length === 0 && (
            <p className="rounded-xl bg-black/[0.03] px-4 py-8 text-center text-sm text-[var(--brand-text-muted)]">
              このセッションへの申請はありません。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
