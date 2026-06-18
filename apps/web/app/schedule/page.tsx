"use client";

import { useEffect, useMemo, useState } from "react";
import { Footer } from "../components/home/Footer";
import { TopNav } from "../components/home/TopNav";
import { MultiDayScheduleGrid } from "../channels/components/MultiDayScheduleGrid";
import { ScheduleFilters } from "../components/schedule/ScheduleFilters";
import { ScheduleEvent, SessionCategory, Talent } from "../components/schedule/types";
import { SlowLoadingScreen } from "../components/ui/SlowLoadingScreen";
import { useI18n } from "../lib/i18n";
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

  const dateOptions = useMemo(
    () => Array.from(new Set([...dateRange(todayDate, 14), ...scheduleEvents.map((event) => event.date)])).sort(),
    [scheduleEvents, todayDate],
  );

  const [selectedDate, setSelectedDate] = useState(dateOptions.includes(todayDate) ? todayDate : dateOptions[0]);
  const [visibleDayCount, setVisibleDayCount] = useState(3);
  const [talentQuery, setTalentQuery] = useState("");
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(16);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SessionCategory[]>([]);

  const visibleDates = useMemo(() => dateRange(selectedDate, visibleDayCount), [selectedDate, visibleDayCount]);
  const visibleDateSet = useMemo(() => new Set(visibleDates), [visibleDates]);

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
    <div className="min-h-screen bg-[var(--bg)] pb-20 text-[var(--text)] md:pb-0">
      <TopNav />

      <main className="mx-auto max-w-[1400px] px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">{tx("配信スケジュール", "Stream Schedule")}</h1>
          <p className="mt-1 text-sm text-[var(--text-sub)]">{tx("時間帯とタレントを比較して、予約可能な枠をすばやく選べます。", "Compare time slots and talents to quickly find bookable streams.")}</p>
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
          <div className="space-y-5">
            <ScheduleFilters
              dates={dateOptions}
              selectedDate={selectedDate}
              visibleDayCount={visibleDayCount}
              talentQuery={talentQuery}
              startHour={startHour}
              endHour={endHour}
              onlyAvailable={onlyAvailable}
              selectedCategories={selectedCategories}
              onDateChange={setSelectedDate}
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

      <Footer />
    </div>
  );
}
