"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/solid";
import { formatSessionStartTime, getAjlInfo } from "../../lib/ajl";
import { useI18n } from "../../lib/i18n";
import { categoryLabel } from "../../lib/labels";
import { deleteStreamSession, listMyStreamSessions, type StreamSession } from "../../lib/streamSessions";
import { buttonClassName } from "../ui/Button";
import { TimeZoneNote } from "../ui/TimeZoneNote";

const STATUS_LABEL: Record<StreamSession["status"], { jp: string; en: string }> = {
  prelive: { jp: "待機中", en: "Ready" },
  live: { jp: "配信中", en: "Live" },
  ended: { jp: "終了", en: "Ended" },
};

const STATUS_COLOR: Record<StreamSession["status"], string> = {
  prelive: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]",
  live: "bg-[var(--brand-accent-soft)] text-[var(--brand-accent-ink)]",
  ended: "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)]",
};

type MySessionsManagerProps = {
  title?: string;
  description?: string;
  showCreateButton?: boolean;
  framed?: boolean;
};

export function MySessionsManager({ title, description, showCreateButton = true, framed = true }: MySessionsManagerProps) {
  const { tx } = useI18n();
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // 「…」メニューは外側を押すか Esc で閉じる
  useEffect(() => {
    if (!menuFor) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.target instanceof Element && event.target.closest("[data-row-menu]")) return;
      setMenuFor(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuFor]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyStreamSessions();
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) setError(tx("枠一覧の取得に失敗しました。", "Failed to load sessions."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tx]);

  async function handleDelete(sessionId: string) {
    setMenuFor(null);
    if (!confirm(tx("この枠を削除しますか？取り消しできません。", "Delete this session? This cannot be undone."))) return;
    setDeletingId(sessionId);
    const ok = await deleteStreamSession(sessionId);
    setDeletingId(null);
    if (ok) {
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } else {
      setError(tx("削除に失敗しました。", "Failed to delete session."));
    }
  }

  return (
    <section className={framed ? "ui-card p-5" : ""}>
      {/* スマホでは見出しとボタンを横に並べると「+ 新しい枠を作成」が2行に折れるので縦に積む */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{title ?? tx("配信枠管理", "My Sessions")}</h2>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{description ?? tx("作成した配信枠の編集・削除・開始ができます。", "Edit, delete, or start your stream sessions.")}</p>
          <TimeZoneNote className="mt-2" />
        </div>
        {showCreateButton && (
          <Link
            href="/studio/pre-live"
            className={`${buttonClassName({ variant: "primary", size: "md" })} shrink-0 self-start whitespace-nowrap sm:self-auto`}
          >
            {tx("+ 新しい枠を作成", "+ New Session")}
          </Link>
        )}
      </div>

      {error && <div className="mb-4 rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{error}</div>}

      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--brand-text-muted)]">{tx("読み込み中...", "Loading...")}</div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--brand-text-muted)]">{tx("まだ配信枠がありません。", "No sessions yet.")}</p>
          <Link href="/studio/pre-live" className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--brand-primary)] hover:underline">
            <span>{tx("最初の枠を作成する", "Create your first session")}</span>
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : (
        // 白いパネルの中では区切り線の行、灰色の背景の上では白いカード（どちらも灰色のボタンが沈まない）
        <div className={framed ? "divide-y divide-[var(--line)]" : "space-y-3"}>
          {sessions.map((session) => {
            const ajl = getAjlInfo(session.japaneseLevel);
            return (
            // スマホ: 1段目にサムネイル＋情報、2段目に操作ボタン（w-full で必ず改行させる）。
            // PC: 1行に並べる。
            // 枠付き（白いパネルの中）では行をカードにしない。ver0.4 では .ui-card に縁が付き、
            // 区切り線と重なって二重線になるため
            <div key={session.sessionId} className={`flex flex-wrap items-start gap-3 sm:flex-nowrap sm:items-center sm:gap-4 ${framed ? "py-4" : "ui-card p-4"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={session.thumbnail} alt={session.title} className="aspect-video w-24 flex-shrink-0 rounded-lg object-cover sm:w-28" />

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_COLOR[session.status]}`}>
                    {tx(STATUS_LABEL[session.status].jp, STATUS_LABEL[session.status].en)}
                  </span>
                  <span className="whitespace-nowrap rounded-md bg-[var(--brand-bg-900)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-text)]">
                    {formatSessionStartTime(session.startsAt)}
                  </span>
                  <span className="whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-black text-[var(--brand-text)]" style={{ background: ajl.color }}>
                    AJL {ajl.level}
                  </span>
                  <span className="text-[11px] text-[var(--brand-text-muted)]">{categoryLabel(session.category, tx)}</span>
                </div>
                <p className="line-clamp-2 break-words font-semibold">{session.title}</p>
                {/* 項目ごとに塊にして折り返す。日付は上の開始日時の札だけにする（作成日まで出すと同じ日付が2回並んで見える） */}
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-[var(--brand-text-muted)]">
                  <span className="whitespace-nowrap">{tx("参加枠", "Spots")}: {session.speakerSlotsLeft}/{session.speakerSlotsTotal}</span>
                  <span className="whitespace-nowrap">JF {ajl.jfStandard}</span>
                </p>
              </div>

              <div className="flex w-full flex-shrink-0 items-center justify-end gap-2 sm:w-auto">
                {session.status === "live" && (
                  <Link
                    href={`/studio/live/${encodeURIComponent(session.sessionId)}`}
                    className={buttonClassName({ variant: "primary", size: "sm" })}
                  >
                    {tx("配信スタジオへ", "Go to Studio")}
                  </Link>
                )}
                {session.status === "prelive" && (
                  <Link
                    href={`/studio/live/${encodeURIComponent(session.sessionId)}`}
                    className={buttonClassName({ variant: "primary", size: "sm" })}
                  >
                    {tx("配信開始", "Go Live")}
                  </Link>
                )}
                {session.status !== "live" && (
                  <Link
                    href={`/studio/sessions/${encodeURIComponent(session.sessionId)}/edit`}
                    className={buttonClassName({ variant: "ghost", size: "sm" })}
                  >
                    {tx("編集", "Edit")}
                  </Link>
                )}
                {/* 削除は取り消せないので、行に赤いボタンを並べず「…」の中に置く */}
                {session.status !== "live" && (
                  <div className="relative" data-row-menu>
                    <button
                      type="button"
                      onClick={() => setMenuFor((current) => (current === session.sessionId ? null : session.sessionId))}
                      aria-haspopup="menu"
                      aria-expanded={menuFor === session.sessionId}
                      aria-label={tx("その他の操作", "More actions")}
                      className="ui-btn ui-btn-sm ui-btn-ghost ui-btn-square"
                    >
                      <EllipsisHorizontalIcon className="h-4 w-4" aria-hidden />
                    </button>
                    {menuFor === session.sessionId ? (
                      <div role="menu" className="ui-float absolute right-0 top-full z-20 mt-2 w-40 p-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleDelete(session.sessionId)}
                          disabled={deletingId === session.sessionId}
                          className="ui-menu-item text-sm text-[var(--brand-accent-ink)]"
                        >
                          {deletingId === session.sessionId ? tx("削除中...", "Deleting...") : tx("枠を削除", "Delete session")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
