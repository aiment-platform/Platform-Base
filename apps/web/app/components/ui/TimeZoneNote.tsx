"use client";

import { GlobeAsiaAustraliaIcon } from "@heroicons/react/24/outline";
import { useI18n } from "../../lib/i18n";
import { timeZoneLabel, useViewerTimeZone } from "../../lib/timezone";

/**
 * 「時刻は〇〇時間で表示しています」の小さな注記。
 * 時刻が並ぶ一覧（ホーム、スケジュール、チャンネル、枠管理）の見出し横に置く。
 */
export function TimeZoneNote({ className = "" }: { className?: string }) {
  const { tx } = useI18n();
  const timeZone = useViewerTimeZone();
  // サーバー描画中は場所だけ確保して、ハイドレーション後に中身を出す
  if (!timeZone) return <span className={`inline-block h-5 ${className}`.trim()} aria-hidden />;

  const label = timeZoneLabel(timeZone);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-text-muted)] ${className}`.trim()}>
      <GlobeAsiaAustraliaIcon className="h-4 w-4" aria-hidden />
      {tx(`時刻は ${label}（あなたの地域）`, `Times in ${label} (your time)`)}
    </span>
  );
}
