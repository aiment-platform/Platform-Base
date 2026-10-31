/**
 * 時刻とタイムゾーンの表示。
 *
 * 配信枠の時刻は、見ている人の端末のタイムゾーンで表示している（new Date の
 * ふつうの動き）。学習者はフィリピン（PHT, UTC+8）、VTuber は日本（JST, UTC+9）
 * にいて1時間ずれるので、「どこの時刻か」を必ず添える。
 *
 *   useViewerTimeZone()  … 見ている人のタイムゾーン（サーバー描画中は null）
 *   timeZoneLabel()      … "JST" / "PHT" のような短い名前
 *   formatInTimeZone()   … 指定したタイムゾーンでの "09/07 16:29"
 */
import { useSyncExternalStore } from "react";

/** VTuber（配信する側）の基準タイムゾーン */
export const HOST_TIME_ZONE = "Asia/Tokyo";

// Intl の短い名前は環境によって "GMT+8" になるので、主要な2つは固定で持つ
const ZONE_ABBR: Record<string, string> = {
  "Asia/Tokyo": "JST",
  "Asia/Manila": "PHT",
};

export function timeZoneLabel(timeZone: string, at: Date = new Date()): string {
  if (ZONE_ABBR[timeZone]) return ZONE_ABBR[timeZone];
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(at)
      .find((item) => item.type === "timeZoneName");
    return part?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

export function formatInTimeZone(
  value: string | Date,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions = { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" },
  locale?: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale, { ...options, timeZone, hourCycle: "h23" }).format(date);
}

/** 2つのタイムゾーンで時差があるか（同じ瞬間の時・分を比べる） */
export function sameWallClock(timeZoneA: string, timeZoneB: string, at: Date = new Date()): boolean {
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", day: "2-digit" };
  return formatInTimeZone(at, timeZoneA, options) === formatInTimeZone(at, timeZoneB, options);
}

function readViewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || HOST_TIME_ZONE;
}

const subscribeNever = () => () => {};

/**
 * 見ている人のタイムゾーン。サーバー描画とブラウザで値が変わるので、
 * 最初の描画（ハイドレーション）では null を返し、そのあとで実際の値に差し替わる。
 */
export function useViewerTimeZone(): string | null {
  return useSyncExternalStore(subscribeNever, readViewerTimeZone, () => null);
}
