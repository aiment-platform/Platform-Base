"use client";

import { LiveSession } from "../types";
import { StreamSessionCard } from "../StreamSessionCard";
import { useI18n } from "../../../lib/i18n";

type NowLiveSectionProps = {
 sessions: LiveSession[];
 onOpenSession: (sessionId: string) => void;
 onOpenChannel: (hostUserId: string) => void;
};

export function NowLiveSection({ sessions, onOpenSession }: NowLiveSectionProps) {
  const { tx } = useI18n();
  return (
    <section className="py-10">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[var(--brand-accent)] px-3 py-1.5 shadow-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand-bg-900)]" />
            <span className="text-xs font-bold tracking-widest text-[var(--brand-text)]">LIVE</span>
          </div>
          <p className="text-sm text-[var(--brand-text-muted)]">{tx("現在配信中のセッション", "Streams live now")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--brand-accent)]/15 px-3 py-1">
          <span className="text-[10px] font-bold uppercase text-[var(--brand-accent)]">Total Live</span>
          <span className="text-xs font-black text-[var(--brand-accent)]">{sessions.length}</span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--brand-text-muted)]">{tx("現在ライブ配信はありません", "No live streams right now")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
            />
          ))}
        </div>
      )}
    </section>
  );
}
