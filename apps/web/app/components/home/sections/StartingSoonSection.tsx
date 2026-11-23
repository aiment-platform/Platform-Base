"use client";

import { StartingSoonSession } from "../types";
import { StreamSessionCard } from "../StreamSessionCard";
import { useI18n } from "../../../lib/i18n";
import { TimeZoneNote } from "../../ui/TimeZoneNote";

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
    <section className="pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="ui-section-title text-lg font-bold">{tx("これからの配信", "Starting soon", { tw: "即將開始的直播", ko: "예정된 방송" })}</h2>
            <span className="ui-count text-sm text-[var(--brand-text-muted)]">{sessions.length}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{tx("配信が始まる前まで参加枠を予約できます", "Reserve your spot before the stream starts", { tw: "直播開始前都可以預約名額", ko: "방송 시작 전까지 참여 자리를 예약할 수 있어요" })}</p>
        </div>
        <TimeZoneNote />
      </div>

      {sessions.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--brand-text-muted)]">{tx("該当する配信が見つかりませんでした", "No matching streams found", { tw: "找不到符合的直播", ko: "조건에 맞는 방송이 없어요" })}</div>
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
