/** メイトの参加スタイル。 */
export type SupporterStyle = "native-mix" | "open-mix" | "call-in";

/** 参加スタイルの表示名。英語名（Native Mix / Open Mix / Call-in）は内部の値だけに残す。 */
export const STYLE_LABEL: Record<SupporterStyle, string> = {
  "native-mix": "後半から合流",
  "open-mix": "最初から合流",
  "call-in": "呼ばれたら合流",
};
