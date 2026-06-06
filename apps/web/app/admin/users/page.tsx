"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionUser, UserRole } from "../../lib/apiTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

const PAGE_SIZE = 20;

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "banned";
type PendingAction =
  | { type: "ban"; user: SessionUser }
  | { type: "unban"; user: SessionUser }
  | { type: "role"; user: SessionUser; newRole: UserRole };

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  const [detailUser, setDetailUser] = useState<SessionUser | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = (await res.json()) as { users?: SessionUser[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAllUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [search, roleFilter, statusFilter]);

  // Filtered list
  const filtered = allUsers.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "banned" && !u.bannedAt) return false;
    if (statusFilter === "active" && u.bannedAt) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageUsers = filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  async function executeAction(action: PendingAction) {
    setActionLoading(true);
    setActionError(null);
    try {
      const body: Record<string, unknown> = { targetId: action.user.id };
      if (action.type === "ban") body.bannedAt = new Date().toISOString();
      else if (action.type === "unban") body.bannedAt = null;
      else if (action.type === "role") body.role = action.newRole;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: SessionUser; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");

      // Update local state with the returned user
      setAllUsers((prev) =>
        prev.map((u) => (u.id === action.user.id ? (data.user ?? u) : u)),
      );
      // Update detailUser if it's the same user
      if (detailUser?.id === action.user.id && data.user) {
        setDetailUser(data.user);
      }
      setPendingAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">ユーザー管理</h1>
          <p className="mt-0.5 text-xs text-white/40">
            {loading ? "読み込み中..." : `${allUsers.length} 件`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
        >
          更新
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名前・メールで検索..."
          className="flex-1 min-w-48 rounded-xl bg-white/10 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-xl bg-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">すべてのロール</option>
          <option value="vtuber">VTuber</option>
          <option value="listener">リスナー</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl bg-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="banned">BAN済み</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs text-white/40 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">ユーザー</th>
              <th className="px-4 py-3 text-left">メール</th>
              <th className="px-4 py-3 text-left">ロール</th>
              <th className="px-4 py-3 text-left">プラン</th>
              <th className="px-4 py-3 text-left">登録日</th>
              <th className="px-4 py-3 text-left">ステータス</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-white/30">
                  読み込み中...
                </td>
              </tr>
            )}
            {!loading && pageUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-white/30">
                  {filtered.length === 0 && allUsers.length > 0
                    ? "条件に一致するユーザーがいません"
                    : "ユーザーがいません"}
                </td>
              </tr>
            )}
            {pageUsers.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onDetail={() => setDetailUser(u)}
                onAction={setPendingAction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-white/40">
          <span>
            {clampedPage + 1} / {totalPages} ページ（{filtered.length} 件）
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15 disabled:opacity-40"
            >
              ← 前
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15 disabled:opacity-40"
            >
              次 →
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailUser && (
        <DetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}

      {/* Confirm action dialog */}
      {pendingAction && (
        <ConfirmDialog
          action={pendingAction}
          loading={actionLoading}
          error={actionError}
          onConfirm={() => void executeAction(pendingAction)}
          onCancel={() => {
            setPendingAction(null);
            setActionError(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UserRow
// ---------------------------------------------------------------------------

function UserRow({
  user,
  onDetail,
  onAction,
}: {
  user: SessionUser;
  onDetail: () => void;
  onAction: (a: PendingAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isBanned = Boolean(user.bannedAt);

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-white/5"
      onClick={onDetail}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            {user.channelName && (
              <p className="truncate text-[11px] text-white/40">@{user.channelName}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-white/60">{user.email}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${user.plan === "aimer" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/40"}`}>
          {user.plan === "aimer" ? "Aimer" : "Free"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-white/40">{fmt(user.createdAt)}</td>
      <td className="px-4 py-3">
        {isBanned ? (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400">
            BAN
          </span>
        ) : (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-bold text-green-400">
            Active
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/15"
          >
            ⋯
          </button>
          {open && (
            <div className="absolute right-0 top-8 z-50 min-w-40 rounded-xl border border-white/10 bg-[#1a1a2e] py-1 shadow-2xl">
              <button
                type="button"
                onClick={() => { setOpen(false); onDetail(); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5"
              >
                詳細を見る
              </button>
              <div className="my-1 border-t border-white/10" />
              {user.role === "listener" ? (
                <button
                  type="button"
                  onClick={() => { setOpen(false); onAction({ type: "role", user, newRole: "vtuber" }); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5"
                >
                  VTuberに変更
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOpen(false); onAction({ type: "role", user, newRole: "listener" }); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5"
                >
                  リスナーに変更
                </button>
              )}
              <div className="my-1 border-t border-white/10" />
              {isBanned ? (
                <button
                  type="button"
                  onClick={() => { setOpen(false); onAction({ type: "unban", user }); }}
                  className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-white/5"
                >
                  BAN解除
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOpen(false); onAction({ type: "ban", user }); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5"
                >
                  BANする
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// DetailModal
// ---------------------------------------------------------------------------

function DetailModal({ user, onClose }: { user: SessionUser; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#1a1a2e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">ユーザー詳細</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
          >
            閉じる
          </button>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-2xl font-bold text-purple-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold">{user.name}</p>
            {user.channelName && (
              <p className="text-sm text-white/50">@{user.channelName}</p>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <RoleBadge role={user.role} />
              {user.bannedAt && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400">
                  BAN
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <DetailRow label="ユーザーID" value={user.id} mono />
          <DetailRow label="メール" value={user.email} />
          <DetailRow label="プラン" value={user.plan === "aimer" ? "Aimer" : "Free"} />
          <DetailRow label="認証方法" value={user.authProvider} />
          <DetailRow label="登録日" value={fmt(user.createdAt)} />
          {user.lastLoginAt && (
            <DetailRow label="最終ログイン" value={fmt(user.lastLoginAt)} />
          )}
          {user.emailVerifiedAt && (
            <DetailRow label="メール認証" value={fmt(user.emailVerifiedAt)} />
          )}
          {user.bannedAt && (
            <DetailRow label="BAN日時" value={fmt(user.bannedAt)} highlight="red" />
          )}
          {user.bio && (
            <div className="rounded-xl bg-white/5 p-3">
              <p className="mb-1 text-xs text-white/40">自己紹介</p>
              <p className="text-sm text-white/80">{user.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: "red";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-lg px-3 py-2 odd:bg-white/[0.03]">
      <span className="shrink-0 text-xs text-white/40">{label}</span>
      <span
        className={`min-w-0 truncate ${mono ? "font-mono text-xs" : ""} ${highlight === "red" ? "text-red-400" : "text-white/80"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  action,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  action: PendingAction;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isBan = action.type === "ban";
  const isUnban = action.type === "unban";
  const isRole = action.type === "role";

  const title = isBan
    ? "ユーザーをBANしますか？"
    : isUnban
      ? "BAN解除しますか？"
      : `ロールを変更しますか？`;

  const description = isBan
    ? `${action.user.name} をBANします。このユーザーはサービスを利用できなくなります。`
    : isUnban
      ? `${action.user.name} のBANを解除します。`
      : `${action.user.name} のロールを「${(action as { newRole: UserRole }).newRole === "vtuber" ? "VTuber" : "リスナー"}」に変更します。`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#1a1a2e] p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold">{title}</h3>
        <p className="mb-5 text-sm text-white/60">{description}</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm hover:bg-white/15 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
              isBan ? "bg-red-600 hover:brightness-110" : isRole ? "bg-purple-600 hover:brightness-110" : "bg-green-700 hover:brightness-110"
            }`}
          >
            {loading ? "処理中..." : isBan ? "BANする" : isUnban ? "BAN解除" : "変更する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
        role === "vtuber"
          ? "bg-purple-500/20 text-purple-300"
          : "bg-blue-500/20 text-blue-300"
      }`}
    >
      {role === "vtuber" ? "VTuber" : "リスナー"}
    </span>
  );
}
