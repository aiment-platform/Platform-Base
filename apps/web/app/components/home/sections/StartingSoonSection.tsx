"use client";

import { StartingSoonSession } from "../types";
import { StreamSessionCard } from "../StreamSessionCard";
import { useI18n } from "../../../lib/i18n";

type StartingSoonSectionProps = {
 sessions: StartingSoonSession[];
 countdown: Record<string, number>;
 onOpenSession: (sessionId: string) => void;
 onOpenChannel: (hostUserId: string) => void;
};

export function StartingSoonSection({
 sessions,
  onOpenSession,
  onOpenChannel,
}: StartingSoonSectionProps) {
  const { tx } = useI18n();
  return (
    <section className="py-10">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)]/20 px-3 py-1.5">
            <span className="text-xs font-bold tracking-widest text-[var(--brand-primary)]">STARTING SOON</span>
          </div>
          <p className="text-sm text-[var(--brand-text-muted)]">{tx("配信開始前だけ参加枠を確保できます", "Reserve your spot before stream starts")}</p>
        </div>
        <span className="text-xs text-[var(--brand-text-muted)]">{sessions.length} {tx("件", "items")}</span>
      </div>

      {sessions.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--brand-text-muted)]">{tx("該当する配信が見つかりませんでした", "No matching streams found")}</div>
      ) : (
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
      )}
    </section>
  );
}
