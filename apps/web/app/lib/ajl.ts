export type AjlLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type AjlInfo = {
  level: AjlLevel;
  jfStandard: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
  description: string;
};

export const DEFAULT_AJL_LEVEL: AjlLevel = 3;

export const AJL_LEVELS: AjlInfo[] = [
  {
    level: 1,
    jfStandard: "A1",
    label: "Starter",
    description: "Words and simple greetings",
  },
  {
    level: 2,
    jfStandard: "A2",
    label: "Beginner",
    description: "Simple self-introductions and short answers",
  },
  {
    level: 3,
    jfStandard: "B1",
    label: "Intermediate",
    description: "Basic conversation with support",
  },
  {
    level: 4,
    jfStandard: "B2",
    label: "Upper Intermediate",
    description: "Natural conversation on familiar topics",
  },
  {
    level: 5,
    jfStandard: "C1",
    label: "Advanced",
    description: "Deep conversation and abstract topics",
  },
  {
    level: 6,
    jfStandard: "C2",
    label: "Expert",
    description: "Near-native free conversation",
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
