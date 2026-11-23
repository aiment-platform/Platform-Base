"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "../../components/home/TopNav";
import { useI18n } from "../../lib/i18n";
import type { StreamSession } from "../../lib/streamSessions";
import type { ProfileItem } from "../../lib/apiTypes";
import { getAjlInfo } from "../../lib/ajl";
import { profileItemLabel } from "../../lib/profileItems";
import { ChannelHero } from "../components/ChannelHero";
import { ChannelTicketPanel } from "../components/ChannelTicketPanel";
import { StreamSessionCard } from "../../components/home/StreamSessionCard";
import { TimeZoneNote } from "../../components/ui/TimeZoneNote";
import { SiteFooter } from "../../components/landing/SiteFooter";

type ChannelInfo = {
  userId: string;
  name: string;
  channelName: string;
  bio: string;
  avatarUrl: string;
  headerUrl: string;
  profileItems?: ProfileItem[];
  role: "listener" | "vtuber";
};

type ChannelResponse = {
  channel: ChannelInfo;
  sessions: StreamSession[];
};

export function ChannelPageClient() {
  const { tx } = useI18n();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [sessions, setSessions] = useState<StreamSession[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/channels/${encodeURIComponent(userId)}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as (ChannelResponse & { error?: string }) | null;
        if (!response.ok) throw new Error(payload?.error ?? "Failed to load channel");
        if (!payload) throw new Error("Failed to load channel");
        if (cancelled) return;
        setChannel(payload.channel);
        setSessions(payload.sessions ?? []);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : tx("チャンネルの取得に失敗しました。", "Failed to load channel.", { tw: "無法載入頻道。", ko: "채널을 불러오지 못했어요." }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (userId) void load();
    return () => {
      cancelled = true;
    };
  }, [userId, tx]);

  const liveSessions = useMemo(() => sessions.filter((session) => session.status === "live"), [sessions]);
  const upcomingSessions = useMemo(() => sessions.filter((session) => session.status === "prelive"), [sessions]);
  const archivedSessions = useMemo(() => sessions.filter((session) => session.status === "ended"), [sessions]);
  // 「AJL 1〜3 が得意」の札。これからの枠（なければ全部の枠）の AJL の幅から出す
  const levelRange = useMemo(() => {
    const pool = [...liveSessions, ...upcomingSessions].length ? [...liveSessions, ...upcomingSessions] : sessions;
    const levels = pool.map((session) => session.japaneseLevel).filter((level): level is number => typeof level === "number");
    return levels.length ? { min: Math.min(...levels), max: Math.max(...levels) } : null;
  }, [liveSessions, upcomingSessions, sessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
        <TopNav />
        <main className="mx-auto max-w-[1200px] px-6 py-10">
          <p className="text-sm text-[var(--brand-text-muted)]">{tx("チャンネルを読み込み中...", "Loading channel...", { tw: "正在載入頻道...", ko: "채널을 불러오는 중..." })}</p>
        </main>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
        <TopNav />
        <main className="mx-auto flex max-w-[1200px] flex-col items-start gap-3 px-6 py-10">
          <p className="text-sm text-[var(--brand-accent-ink)]">{error ?? tx("チャンネルが見つかりません。", "Channel not found.", { tw: "找不到頻道。", ko: "채널을 찾을 수 없어요." })}</p>
          <button onClick={() => router.push("/")} className="ui-btn ui-btn-md ui-btn-primary">
            {tx("ホームに戻る", "Back to Home", { tw: "回到首頁", ko: "홈으로" })}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />
      <div className="flex-1">
      <ChannelHero
        channelName={channel.channelName}
        userId={channel.userId}
        bio={channel.bio}
        avatarUrl={channel.avatarUrl}
        headerUrl={channel.headerUrl}
        liveCount={liveSessions.length}
        upcomingCount={upcomingSessions.length}
        archiveCount={archivedSessions.length}
        levelRange={levelRange}
        basePath={`/channels/${encodeURIComponent(channel.userId)}`}
        active="overview"
        labels={{
          upcoming: tx("予定", "Upcoming", { tw: "預定", ko: "예정" }),
          archive: tx("配信した回数", "Streams", { tw: "直播次數", ko: "라이브 횟수" }),
          noBio: tx("紹介文は未設定です。", "No bio yet.", { tw: "尚未填寫自我介紹。", ko: "아직 소개글이 없어요." }),
          levelTag: (range) => tx(`AJL ${range} が得意`, `Best for AJL ${range}`, { tw: `擅長 AJL ${range}`, ko: `AJL ${range} 추천` }),
        }}
      />
      {/* 左にプロフィールと 1on1、右に配信枠。スマホでは配信枠を先に（来た人がまず探すのは枠なので） */}
      <main className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <aside className="order-last grid gap-5 lg:order-none lg:sticky lg:top-24">
          <ProfileCard
            userId={channel.userId}
            items={channel.profileItems ?? []}
            levelRange={levelRange}
            sessionCount={sessions.length}
          />
          <ChannelTicketPanel
            targetUserId={channel.userId}
            channelName={channel.channelName}
            targetRole={channel.role}
          />
        </aside>

        <div className="grid min-w-0 gap-10">
          {liveSessions.length > 0 ? (
            <SessionSection title={tx("配信中", "Live now", { tw: "直播中", ko: "라이브 중" })} live>
              {liveSessions.map((session) => (
                <ChannelSessionCard
                  key={session.sessionId}
                  session={session}
                  channel={channel}
                  onOpen={() => router.push(`/join/${encodeURIComponent(session.sessionId)}`)}
                />
              ))}
            </SessionSection>
          ) : null}

          <SessionSection title={tx("これからの配信", "Upcoming", { tw: "即將直播", ko: "예정된 라이브" })} aside={<TimeZoneNote />}>
            {upcomingSessions.length === 0 ? (
              <p className="col-span-full rounded-2xl bg-[var(--brand-bg-900)] px-4 py-6 text-center text-sm font-bold text-[var(--brand-text-muted)]">
                {tx("予定している配信はまだありません。", "No upcoming streams yet.", { tw: "目前還沒有預定的直播。", ko: "아직 예정된 라이브가 없어요." })}
              </p>
            ) : (
              upcomingSessions.map((session) => (
                <ChannelSessionCard
                  key={session.sessionId}
                  session={session}
                  channel={channel}
                  onOpen={() => router.push(`/join/${encodeURIComponent(session.sessionId)}`)}
                />
              ))
            )}
          </SessionSection>

          {/* 過去の配信は、ないときは見出しごと出さない（空の見出しが場所を取るだけなので） */}
          {archivedSessions.length > 0 ? (
            <SessionSection title={tx("過去の配信", "Past streams", { tw: "過去的直播", ko: "지난 라이브" })}>
              {archivedSessions.map((session) => (
                <ChannelSessionCard
                  key={session.sessionId}
                  session={session}
                  channel={channel}
                  onOpen={() => router.push(`/join/${encodeURIComponent(session.sessionId)}`)}
                />
              ))}
            </SessionSection>
          ) : null}
        </div>
      </main>
      </div>
      <SiteFooter />
    </div>
  );
}

function SessionSection({ title, aside, live, children }: { title: string; aside?: React.ReactNode; live?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-black">
          {live ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--brand-accent)]" aria-hidden /> : null}
          {title}
        </h2>
        {aside}
      </div>
      {/* 列の数は決め打ちせず、ホームと同じ「1枚 240px 以上で入るだけ並べる」。
          列数を固定すると、プロフィールの列が下に回る幅（1024px 未満）で1枚が大きく引き伸ばされるため */}
      <div className="aiment-session-card-grid">{children}</div>
    </section>
  );
}

function ChannelSessionCard({ session, channel, onOpen }: { session: StreamSession; channel: ChannelInfo; onOpen: () => void }) {
  return (
    <StreamSessionCard
      title={session.title}
      channelName={channel.channelName || channel.name}
      thumbnail={session.thumbnail}
      startsAt={session.startsAt}
      slotsLeft={session.speakerSlotsLeft ?? session.slotsLeft}
      slotsTotal={session.speakerSlotsTotal ?? session.slotsTotal}
      japaneseLevel={session.japaneseLevel}
      hostAvatarUrl={channel.avatarUrl}
      onOpen={onOpen}
    />
  );
}

/**
 * プロフィールのカード。上に紫の見出しの帯（PROFILE と @id）、その下に「見出し / 内容」の行。
 * 配信者が書いた行のあとに、配信枠から自動で出す行（得意レベル・配信の数）を足す
 */
function ProfileCard({
  userId,
  items,
  levelRange,
  sessionCount,
}: {
  userId: string;
  items: ProfileItem[];
  levelRange: { min: number; max: number } | null;
  sessionCount: number;
}) {
  const { tx, locale } = useI18n();
  // よく使う見出しは、表示の言語に合わせて訳す（自由に書いた見出しはそのまま）
  const rows: ProfileItem[] = items.map((item) => ({ ...item, label: profileItemLabel(item, locale) }));
  if (levelRange) {
    const min = getAjlInfo(levelRange.min);
    const max = getAjlInfo(levelRange.max);
    rows.push({
      label: tx("得意レベル", "Best for", { tw: "擅長程度", ko: "추천 레벨" }),
      value: min.level === max.level ? `AJL ${min.level}（${min.label}）` : `AJL ${min.level}–${max.level}`,
    });
  }
  rows.push({ label: tx("配信枠", "Sessions", { tw: "直播場次", ko: "라이브 회차" }), value: tx(`${sessionCount} 枠`, `${sessionCount}`, { tw: `${sessionCount} 場`, ko: `${sessionCount}회` }) });

  return (
    <section className="overflow-hidden rounded-[20px] border-[1.5px] border-[var(--surface-edge,var(--line))] bg-[var(--brand-surface)]" style={{ boxShadow: "0 4px 0 0 var(--surface-edge, var(--line))" }}>
      <div className="flex items-center justify-between gap-3 bg-[var(--brand-primary)] px-5 py-3 text-white">
        <h2 className="text-xs font-black tracking-[0.25em]">PROFILE</h2>
        <span className="truncate text-xs font-bold text-white/75">@{userId}</span>
      </div>
      <dl className="divide-y divide-[var(--line)] px-5">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="shrink-0 text-sm font-black text-[var(--brand-text-muted)]">{row.label}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-black text-[var(--brand-text)]">{row.value}</dd>
          </div>
        ))}
      </dl>
      {items.length === 0 ? (
        <p className="mx-5 mb-5 mt-1 rounded-xl bg-[var(--brand-bg-900)] px-4 py-3 text-xs font-bold leading-relaxed text-[var(--brand-text-muted)]">
          {tx("誕生日や好きなものなどは、まだ書かれていません。", "No profile details yet.", { tw: "尚未填寫生日、喜好等資料。", ko: "아직 생일이나 좋아하는 것 등이 작성되지 않았어요." })}
        </p>
      ) : (
        <div className="h-2" />
      )}
    </section>
  );
}
