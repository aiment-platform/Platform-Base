"use client";

/**
 * マイチケット：自分が予約した配信枠の一覧。
 *
 * 見やすくするための工夫
 *   - 「いま入れる」（配信中）を、いちばん上に別の段で出す。押すのは「今すぐ入る」だけ
 *   - これからの枠は、日ごと（今日 / 明日 / 11/02 (月)）に見出しを付けて、開始の早い順に並べる
 *   - 半券に日時と「あと何時間」を出す（1分ごとに更新）
 *   - 開始15分前からは「まもなく」として、マイクの確認へ案内する
 *   - 予定をカレンダーに入れられる（.ics ファイル）
 *   - キャンセルは2回押し（1回目で「本当に？」に変わる）。押し間違いで予約が消えないように
 *   - 終わった枠は「過去」のタブへ。同じ配信者の次の予定へ飛べる
 * 半券の色は join ページと同じ（これから＝紫 / 配信中＝赤 / 終了＝灰色）。
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDaysIcon, TicketIcon } from "@heroicons/react/24/outline";
import { TopNav } from "../components/home/TopNav";
import { useRouteTransition } from "../components/ui/RouteTransition";
import { Ticket } from "../components/ui/Ticket";
import { getStartState, startStateLabel, type StartState } from "../join/[sessionId]/JoinHero";
import type { Reservation, StreamSession } from "../lib/apiTypes";
import { getAjlInfo } from "../lib/ajl";
import { useI18n } from "../lib/i18n";
import { cancelReservation, listMyReservations, subscribeReservations } from "../lib/reservations";
import { getStreamSession } from "../lib/streamSessions";
import { formatInTimeZone, timeZoneLabel, useViewerTimeZone } from "../lib/timezone";
import { useUserSession } from "../lib/userSession";

type Entry = { reservation: Reservation; session: StreamSession; start: StartState };
type Tab = "upcoming" | "past";

/** 開始15分前からは「まもなく」として扱い、マイクの確認へ案内する */
const SOON_MINUTES = 15;

function isSoon(start: StartState) {
  return start.kind === "soon" || (start.kind === "upcoming" && start.days === 0 && start.hours === 0 && start.minutes <= SOON_MINUTES);
}

function stubColor(start: StartState) {
  if (start.kind === "live") return "var(--brand-accent)";
  if (start.kind === "ended") return "var(--brand-text-muted)";
  return "var(--brand-primary)";
}

/** カレンダー用の .ics を作ってダウンロードさせる（Google カレンダーやスマホの標準カレンダーで開ける） */
function downloadIcs(session: StreamSession) {
  const start = new Date(session.startsAt);
  const end = new Date(start.getTime() + (session.plannedDurationMin ?? 60) * 60_000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = `${window.location.origin}/join/${encodeURIComponent(session.sessionId)}`;
  // 改行やカンマは .ics の書式で特別な意味を持つので、文字として書く
  const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//aiment//tickets//JA",
    "BEGIN:VEVENT",
    `UID:${session.sessionId}@aiment`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${session.title} — ${session.hostChannelName ?? session.hostName}`)}`,
    `DESCRIPTION:${escape(url)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `aiment-${session.sessionId}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function AjlSquare({ level }: { level?: number }) {
  const ajl = getAjlInfo(level);
  return (
    <span
      className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] text-[10px] font-black leading-none"
      style={{ background: ajl.color, color: ajl.inkColor }}
      aria-label={`AJL ${ajl.level}`}
    >
      {ajl.level}
    </span>
  );
}

function TicketRow({
  entry,
  timeZone,
  onCancel,
}: {
  entry: Entry;
  timeZone: string | undefined;
  onCancel?: (reservationId: string) => Promise<void>;
}) {
  const { tx } = useI18n();
  const { navigate } = useRouteTransition();
  const { session, reservation, start } = entry;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const ended = start.kind === "ended";
  const live = start.kind === "live";
  const soon = isSoon(start);
  const joinHref = `/join/${encodeURIComponent(session.sessionId)}`;

  // 「本当にキャンセル？」は、4秒たったら元に戻す
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <Ticket
      stubColor={stubColor(start)}
      stubWidth="clamp(92px, 22%, 132px)"
      cutout="var(--bg)"
      notch={18}
      className={ended ? "opacity-70" : ""}
      stub={
        <div className="grid gap-0.5 px-2 py-3 text-center">
          <p className="text-xl font-black leading-none sm:text-2xl">{formatInTimeZone(session.startsAt, timeZone, { month: "2-digit", day: "2-digit" })}</p>
          <p className="text-sm font-black opacity-90">{formatInTimeZone(session.startsAt, timeZone, { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="mt-1 text-[10px] font-black leading-tight opacity-85">{startStateLabel(start, tx)}</p>
        </div>
      }
    >
      {/* スマホでは本体の幅が 230px ほどしかない。ボタンを横に並べるとタイトルが数文字で切れるので、
          ボタンは下に回して横幅いっぱいにし、タイトルは2行まで出す */}
      <div className="flex h-full flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <button type="button" onClick={() => navigate(joinHref)} className="hidden shrink-0 sm:block" tabIndex={-1} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={session.thumbnail} alt="" className="aspect-video w-28 rounded-lg object-cover" />
        </button>
        <div className="min-w-0 flex-1">
          <Link href={joinHref} className="line-clamp-2 text-sm font-black text-[var(--brand-text)] hover:text-[var(--brand-primary-ink)] sm:block sm:truncate">
            {session.title}
          </Link>
          <div className="mt-1 flex min-w-0 items-center gap-2 text-xs font-bold text-[var(--brand-text-muted)]">
            <AjlSquare level={session.japaneseLevel} />
            <span className="truncate">{session.hostChannelName ?? session.hostName}</span>
          </div>
          {/* 二次的な操作は、文字のリンクにして小さく */}
          {/* 文字のリンクでも、上下に余白を足して指で押せる高さ（約 32px）にする */}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs font-bold [&>*]:py-2 sm:mt-2 sm:[&>*]:py-0.5">
            {ended ? (
              <Link href={`/channels/${encodeURIComponent(session.hostUserId)}/schedule`} className="text-[var(--brand-primary-ink)] hover:underline">
                {tx("この配信者の次の予定", "Next from this host")}
              </Link>
            ) : (
              <>
                {live ? null : (
                  <button type="button" onClick={() => downloadIcs(session)} className="inline-flex items-center gap-1 whitespace-nowrap text-[var(--brand-primary-ink)] hover:underline">
                    <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden />
                    {tx("カレンダーに追加", "Add to calendar")}
                  </button>
                )}
                {onCancel && !live ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirming) {
                        setConfirming(true);
                        return;
                      }
                      setBusy(true);
                      try {
                        await onCancel(reservation.reservationId);
                      } finally {
                        setBusy(false);
                        setConfirming(false);
                      }
                    }}
                    className={confirming ? "text-[var(--brand-accent-ink)] underline" : "text-[var(--brand-text-muted)] hover:underline"}
                  >
                    {busy ? tx("キャンセル中…", "Cancelling…") : confirming ? tx("本当にキャンセルする", "Tap again to cancel") : tx("予約をキャンセル", "Cancel")}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
        {ended ? null : (
          <button
            type="button"
            onClick={() => navigate(joinHref)}
            className={`ui-btn ui-btn-sm h-10 w-full shrink-0 sm:h-[34px] sm:w-auto ${live || soon ? "ui-btn-primary" : "ui-btn-ghost"}`}
          >
            {live ? tx("今すぐ入る", "Join now") : soon ? tx("マイクを確認", "Check mic") : tx("詳細", "Details")}
          </button>
        )}
      </div>
    </Ticket>
  );
}

/** これからの枠を、日ごとにまとめる。見出しは「今日」「明日」、それ以外は「11/02 (月)」 */
function groupByDay(entries: Entry[], timeZone: string | undefined, now: number, tx: (ja: string, en: string) => string, locale: string) {
  const dayKey = (value: string | number) => formatInTimeZone(new Date(value), timeZone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const today = dayKey(now);
  const tomorrow = dayKey(now + 86_400_000);
  const groups: { key: string; label: string; entries: Entry[] }[] = [];
  for (const entry of entries) {
    const key = dayKey(entry.session.startsAt);
    let group = groups.find((item) => item.key === key);
    if (!group) {
      const date = formatInTimeZone(entry.session.startsAt, timeZone, { month: "2-digit", day: "2-digit", weekday: "short" }, locale === "jp" ? "ja-JP" : "en-US");
      const label = key === today ? `${tx("今日", "Today")} ・ ${date}` : key === tomorrow ? `${tx("明日", "Tomorrow")} ・ ${date}` : date;
      group = { key, label, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

export function TicketsPageClient() {
  const { tx, locale } = useI18n();
  const { navigate } = useRouteTransition();
  const { isAuthenticated, hydrated } = useUserSession();
  const viewerTimeZone = useViewerTimeZone();
  const timeZone = viewerTimeZone ?? undefined;
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // 予約が変わったら（ほかのタブでのキャンセルも含めて）読み直す。数字を足すと、下の effect が走る
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeReservations(() => setVersion((value) => value + 1)), []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const reservations = (await listMyReservations()).filter((item) => item.status === "reserved");
        // 予約ごとに配信枠を取ってくる（同じ枠は1回だけ）
        const ids = [...new Set(reservations.map((item) => item.sessionId))];
        const sessions = await Promise.all(ids.map((id) => getStreamSession(id).catch(() => null)));
        const byId = new Map(sessions.filter((item): item is StreamSession => item !== null).map((item) => [item.sessionId, item]));
        if (cancelled) return;
        setEntries(
          reservations
            .map((reservation) => {
              const session = byId.get(reservation.sessionId);
              return session ? { reservation, session, start: { kind: "tbd" } as StartState } : null;
            })
            .filter((item): item is Entry => item !== null),
        );
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : tx("読み込めませんでした", "Failed to load"));
        setEntries([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, tx, version]);

  // 「あと何時間」と、これから / 過去の振り分けは、今の時刻から毎回出し直す
  const { live, upcoming, past } = useMemo(() => {
    const withStart = (entries ?? []).map((entry) => ({
      ...entry,
      start: getStartState(entry.session.startsAt, entry.session.plannedDurationMin ?? 60, entry.session.status, now),
    }));
    const byStart = (a: Entry, b: Entry) => new Date(a.session.startsAt).getTime() - new Date(b.session.startsAt).getTime();
    return {
      live: withStart.filter((entry) => entry.start.kind === "live").sort(byStart),
      upcoming: withStart.filter((entry) => entry.start.kind !== "live" && entry.start.kind !== "ended").sort(byStart),
      past: withStart.filter((entry) => entry.start.kind === "ended").sort((a, b) => byStart(b, a)),
    };
  }, [entries, now]);

  const groups = useMemo(() => groupByDay(upcoming, timeZone, now, tx, locale), [upcoming, timeZone, now, tx, locale]);

  const handleCancel = async (reservationId: string) => {
    try {
      await cancelReservation(reservationId);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : tx("キャンセルできませんでした", "Could not cancel"));
    }
  };

  const upcomingCount = live.length + upcoming.length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />
      <main className="mx-auto grid w-full max-w-[880px] gap-6 px-4 pb-28 pt-8 lg:pb-12">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">{tx("マイチケット", "My tickets")}</h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{tx("予約した配信枠", "Sessions you've booked")}</p>
          </div>
          {viewerTimeZone ? (
            <p className="text-xs font-bold text-[var(--brand-text-muted)]">{tx(`時刻は ${timeZoneLabel(viewerTimeZone)}`, `Times in ${timeZoneLabel(viewerTimeZone)}`)}</p>
          ) : null}
        </header>

        {hydrated && !isAuthenticated ? (
          <div className="ui-panel grid justify-items-center gap-3 p-8 text-center">
            <TicketIcon className="h-10 w-10 text-[var(--brand-primary)]" aria-hidden />
            <p className="font-black">{tx("ログインすると、予約した枠がここに並びます", "Log in to see the sessions you've booked")}</p>
            <button type="button" onClick={() => navigate(`/auth?redirect=${encodeURIComponent("/tickets")}`)} className="ui-btn ui-btn-md ui-btn-primary">
              {tx("ログイン", "Log in")}
            </button>
          </div>
        ) : (
          <>
            <div className="ui-segment w-fit" role="group" aria-label={tx("表示する予約", "Bookings to show")}>
              {(
                [
                  { id: "upcoming", label: tx("これから", "Upcoming"), count: upcomingCount },
                  { id: "past", label: tx("過去", "Past"), count: past.length },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className="ui-segment__option px-4 text-sm"
                >
                  {item.label}
                  {item.count > 0 ? <span className="ml-1.5 text-xs opacity-80">{item.count}</span> : null}
                </button>
              ))}
            </div>

            {error ? <p className="rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{error}</p> : null}

            {entries === null ? (
              <p className="py-10 text-center text-sm text-[var(--brand-text-muted)]">{tx("読み込み中…", "Loading…")}</p>
            ) : tab === "upcoming" ? (
              upcomingCount === 0 ? (
                <div className="ui-panel grid justify-items-center gap-3 p-8 text-center">
                  <TicketIcon className="h-10 w-10 text-[var(--brand-primary)]" aria-hidden />
                  <p className="font-black">{tx("予約した枠はまだありません", "No bookings yet")}</p>
                  <p className="text-sm text-[var(--brand-text-muted)]">{tx("気になる配信の枠を予約すると、ここに並びます。", "Book a session and it will show up here.")}</p>
                  <button type="button" onClick={() => navigate("/")} className="ui-btn ui-btn-md ui-btn-primary">
                    {tx("配信を探す", "Find a session")}
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {live.length > 0 ? (
                    <section className="grid gap-3">
                      <h2 className="flex items-center gap-2 text-sm font-black text-[var(--brand-accent-ink)]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand-accent)]" aria-hidden />
                        {tx("いま入れる", "Live now")}
                      </h2>
                      {live.map((entry) => (
                        <TicketRow key={entry.reservation.reservationId} entry={entry} timeZone={timeZone} />
                      ))}
                    </section>
                  ) : null}
                  {groups.map((group) => (
                    <section key={group.key} className="grid gap-3">
                      <h2 className="text-sm font-black text-[var(--brand-text-muted)]">{group.label}</h2>
                      {group.entries.map((entry) => (
                        <TicketRow key={entry.reservation.reservationId} entry={entry} timeZone={timeZone} onCancel={handleCancel} />
                      ))}
                    </section>
                  ))}
                </div>
              )
            ) : past.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--brand-text-muted)]">{tx("終わった枠はまだありません", "No past sessions yet")}</p>
            ) : (
              <div className="grid gap-3">
                {past.map((entry) => (
                  <TicketRow key={entry.reservation.reservationId} entry={entry} timeZone={timeZone} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
