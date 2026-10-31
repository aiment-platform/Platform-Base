/**
 * チャンネルページのプロフィール欄の、よく使う見出し。
 *
 * 見出しをここから選ぶと、保存するのは key だけで、表示するときに言語に合わせて訳す
 * （日本語で「好きなもの」、英語で「Likes」）。ここにない見出しは「その他」として配信者が自由に書き、
 * そのときは書いた文字のまま出す。内容（「いちご大福」など）は配信者の文なので訳さない。
 * サーバー（aimentStore）とブラウザの両方から使うので、React には依存させない。
 */
export const PROFILE_PRESETS = [
  { key: "birthday", ja: "誕生日", en: "Birthday" },
  { key: "height", ja: "身長", en: "Height" },
  { key: "likes", ja: "好きなもの", en: "Likes" },
  { key: "hobbies", ja: "趣味", en: "Hobbies" },
  { key: "languages", ja: "話せる言語", en: "Languages" },
  { key: "from", ja: "出身", en: "From" },
  { key: "debut", ja: "デビュー", en: "Debut" },
  { key: "fanName", ja: "ファンの呼び名", en: "Fan name" },
] as const;

export type ProfilePresetKey = (typeof PROFILE_PRESETS)[number]["key"];

export function isProfilePresetKey(value: unknown): value is ProfilePresetKey {
  return PROFILE_PRESETS.some((preset) => preset.key === value);
}

/** 行の見出しを、表示する言語で返す。よく使う見出しなら訳し、自由に書いたものはそのまま */
export function profileItemLabel(item: { key?: string; label: string }, locale: "jp" | "en"): string {
  const preset = PROFILE_PRESETS.find((entry) => entry.key === item.key);
  if (!preset) return item.label;
  return locale === "jp" ? preset.ja : preset.en;
}
