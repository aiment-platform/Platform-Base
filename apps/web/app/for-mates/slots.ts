/**
 * Supporter枠のあるセッション1件分。
 * いまは仮データ（mockSlots）で表示している。実データが用意できたら、
 * API の返り値をこの形に詰め替えて SupporterSlotCard に渡すだけでよい。
 */
export type SupporterStyle = "native-mix" | "open-mix" | "call-in";

/** 参加スタイルの表示名。英語名（Native Mix / Open Mix / Call-in）は内部の値だけに残す。 */
export const STYLE_LABEL: Record<SupporterStyle, string> = {
  "native-mix": "後半から合流",
  "open-mix": "最初から合流",
  "call-in": "呼ばれたら合流",
};

export type SupporterSlot = {
  id: string;
  vtuber: { name: string; initial: string };
  game: string;
  /** ISO 8601 */
  startsAt: string;
  endsAt: string;
  style: SupporterStyle;
  learnerSeats: number;
  supporterSeats: number;
  supporterSeatsLeft: number;
  /** 後半から合流（native-mix）の、合流する時間帯 */
  nativeMix?: { from: string; to: string };
  /** 集合は開始の何分前か */
  gatherMinutesBefore: number;
  href: string;
  /** 仮データなら true。カードに小さく「サンプル」と出る */
  sample?: boolean;
};

/** 表示用の仮データ。固有名詞は使わず、VTuber名・ゲーム名は一般的な呼び方にしてある。 */
export const mockSlots: SupporterSlot[] = [
  {
    id: "sample-1",
    vtuber: { name: "VTuber A", initial: "A" },
    game: "ゲームA",
    startsAt: "2026-09-25T20:00:00+09:00",
    endsAt: "2026-09-25T21:00:00+09:00",
    style: "native-mix",
    learnerSeats: 3,
    supporterSeats: 3,
    supporterSeatsLeft: 1,
    nativeMix: { from: "2026-09-25T20:40:00+09:00", to: "2026-09-25T21:00:00+09:00" },
    gatherMinutesBefore: 5,
    href: "/auth/signup",
    sample: true,
  },
  {
    id: "sample-2",
    vtuber: { name: "VTuber B", initial: "B" },
    game: "ゲームB",
    startsAt: "2026-09-27T21:00:00+09:00",
    endsAt: "2026-09-27T22:00:00+09:00",
    style: "open-mix",
    learnerSeats: 2,
    supporterSeats: 3,
    supporterSeatsLeft: 3,
    gatherMinutesBefore: 5,
    href: "/auth/signup",
    sample: true,
  },
  {
    id: "sample-3",
    vtuber: { name: "VTuber C", initial: "C" },
    game: "企画A（クイズ）",
    startsAt: "2026-10-03T19:30:00+09:00",
    endsAt: "2026-10-03T20:15:00+09:00",
    style: "call-in",
    learnerSeats: 4,
    supporterSeats: 3,
    supporterSeatsLeft: 2,
    gatherMinutesBefore: 5,
    href: "/auth/signup",
    sample: true,
  },
];

const JST: Intl.DateTimeFormatOptions = { timeZone: "Asia/Tokyo" };

function partsOf(iso: string, options: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat("ja-JP", { ...JST, ...options }).formatToParts(new Date(iso));
  return (type: string) => parts.find((part) => part.type === type)?.value ?? "";
}

/** 「9/25（金）」 */
export function formatSlotDate(iso: string) {
  const get = partsOf(iso, { month: "numeric", day: "numeric", weekday: "short" });
  return `${get("month")}/${get("day")}（${get("weekday").replace(/[()（）]/g, "")}）`;
}

/** 「20:00」 */
export function formatSlotTime(iso: string) {
  const get = partsOf(iso, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${get("hour")}:${get("minute")}`;
}
