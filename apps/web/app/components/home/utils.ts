import { ParticipationType, TypeInfo } from "./types";

import type { Translate } from "../../lib/i18n";

export function formatCountdown(seconds: number, tx: Translate): string {
  if (seconds <= 0) return tx("まもなく開始", "Starting soon", { tw: "即將開始", ko: "곧 시작" });
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatCountdownLabel(seconds: number, tx: Translate): string {
  if (seconds <= 0) return tx("まもなく開始", "Starting soon", { tw: "即將開始", ko: "곧 시작" });
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return tx(`${h}時間${m}分後`, `Starts in ${h}h ${m}m`, { tw: `${h} 小時 ${m} 分鐘後開始`, ko: `${h}시간 ${m}분 후 시작` });
  return tx(`${m}分後に開始`, `Starts in ${m}m`, { tw: `${m} 分鐘後開始`, ko: `${m}분 후 시작` });
}

export function getTypeInfo(type: ParticipationType | "First-come" | "Lottery", tx: Translate): TypeInfo {
  switch (type) {
    case "First-come":
      return { label: tx("先着順", "First-come", { tw: "先搶先贏", ko: "선착순" }), bg: "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]", icon: "FC" };
    case "Lottery":
      return { label: tx("抽選制", "Lottery", { tw: "抽選制", ko: "추첨제" }), bg: "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]", icon: "LT" };
    case "Members-only":
      return { label: tx("メンバー限定", "Members only", { tw: "會員限定", ko: "멤버십 한정" }), bg: "bg-[var(--brand-accent-soft)] text-[var(--brand-accent-ink)]", icon: "MB" };
    default:
      return { label: tx("配信", "Stream", { tw: "直播", ko: "방송" }), bg: "bg-[var(--brand-surface)] text-[var(--brand-text-muted)]", icon: "LV" };
  }
}

export function matchesFilter(
  item: { vtuber: string; title: string; tags: string[] },
  searchQuery: string,
  activeTags: string[] = [],
): boolean {
  if (searchQuery && !item.vtuber.includes(searchQuery) && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }
  if (activeTags.length > 0 && !activeTags.some((tag) => item.tags.includes(tag))) {
    return false;
  }
  return true;
}
