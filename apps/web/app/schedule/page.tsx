"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "../components/landing/SiteFooter";
import { TopNav } from "../components/home/TopNav";
import { MultiDayScheduleGrid } from "../channels/components/MultiDayScheduleGrid";
import { ScheduleFilters } from "../components/schedule/ScheduleFilters";
import { ScheduleEvent, SessionCategory, Talent } from "../components/schedule/types";
import { SlowLoadingScreen } from "../components/ui/SlowLoadingScreen";
import { useI18n } from "../lib/i18n";
import { TimeZoneNote } from "../components/ui/TimeZoneNote";
import { getCachedActiveSessions, listActiveStreamSessions, subscribeStreamSessions, type StreamSession } from "../lib/streamSessions";

function todayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalYmd(value: string) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalHm(value: string) {
  const date = new Date(value);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function addDaysYmd(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 期間の見出し。例: 10/20(火) – 10/22(木)。1日表示なら1つだけ。 */
function formatRangeLabel(dates: string[], intlLocale: string) {
  const fmt = (ymd: string) =>
    new Intl.DateTimeFormat(intlLocale, { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${ymd}T00:00:00`));
  if (dates.length === 0) return "";
  if (dates.length === 1) return fmt(dates[0]);
  return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
}

function dateRange(startDate: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDaysYmd(startDate, index));
}

function toSessionCategory(value: string): SessionCategory {
  if (value === "雑談" || value === "ゲーム" || value === "歌枠" || value === "英語") return value;
  return "雑談";
}

export default function SchedulePage() {
  const { tx } = useI18n();
  const [sessions, setSessions] = useState<StreamSession[]>(() => getCachedActiveSessions() ?? []);
  const [initialLoading, setInitialLoading] = useState(() => getCachedActiveSessions() === null);
  const [showSlowLoading, setShowSlowLoading] = useState(false);
  const todayDate = todayYmd();

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const next = await listActiveStreamSessions();
        if (!cancelled) setSessions(next);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };
    void sync();
    const unsubscribe = subscribeStreamSessions(sync, 10000, false);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      setShowSlowLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSlowLoading(true), 450);
    return () => window.clearTimeout(timer);
  }, [initialLoading]);

  const talents = useMemo<Talent[]>(() => {
    const map = new Map<string, Talent>();
    for (const session of sessions) {
      if (!map.has(session.hostUserId)) {
        map.set(session.hostUserId, {
          id: session.hostUserId,
          name: session.hostChannelName || session.hostName,
          avatar: session.hostAvatarUrl || session.thumbnail,
          specialty: toSessionCategory(session.category),
        });
      }
    }
    return Array.from(map.values());
  }, [sessions]);

  const scheduleEvents = useMemo<ScheduleEvent[]>(
    () =>
      sessions.map((session) => ({
        id: session.sessionId,
        sessionId: session.sessionId,
        date: toLocalYmd(session.startsAt),
        talentId: session.hostUserId,
        title: session.title,
        start: toLocalHm(session.startsAt),
        durationMin: 60,
        status: session.participationType === "Lottery" ? "lottery" : session.speakerSlotsLeft > 0 ? "available" : "booked",
        category: toSessionCategory(session.category),
        japaneseLevel: session.japaneseLevel,
        slotsLeft: session.speakerSlotsLeft,
        slotsTotal: session.speakerSlotsTotal,
      })),
    [sessions],
  );

  // 表示期間の先頭日。今日より前には戻さない（YYYY-MM-DD は文字列のまま大小比較できる）。
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [visibleDayCount, setVisibleDayCount] = useState(3);
  const [talentQuery, setTalentQuery] = useState("");
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(16);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SessionCategory[]>([]);

  const visibleDates = useMemo(() => dateRange(selectedDate, visibleDayCount), [selectedDate, visibleDayCount]);
  const visibleDateSet = useMemo(() => new Set(visibleDates), [visibleDates]);
  const canGoPrev = selectedDate > todayDate;

  const shiftDates = (direction: -1 | 1) => {
    setSelectedDate((current) => {
      const next = addDaysYmd(current, direction * visibleDayCount);
      return next < todayDate ? todayDate : next;
    });
  };

  const filteredEvents = useMemo(() => {
    const query = talentQuery.trim().toLowerCase();
    const matchedTalentIds =
      query.length === 0
        ? null
        : new Set(
            talents.filter((talent) => talent.name.toLowerCase().includes(query)).map((talent) => talent.id),
          );

    return scheduleEvents.filter((event) => {
      if (!visibleDateSet.has(event.date)) return false;
      if (matchedTalentIds && !matchedTalentIds.has(event.talentId)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(event.category)) return false;
      if (onlyAvailable && event.status !== "available") return false;
      return true;
    });
  }, [visibleDateSet, talentQuery, talents, scheduleEvents, selectedCategories, onlyAvailable]);

  const handleToggleCategory = (category: SessionCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const handleStartHourChange = (value: number) => {
    setStartHour(value);
    if (value >= endHour) setEndHour(Math.min(24, value + 1));
  };

  const handleEndHourChange = (value: number) => {
    setEndHour(value);
    if (value <= startHour) setStartHour(Math.max(0, value - 1));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <TopNav />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">{tx("配信スケジュール", "Stream Schedule")}</h1>
          <p className="mt-1 text-sm text-[var(--text-sub)]">{tx("時間帯とタレントを比較して、予約可能な枠をすばやく選べます。", "Compare time slots and talents to quickly find bookable streams.")}</p>
          <TimeZoneNote className="mt-3" />
        </div>

        {initialLoading ? (
          showSlowLoading ? (
            <SlowLoadingScreen
              title={tx("スケジュールを読み込んでいます", "Loading schedule")}
              description={tx("VTuberの配信予定を整理しています。少しだけお待ちください。", "Organizing VTuber schedules. Please wait a moment.")}
            />
          ) : (
            <div className="min-h-[360px]" aria-hidden />
          )
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <ScheduleFilters
              rangeLabel={formatRangeLabel(visibleDates, tx("ja-JP", "en-US"))}
              canGoPrev={canGoPrev}
              isShowingToday={selectedDate === todayDate}
              visibleDayCount={visibleDayCount}
              talentQuery={talentQuery}
              startHour={startHour}
              endHour={endHour}
              onlyAvailable={onlyAvailable}
              selectedCategories={selectedCategories}
              onPrev={() => shiftDates(-1)}
              onNext={() => shiftDates(1)}
              onVisibleDayCountChange={setVisibleDayCount}
              onTalentQueryChange={setTalentQuery}
              onStartHourChange={handleStartHourChange}
              onEndHourChange={handleEndHourChange}
              onOnlyAvailableChange={setOnlyAvailable}
              onToggleCategory={handleToggleCategory}
              onBackToToday={() => setSelectedDate(todayDate)}
            />

            <MultiDayScheduleGrid
              dates={visibleDates}
              startHour={startHour}
              endHour={endHour}
              events={filteredEvents.map((event) => ({
                id: event.id,
                date: event.date,
                start: event.start,
                durationMin: event.durationMin,
                title: event.title,
                talentName: talents.find((talent) => talent.id === event.talentId)?.name,
                talentAvatar: talents.find((talent) => talent.id === event.talentId)?.avatar,
                category: event.category,
                status: event.status,
                href: `/join/${encodeURIComponent(event.sessionId)}`,
                japaneseLevel: event.japaneseLevel,
                slotsLeft: event.slotsLeft,
                slotsTotal: event.slotsTotal,
              }))}
            />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
