"use client";

/**
 * ムードボードの各案で共通に使う部品とサンプルデータ。
 * 書体の読み込み（next/font）もここで1回だけ行う。
 */
import { Dela_Gothic_One, Klee_One, M_PLUS_Rounded_1c } from "next/font/google";
import { GlobeAsiaAustraliaIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "../../lib/i18n";
import { AJL_LEVELS } from "../../lib/ajl";

export const dela = Dela_Gothic_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
export const rounded = M_PLUS_Rounded_1c({ weight: ["500", "800", "900"], subsets: ["latin"], display: "swap", preload: false });
export const klee = Klee_One({ weight: ["400", "600"], subsets: ["latin"], display: "swap", preload: false });

export const PURPLE = "#7665F6";

// Dela Gothic One は太さが1種類だけ。親の太字を引き継ぐとブラウザが太字を重ね描きして
// 漢字の中がつぶれるので、太さを固定して重ね描きを止める
export const DELA: CSSProperties = { fontFamily: dela.style.fontFamily, fontWeight: 400, fontSynthesis: "none" };
export const INK = "#16131F";

/* --- サンプルの中身 --------------------------------------------------------- */

export type Talent = { name: string; nameEn: string; color: string; ink: string };

export const TALENTS: Record<string, Talent> = {
  luna: { name: "星宮ルナ", nameEn: "Luna Hoshimiya", color: "#FF5FA2", ink: "#FFFFFF" },
  sora: { name: "雨音ソラ", nameEn: "Sora Amane", color: "#3EC7F5", ink: INK },
  mikan: { name: "柚木ミカン", nameEn: "Mikan Yuzuki", color: "#FF9F1C", ink: INK },
  ren: { name: "黒羽レン", nameEn: "Ren Kurobane", color: "#2D2A3E", ink: "#FFFFFF" },
};

export const SESSIONS = [
  { title: "はじめての自己紹介れんしゅう", titleEn: "Your first self-introduction", talent: TALENTS.luna, level: 1, time: "20:00", seats: 2 },
  { title: "好きなアニメを日本語で語ろう", titleEn: "Talk about your favorite anime", talent: TALENTS.sora, level: 3, time: "20:30", seats: 1 },
  { title: "コンビニで使えるひとこと", titleEn: "Handy phrases at the konbini", talent: TALENTS.mikan, level: 2, time: "21:00", seats: 3 },
  { title: "敬語ゲーム：店員さんになりきり", titleEn: "Keigo game: play the shop clerk", talent: TALENTS.ren, level: 4, time: "21:30", seats: 2 },
  { title: "日本の夏祭りを紹介するよ", titleEn: "All about Japanese summer festivals", talent: TALENTS.luna, level: 3, time: "22:00", seats: 4 },
  { title: "ニュースを読んで意見を言おう", titleEn: "Read the news, share your view", talent: TALENTS.sora, level: 5, time: "22:30", seats: 1 },
];

export function levelColor(level: number) {
  return AJL_LEVELS.find((item) => item.level === level)?.color ?? "#9DEA70";
}

export type Direction = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  mood: string[];
  palette: { name: string; hex: string; use: string; dark?: boolean }[];
  fonts: { role: string; name: string; style: CSSProperties; sample: string }[];
  references: string[];
  pros: string[];
  cons: string[];
  /** 画面サンプル。1案に複数あってよい（ホームとチャンネルページなど） */
  screens: { label: string; Screen: () => ReactNode }[];
  Parts: () => ReactNode;
};

/* --- 共通の小物 --------------------------------------------------------------- */

/** ロゴの丸い顔。表情だけ差し替える（どの案でも使う想定） */
/** 丸い印（アイコンやアバターの代わり）。顔は付けない */
export function Mascot({ size = 48, face = PURPLE }: { size?: number; face?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="22" fill={face} />
    </svg>
  );
}

/** 画面サンプル内のサムネイル。写真の代わりに平らな色と丸い顔 */
export function Thumb({ talent, className = "", style }: { talent: Talent; className?: string; style?: CSSProperties }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: talent.color, ...style }}>
      <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full opacity-25" style={{ background: "#fff" }} />
    </div>
  );
}

export function TzNote() {
  const { tx } = useI18n();
  return (
    <span className="inline-flex items-center gap-1">
      <GlobeAsiaAustraliaIcon className="h-4 w-4" aria-hidden />
      {tx("時刻は PHT（あなたの地域）", "Times in PHT (your time)")}
    </span>
  );
}

/* --- 画面サンプルの枠（縮小表示＋最大画面） ------------------------------------------ */

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 900;

export function ScaledFrame({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  // 枠の横幅に合わせて、1440px の画面を縮小する
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / DESIGN_WIDTH));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="relative w-full overflow-hidden" style={{ height: DESIGN_HEIGHT * scale }}>
      <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** 画面サンプルを実寸で全画面表示する。Esc か「閉じる」で戻る */
export function FullscreenPreview({ label, Screen, onClose }: { label: string; Screen: () => ReactNode; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    // 対応ブラウザなら本当の全画面にする（できなくても画面いっぱいの重ね表示で見られる）
    root?.requestFullscreen?.().catch(() => {});
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.body.style.overflow = overflow;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-[300] overflow-auto bg-white" role="dialog" aria-modal="true" aria-label={`${label} の画面サンプル`}>
      <Screen />
      <div className="ui-float fixed bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-sm font-bold">
        <span>{label}</span>
        <button type="button" onClick={onClose} className="ui-btn ui-btn-sm ui-btn-ghost rounded-full" aria-label="閉じる">
          <XMarkIcon className="h-4 w-4" aria-hidden />
          閉じる（Esc）
        </button>
      </div>
    </div>
  );
}
