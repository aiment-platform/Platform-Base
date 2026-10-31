export type AjlLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type AjlInfo = {
  level: AjlLevel;
  jfStandard: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
  description: string;
  /** UI ver0.3 難易度バッジの面の色（モックからのスポイト値）。 */
  color: string;
  /** バッジの下に覗く同系色の厚み。 */
  dropColor: string;
  /** 面の上に載せる数字の色（面との差が 4.5:1 以上になる、同じ色みの濃い色）。 */
  inkColor: string;
};

export const DEFAULT_AJL_LEVEL: AjlLevel = 3;

export const AJL_LEVELS: AjlInfo[] = [
  {
    level: 1,
    jfStandard: "A1",
    label: "Starter",
    description: "Words and simple greetings",
    color: "#69A7EF",
    dropColor: "#69A7EF",
    inkColor: "#0B3866",
  },
  {
    level: 2,
    jfStandard: "A2",
    label: "Beginner",
    description: "Simple self-introductions and short answers",
    color: "#86EACF",
    dropColor: "#86EACF",
    inkColor: "#0C5444",
  },
  {
    level: 3,
    jfStandard: "B1",
    label: "Intermediate",
    description: "Basic conversation with support",
    color: "#9DEA70",
    dropColor: "#9DEA70",
    inkColor: "#2C5A0C",
  },
  {
    level: 4,
    jfStandard: "B2",
    label: "Upper Intermediate",
    description: "Natural conversation on familiar topics",
    color: "#F6C563",
    dropColor: "#F6C96B",
    inkColor: "#5E4000",
  },
  {
    level: 5,
    jfStandard: "C1",
    label: "Advanced",
    description: "Deep conversation and abstract topics",
    color: "#F09063",
    dropColor: "#F2AA66",
    inkColor: "#6A2A08",
  },
  {
    level: 6,
    jfStandard: "C2",
    label: "Expert",
    description: "Near-native free conversation",
    color: "#EC649C",
    dropColor: "#EC649C",
    inkColor: "#4E0727",
  },
];

export function normalizeAjlLevel(value: unknown, fallback: AjlLevel = DEFAULT_AJL_LEVEL): AjlLevel {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (numeric === 1 || numeric === 2 || numeric === 3 || numeric === 4 || numeric === 5 || numeric === 6) {
    return numeric;
  }
  return fallback;
}

export function getAjlInfo(value: unknown): AjlInfo {
  const level = normalizeAjlLevel(value);
  return AJL_LEVELS.find((entry) => entry.level === level) ?? AJL_LEVELS[2];
}

export function formatSessionStartTime(value: string, locale?: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
