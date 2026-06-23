"use client";

// SOLID: S（参加チケットの付与に専念する管理ページ）
import { useCallback, useEffect, useState } from "react";

type Ticket = {
  ticketId: string;
  userId: string;
  scope: "all" | "session";
  sessionId?: string;
  status: "active" | "used";
  createdAt: string;
  usedAt?: string;
  usedSessionId?: string;
};

type UserOption = { id: string; name: string; email: string; role: string };
type SessionOption = { sessionId: string; title: string; startsAt: string; status: string };

function formatStart(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminTicketsPage() {
  const [userId, setUserId] = useState("");
  const [scope, setScope] = useState<"all" | "session">("all");
  const [sessionId, setSessionId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);

  const loadTickets = useCallback(async (uid: string) => {
    if (!uid.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets?userId=${encodeURIComponent(uid.trim())}`);
      const data = (await res.json()) as { tickets?: Ticket[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    }
  }, []);

  // ユーザー一覧・予定枠一覧を取得（選択式の選択肢）
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = (await res.json()) as { users?: UserOption[]; error?: string };
        if (res.ok && data.users) setUsers(data.users);
      } catch {
        // ignore
      }
    })();
    void (async () => {
      try {
        const res = await fetch("/api/stream-sessions?status=prelive,live");
        const data = (await res.json()) as { sessions?: SessionOption[] };
        if (res.ok && data.sessions) setSessions(data.sessions);
      } catch {
        // ignore
      }
    })();
  }, []);

  const grant = async () => {
    setGranting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          scope,
          sessionId: scope === "session" ? sessionId.trim() : undefined,
          quantity,
        }),
      });
      const data = (await res.json()) as { granted?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "付与に失敗しました");
      setMessage(`${data.granted} 枚のチケットを付与しました。`);
      await loadTickets(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "付与に失敗しました");
    } finally {
      setGranting(false);
    }
  };

  const activeCount = tickets?.filter((t) => t.status === "active").length ?? 0;

  return (
    <main className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold">チケット管理</h1>
        <p className="mt-1 text-sm text-white/40">
          参加チケット（スピーカー参加費の支払いをスキップ）を付与します。1枚=1回使い切り。
        </p>

        <div className="mt-6 space-y-4 rounded-2xl bg-white/5 p-6">
          <label className="block">
            <span className="text-sm text-white/60">対象ユーザー</span>
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                if (e.target.value) void loadTickets(e.target.value);
                else setTickets(null);
              }}
              className="mt-1 w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">— ユーザーを選択 —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}（{u.email}）/ {u.role}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-sm text-white/60">種類</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${scope === "all" ? "bg-purple-600 text-white" : "bg-white/10 text-white/60"}`}
              >
                全配信で使える
              </button>
              <button
                type="button"
                onClick={() => setScope("session")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${scope === "session" ? "bg-purple-600 text-white" : "bg-white/10 text-white/60"}`}
              >
                特定の配信のみ
              </button>
            </div>
          </div>

          {scope === "session" && (
            <label className="block">
              <span className="text-sm text-white/60">対象の配信</span>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="mt-1 w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">— 配信を選択 —</option>
                {sessions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.title}（{formatStart(s.startsAt)}{s.status === "live" ? " / 配信中" : ""}）
                  </option>
                ))}
              </select>
              {sessions.length === 0 && (
                <span className="mt-1 block text-xs text-white/30">予定されている枠がありません。</span>
              )}
            </label>
          )}

          <label className="block">
            <span className="text-sm text-white/60">枚数</span>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="mt-1 w-32 rounded-lg bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          {message && <div className="rounded-lg bg-green-500/15 p-3 text-sm text-green-400">{message}</div>}
          {error && <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-400">{error}</div>}

          <button
            onClick={() => void grant()}
            disabled={granting || !userId.trim() || (scope === "session" && !sessionId.trim())}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {granting ? "付与中..." : "チケットを付与"}
          </button>
        </div>

        {tickets && (
          <div className="mt-6 rounded-2xl bg-white/5 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">このユーザーのチケット</h2>
              <span className="text-xs text-white/40">有効 {activeCount} / 全 {tickets.length}</span>
            </div>
            {tickets.length === 0 ? (
              <p className="text-sm text-white/40">チケットはありません。</p>
            ) : (
              <div className="space-y-1.5">
                {tickets.map((t) => (
                  <div key={t.ticketId} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-xs">
                    <span className="text-white/70">
                      {t.scope === "all" ? "全配信" : `特定: ${t.sessionId}`}
                    </span>
                    <span className={t.status === "active" ? "text-green-400" : "text-white/30"}>
                      {t.status === "active" ? "有効" : "使用済み"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
