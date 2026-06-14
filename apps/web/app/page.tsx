"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "./components/home/Footer";
import { TopNav } from "./components/home/TopNav";
import { NowLiveSection } from "./components/home/sections/NowLiveSection";
import { StartingSoonSection } from "./components/home/sections/StartingSoonSection";
import { UpcomingTicker } from "./components/home/UpcomingTicker";
import { LiveSession, StartingSoonSession } from "./components/home/types";
import { matchesFilter } from "./components/home/utils";
import { useI18n } from "./lib/i18n";
import { getCachedActiveSessions, listActiveStreamSessions, subscribeStreamSessions, type StreamSession } from "./lib/streamSessions";

function toSecondsUntil(startsAt: string) {
  const diffMs = new Date(startsAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

export default function HomePage() {
  const router = useRouter();
  const { tx } = useI18n();

  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicSessions, setDynamicSessions] = useState<StreamSession[]>(() => getCachedActiveSessions() ?? []);
  const [countdown, setCountdown] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const sessions = await listActiveStreamSessions();
        if (!cancelled) setDynamicSessions(sessions);
      } catch {
        if (!cancelled) setDynamicSessions([]);
      }
    };
    void sync();
    const unsubscribe = subscribeStreamSessions(sync);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const dynamicStartingSoon = useMemo<StartingSoonSession[]>(
    () =>
      dynamicSessions
        .filter((session) => session.status === "prelive")
        .map((session) => ({
          id: session.sessionId,
          hostUserId: session.hostUserId,
          hostAvatarUrl: session.hostAvatarUrl,
          hostChannelName: session.hostChannelName,
          vtuber: session.hostName,
          title: session.title,
          thumbnail: session.thumbnail,
          startsAt: session.startsAt,
          startsInSeconds: toSecondsUntil(session.startsAt),
          slotsTotal: session.speakerSlotsTotal,
          slotsLeft: session.speakerSlotsLeft,
          japaneseLevel: session.japaneseLevel,
          participationType: session.participationType,
          reservationRequired: session.reservationRequired,
          isSubscribed: true,
          tags: [session.category, "参加型"],
          description: session.description,
          duration: tx(`約${session.plannedDurationMin ?? 60}分`, `About ${session.plannedDurationMin ?? 60} min`),
          glowColor: "rgba(124,106,230,0.35)",
        })),
    [dynamicSessions, tx],
  );

  const dynamicLive = useMemo<LiveSession[]>(
    () =>
      dynamicSessions
        .filter((session) => session.status === "live")
        .map((session) => ({
          id: session.sessionId,
          hostUserId: session.hostUserId,
          hostAvatarUrl: session.hostAvatarUrl,
          hostChannelName: session.hostChannelName,
          vtuber: session.hostName,
          title: session.title,
          thumbnail: session.thumbnail,
          startsAt: session.startsAt,
          viewers: 0,
          slotsTotal: session.speakerSlotsTotal,
          slotsLeft: session.speakerSlotsLeft,
          japaneseLevel: session.japaneseLevel,
          participationType: session.participationType,
          isSubscribed: true,
          tags: [session.category, "参加型"],
          description: session.description,
          duration: tx(`配信中 / 約${session.plannedDurationMin ?? 60}分`, `Live now / About ${session.plannedDurationMin ?? 60} min`),
        })),
    [dynamicSessions, tx],
  );

  const allStartingSoon = useMemo(() => dynamicStartingSoon, [dynamicStartingSoon]);
  const allLive = useMemo(() => dynamicLive, [dynamicLive]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = { ...prev };
        for (const key in next) {
          if (next[key] > 0) next[key] -= 1;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mergedCountdown = useMemo(() => {
    const next: Record<string, number> = {};
    for (const session of allStartingSoon) {
      next[session.id] = countdown[session.id] ?? session.startsInSeconds;
    }
    return next;
  }, [allStartingSoon, countdown]);

  const filteredStartingSoon = useMemo(
    () => allStartingSoon.filter((session) => matchesFilter(session, searchQuery)),
    [allStartingSoon, searchQuery],
  );

  const filteredLive = useMemo(
    () => allLive.filter((session) => matchesFilter(session, searchQuery)),
    [allLive, searchQuery],
  );

  const goPreJoin = (sessionId: string) => {
    router.push(`/join/${encodeURIComponent(sessionId)}`);
  };

  const goChannel = (userId: string) => {
    router.push(`/channels/${encodeURIComponent(userId)}`);
  };

  return (
    <div className="min-h-screen bg-[var(--brand-bg-900)] pb-20 md:pb-0">
      <TopNav searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <UpcomingTicker sessions={filteredStartingSoon} onParticipate={goPreJoin} />

      <div className="mx-auto max-w-[1400px] px-8">
        <StartingSoonSection
          sessions={filteredStartingSoon}
          countdown={mergedCountdown}
          onOpenSession={goPreJoin}
          onOpenChannel={goChannel}
        />

        <NowLiveSection
          sessions={filteredLive}
          onOpenSession={goPreJoin}
          onOpenChannel={goChannel}
        />
      </div>

      <Footer />
    </div>
  );
}
