import type { Translate } from "./i18n";

export function categoryLabel(value: string, tx: Translate): string {
  if (value === "雑談") return tx("雑談", "Chat", { tw: "閒聊", ko: "잡담" });
  if (value === "ゲーム") return tx("ゲーム", "Games", { tw: "遊戲", ko: "게임" });
  if (value === "歌枠") return tx("歌枠", "Singing", { tw: "歌回", ko: "노래 방송" });
  if (value === "英語") return tx("英語", "English", { tw: "英語", ko: "영어" });
  if (value === "参加型") return tx("参加型", "Interactive", { tw: "參加型", ko: "참여형" });
  return value;
}

export function participationLabel(value: string, tx: Translate): string {
  if (value === "First-come" || value === "先着順") return tx("先着順", "First-come", { tw: "先搶先贏", ko: "선착순" });
  if (value === "Lottery" || value === "抽選制") return tx("抽選制", "Lottery", { tw: "抽選制", ko: "추첨제" });
  if (value === "Members-only" || value === "メンバー限定") return tx("メンバー限定", "Members only", { tw: "會員限定", ko: "멤버십 한정" });
  return value;
}
