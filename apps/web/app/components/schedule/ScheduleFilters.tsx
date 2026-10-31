"use client";

import { useState } from "react";
import { AdjustmentsHorizontalIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SessionCategory } from "./types";
import { useI18n } from "../../lib/i18n";
import { categoryLabel } from "../../lib/labels";

type ScheduleFiltersProps = {
  /** 表示中の期間の見出し（例: 10/20(火) – 10/22(木)） */
  rangeLabel: string;
  /** 今日より前には戻れない（過ぎた枠は予約できないので） */
  canGoPrev: boolean;
  isShowingToday: boolean;
  visibleDayCount: number;
  talentQuery: string;
  startHour: number;
  endHour: number;
  onlyAvailable: boolean;
  selectedCategories: SessionCategory[];
  onPrev: () => void;
  onNext: () => void;
  onVisibleDayCountChange: (count: number) => void;
  onTalentQueryChange: (value: string) => void;
  onStartHourChange: (value: number) => void;
  onEndHourChange: (value: number) => void;
  onOnlyAvailableChange: (value: boolean) => void;
  onToggleCategory: (category: SessionCategory) => void;
  onBackToToday: () => void;
};

const CATEGORIES: SessionCategory[] = ["雑談", "ゲーム", "歌枠", "英語"];
const VISIBLE_DAY_OPTIONS = [1, 3, 7];

export function ScheduleFilters({
  rangeLabel,
  canGoPrev,
  isShowingToday,
  visibleDayCount,
  talentQuery,
  startHour,
  endHour,
  onlyAvailable,
  selectedCategories,
  onPrev,
  onNext,
  onVisibleDayCountChange,
  onTalentQueryChange,
  onStartHourChange,
  onEndHourChange,
  onOnlyAvailableChange,
  onToggleCategory,
  onBackToToday,
}: ScheduleFiltersProps) {
  const { tx } = useI18n();
  // スマホでは詳しい絞り込み（検索・時間帯・カテゴリ）を畳んでおく。全部広げると
  // それだけで最初の1画面が埋まり、肝心の時間割が見えないため。sm 以上は常に表示。
  const [detailsOpen, setDetailsOpen] = useState(false);
  const activeFilterCount = (talentQuery.trim() ? 1 : 0) + (onlyAvailable ? 1 : 0) + selectedCategories.length;

  return (
    <section className="rounded-2xl bg-[var(--brand-surface)] p-3 sm:p-4">
      {/* 日付は「前へ／次へ」で送る。日付ボタンを並べると、予定のある日の数だけ
          ボタンが増え続けてしまう（終わらせ忘れた古い枠の日付も混ざる）。 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label={tx("前の期間", "Previous days")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)] transition-colors hover:text-[var(--brand-text)] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        </button>
        <p className="min-w-0 flex-1 text-center text-sm font-bold text-[var(--brand-text)] sm:min-w-[180px] sm:flex-none">{rangeLabel}</p>
        <button
          type="button"
          onClick={onNext}
          aria-label={tx("次の期間", "Next days")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)] transition-colors hover:text-[var(--brand-text)] sm:h-9 sm:w-9"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onBackToToday}
          disabled={isShowingToday}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg bg-[var(--brand-bg-900)] px-3 text-xs font-medium text-[var(--brand-text-muted)] transition-colors hover:text-[var(--brand-text)] disabled:cursor-default disabled:opacity-40 sm:h-9"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden />
          <span>{tx("今日", "Today")}</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
        <span className="hidden text-xs font-semibold text-[var(--brand-text-muted)] sm:inline">
          {tx("表示日数", "Days")}
        </span>
        <div className="ui-segment" role="group" aria-label={tx("表示日数", "Days")}>
          {VISIBLE_DAY_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={visibleDayCount === count}
              onClick={() => onVisibleDayCountChange(count)}
              className="ui-segment__option h-9 whitespace-nowrap px-2 sm:px-3"
            >
              {tx(`${count}日`, `${count} day${count > 1 ? "s" : ""}`)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          aria-controls="schedule-filter-details"
          className={`ml-auto inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold sm:hidden ${
            detailsOpen ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]" : "bg-[var(--brand-bg-900)] text-[var(--brand-text)]"
          }`}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden />
          <span>{tx("絞り込み", "Filters")}</span>
          {activeFilterCount > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-primary)] px-1 text-[11px] text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* iOS は 16px 未満の入力欄にフォーカスすると画面を拡大するので、スマホだけ text-base */}
      <div id="schedule-filter-details" className={`${detailsOpen ? "block" : "hidden"} sm:block`}>
        <div className="mt-3 space-y-3 sm:mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-text-muted)]" aria-hidden />
            <input
              value={talentQuery}
              onChange={(e) => onTalentQueryChange(e.target.value)}
              placeholder={tx("名前で検索（例: ルミナ）", "Search by name (e.g. Lumina)")}
              className="h-10 w-full rounded-md bg-[var(--brand-bg-900)] pl-9 pr-3 text-base text-[var(--brand-text)] outline-none placeholder:text-[var(--brand-text-muted)] sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-[var(--brand-text)]">
              <span>{tx("開始", "Start")}</span>
              <select
                value={startHour}
                onChange={(e) => onStartHourChange(Number(e.target.value))}
                className="h-10 rounded-md bg-[var(--brand-bg-900)] px-2 text-base text-[var(--brand-text)] outline-none sm:h-9 sm:text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-[var(--brand-text)]">
              <span>{tx("終了", "End")}</span>
              <select
                value={endHour}
                onChange={(e) => onEndHourChange(Number(e.target.value))}
                className="h-10 rounded-md bg-[var(--brand-bg-900)] px-2 text-base text-[var(--brand-text)] outline-none sm:h-9 sm:text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="flex h-10 items-center gap-2 rounded-md bg-[var(--brand-bg-900)] px-3 text-sm text-[var(--brand-text)]">
              <input type="checkbox" checked={onlyAvailable} onChange={(e) => onOnlyAvailableChange(e.target.checked)} />
              <span>{tx("予約可能のみ", "Only available")}</span>
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          {CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleCategory(category)}
                className={`h-9 rounded-full px-3.5 text-xs transition-colors ${
                  selected
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                }`}
              >
                {categoryLabel(category, tx)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
