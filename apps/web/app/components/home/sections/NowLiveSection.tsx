"use client";

import { LiveSession } from "../types";
import { StreamSessionCard } from "../StreamSessionCard";
import { useI18n } from "../../../lib/i18n";

type NowLiveSectionProps = {
 sessions: LiveSession[];
 onOpenSession: (sessionId: string) => void;
 onOpenChannel: (hostUserId: string) => void;
};

export function NowLiveSection({ sessions, onOpenSession, onOpenChannel }: NowLiveSectionProps) {
  const { tx } = useI18n();
  if (sessions.length === 0) {
    return (
      <section className="pt-8">
        <div className="ui-panel flex items-center gap-3 px-5 py-4">
          <span className="h-2 w-2 rounded-full bg-[var(--placeholder)]" aria-hidden />
          <p className="text-sm font-bold">{tx("いま配信中の枠はありません", "No streams are live right now")}</p>
          <p className="text-sm text-[var(--brand-text-muted)]">{tx("下の予定から予約しておくと、始まったときに入れます。", "Reserve one below to join when it starts.")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-accent)] px-2 py-1 text-[11px] font-bold tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
          LIVE
        </span>
        <h2 className="ui-section-title text-lg font-bold">{tx("配信中", "Live now")}</h2>
        <span className="ui-count text-sm text-[var(--brand-text-muted)]">{sessions.length}</span>
      </div>

      <div className="aiment-session-card-grid">
        {sessions.map((session) => (
          <StreamSessionCard
            key={session.id}
            title={session.title}
            channelName={session.hostChannelName || session.vtuber}
            thumbnail={session.thumbnail}
            startsAt={session.startsAt}
            slotsLeft={session.slotsLeft}
            slotsTotal={session.slotsTotal}
            japaneseLevel={session.japaneseLevel}
            hostAvatarUrl={session.hostAvatarUrl}
            onOpen={() => onOpenSession(session.id)}
            onOpenChannel={session.hostUserId ? () => onOpenChannel(session.hostUserId as string) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
