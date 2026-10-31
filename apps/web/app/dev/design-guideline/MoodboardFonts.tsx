"use client";

/**
 * 書体くらべ（A1 Soft Arcade の上で）。
 *
 * 「丸くてかわいい」を基準に、日本語と英語の書体の組み合わせを並べる。
 * 見本の文字はサイトの言語設定（日本語 / English）に合わせて切り替わる。
 * 英語版も大事なので、英語の書体も日本語と同じ重みで比べられるようにしている。
 *
 * 組み合わせ方：font-family に「英語の書体, 日本語の書体」の順で並べる。
 * 英語の書体は日本語の文字を持たないので、ひらがな・漢字だけが自動で日本語の書体に回る。
 * たとえると、英語担当と日本語担当の2人で1つの文を書き分けている状態。
 */
import { Baloo_2, DynaPuff, Fredoka, Hachi_Maru_Pop, Mochiy_Pop_One, Nunito, Quicksand, RocknRoll_One, Zen_Maru_Gothic } from "next/font/google";
import { ArrowsPointingOutIcon, CheckIcon } from "@heroicons/react/20/solid";
import { useCallback, useState, type CSSProperties } from "react";
import { useI18n } from "../../lib/i18n";
import { Btn, ChannelScreen, HomeScreen, SOFT, Sticker, type ArcadeTheme } from "./MoodboardArcade";
import { DELA, FullscreenPreview, ScaledFrame, rounded } from "./moodboardKit";

// next/font の設定は、その場に直接書いた値しか受け付けない（変数や ... で渡すとビルドエラー）。
// 英語の書体は「足りない字を Arial で代わりに出す」仕組み（adjustFontFallback）を切る。
// 切らないと、日本語の約物（・「」など）まで Arial で出てしまう
const nunito = Nunito({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap", preload: false, adjustFontFallback: false });
const fredoka = Fredoka({ weight: ["500", "600", "700"], subsets: ["latin"], display: "swap", preload: false, adjustFontFallback: false });
const baloo = Baloo_2({ weight: ["600", "700", "800"], subsets: ["latin"], display: "swap", preload: false, adjustFontFallback: false });
const quicksand = Quicksand({ weight: ["600", "700"], subsets: ["latin"], display: "swap", preload: false, adjustFontFallback: false });
const dynapuff = DynaPuff({ weight: ["500", "700"], subsets: ["latin"], display: "swap", preload: false, adjustFontFallback: false });

const zenMaru = Zen_Maru_Gothic({ weight: ["500", "700", "900"], subsets: ["latin"], display: "swap", preload: false });
const mochiy = Mochiy_Pop_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const rocknroll = RocknRoll_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const hachimaru = Hachi_Maru_Pop({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

/** 英語の書体 → 日本語の書体 の順に並べた font-family */
function stack(en: { style: { fontFamily: string } }, ja: { style: { fontFamily: string } }) {
  return `${en.style.fontFamily}, ${ja.style.fontFamily}`;
}

// 太さが1種類しかない書体は、ブラウザに太字を重ね描きさせない（字がつぶれる）
const NO_FAKE_BOLD: CSSProperties = { fontSynthesis: "none" };

type FontPair = {
  id: string;
  name: string;
  feel: string;
  heading: CSSProperties;
  headingNames: { ja: string; en: string };
  body: CSSProperties;
  strong: CSSProperties;
  bodyNames: { ja: string; en: string };
  good: string;
  watch: string;
  recommended?: boolean;
};

const ROUNDED_BODY_STACK = stack(nunito, rounded);

const PAIRS: FontPair[] = [
  {
    id: "standard",
    name: "まるっと標準",
    feel: "丸くて太い。かわいいが子どもっぽすぎない",
    heading: { fontFamily: stack(nunito, rounded), fontWeight: 900 },
    headingNames: { ja: "M PLUS Rounded 1c Black", en: "Nunito Black" },
    body: { fontFamily: ROUNDED_BODY_STACK, fontWeight: 800 },
    strong: { fontFamily: ROUNDED_BODY_STACK, fontWeight: 900 },
    bodyNames: { ja: "M PLUS Rounded 1c", en: "Nunito" },
    good: "日本語・英語とも太さが9段階あり、見出しから小さな注記まで1家族で足りる。英語の Nunito は丸さと読みやすさの釣り合いがよい",
    watch: "よく使われている組み合わせなので、これだけでは個性は出にくい（色と厚みで出す）",
    recommended: true,
  },
  {
    id: "soft",
    name: "やわらか上品",
    feel: "線が少し細くて落ち着いた丸ゴシック",
    heading: { fontFamily: stack(quicksand, zenMaru), fontWeight: 700 },
    headingNames: { ja: "Zen Maru Gothic Bold", en: "Quicksand Bold" },
    body: { fontFamily: stack(nunito, zenMaru), fontWeight: 700 },
    strong: { fontFamily: stack(nunito, zenMaru), fontWeight: 900 },
    bodyNames: { ja: "Zen Maru Gothic", en: "Nunito" },
    good: "大人のファンにも違和感がない。本文が長い画面（ガイドライン・設定）でも疲れにくい",
    watch: "ゲームらしさ・勢いは一番弱い。Quicksand は太さの上限が 700 で、見出しが少し細く見える",
  },
  {
    id: "pop",
    name: "ぽってりポップ",
    feel: "おもちのように丸く膨らんだ見出し",
    heading: { fontFamily: stack(fredoka, mochiy), fontWeight: 600, ...NO_FAKE_BOLD },
    headingNames: { ja: "Mochiy Pop One", en: "Fredoka SemiBold" },
    body: { fontFamily: ROUNDED_BODY_STACK, fontWeight: 800 },
    strong: { fontFamily: stack(fredoka, rounded), fontWeight: 700 },
    bodyNames: { ja: "M PLUS Rounded 1c", en: "Nunito" },
    good: "一番「かわいい」。見出しだけで aiment らしい表情が出る。Fredoka はボタンの文字にも合う",
    watch: "Mochiy Pop One は太さが1種類だけ。漢字が多い見出しは窮屈に見える",
  },
  {
    id: "game",
    name: "ゲームのロゴ感",
    feel: "角が丸い極太。ゲームのタイトル画面っぽさ",
    heading: { fontFamily: stack(baloo, rocknroll), fontWeight: 800, ...NO_FAKE_BOLD },
    headingNames: { ja: "RocknRoll One", en: "Baloo 2 ExtraBold" },
    body: { fontFamily: stack(baloo, rounded), fontWeight: 600 },
    strong: { fontFamily: stack(baloo, rounded), fontWeight: 800 },
    bodyNames: { ja: "M PLUS Rounded 1c", en: "Baloo 2" },
    good: "Dela Gothic の勢いを残しつつ角が丸い。数字（時刻・順番）が力強い",
    watch: "Baloo 2 は行の高さが大きめで、英語の本文はやや間延びする",
  },
  {
    id: "hand",
    name: "手書きかわいい",
    feel: "丸文字の手書き。一番やわらかい",
    heading: { fontFamily: stack(dynapuff, hachimaru), fontWeight: 700, ...NO_FAKE_BOLD },
    headingNames: { ja: "Hachi Maru Pop", en: "DynaPuff Bold" },
    body: { fontFamily: stack(nunito, zenMaru), fontWeight: 700 },
    strong: { fontFamily: stack(dynapuff, zenMaru), fontWeight: 700 },
    bodyNames: { ja: "Zen Maru Gothic", en: "Nunito" },
    good: "推しへのメッセージや、マスコットのせりふなど「声」の部分に使うと効く",
    watch: "見出し全部に使うと幼くなりすぎる。日本語を勉強中の人には崩した字が読みにくい",
  },
  {
    id: "dela",
    name: "比較用：今の A1",
    feel: "Dela Gothic One。角ばった極太",
    heading: DELA,
    headingNames: { ja: "Dela Gothic One", en: "Dela Gothic One" },
    body: { fontFamily: rounded.style.fontFamily, fontWeight: 800 },
    strong: { fontFamily: rounded.style.fontFamily, fontWeight: 900 },
    bodyNames: { ja: "M PLUS Rounded 1c", en: "M PLUS Rounded 1c" },
    good: "インパクトは一番強い",
    watch: "いかつい。丸い見た目と合わない",
  },
];

function themeFor(pair: FontPair, skew: boolean): ArcadeTheme {
  return { ...SOFT, heading: pair.heading, body: pair.body, strong: pair.strong, skew: skew ? -6 : 0 };
}

function Specimen({ pair, skew, selected, onSelect }: { pair: FontPair; skew: boolean; selected: boolean; onSelect: () => void }) {
  const { tx, locale } = useI18n();
  const t = themeFor(pair, skew);
  const other = locale === "jp" ? "Talk to a VTuber right now!" : "いま話せる VTuber がいるよ！";
  const tilt: CSSProperties = { transform: skew ? "skewX(-6deg)" : undefined };

  return (
    <article
      className="ui-panel flex flex-col overflow-hidden"
      style={selected ? { borderColor: "var(--brand-primary)", boxShadow: "0 4px 0 0 var(--brand-primary)" } : undefined}
    >
      <header className="flex items-start gap-3 border-b border-[var(--line)] p-5">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-base font-bold">
            {pair.name}
            {pair.recommended ? <span className="rounded-full bg-[var(--brand-primary-soft)] px-2 py-0.5 text-[11px] text-[var(--brand-primary-ink)]">推奨</span> : null}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--brand-text-muted)]">{pair.feel}</p>
        </div>
        <button type="button" onClick={onSelect} aria-pressed={selected} className={`ui-btn ui-btn-sm ${selected ? "ui-btn-primary" : "ui-btn-ghost"}`}>
          {selected ? <CheckIcon className="h-4 w-4" aria-hidden /> : null}
          {selected ? "画面に適用中" : "画面に当てる"}
        </button>
      </header>

      {/* 見本。A1 の背景の上で見る */}
      <div className="grid gap-4 p-5" style={{ background: SOFT.bg, color: SOFT.text }}>
        <p className="text-[32px] leading-[1.15]" style={{ ...pair.heading, ...tilt }}>
          {tx("いま話せる VTuber がいるよ！", "Talk to a VTuber right now!")}
        </p>
        <div className="flex items-end gap-5">
          <span className="text-[26px] leading-none" style={{ ...pair.heading, ...tilt }}>
            {tx("星宮ルナ", "Luna Hoshimiya")}
          </span>
          <span className="text-[26px] leading-none" style={{ ...pair.heading, color: SOFT.primary }}>
            20:30 PHT
          </span>
          <span className="text-[40px] leading-none" style={{ ...pair.heading, color: SOFT.primaryEdge }}>
            2
          </span>
        </div>
        <p className="text-[15px] leading-relaxed" style={pair.body}>
          {tx(
            "はじめての日本語でも大丈夫。まちがえても笑わないよ。のこり 2 枠・AJL 1〜3 向け",
            "First time speaking Japanese? No worries — nobody laughs at mistakes. 2 seats left · For AJL 1–3",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3 pb-1">
          <Btn t={t} kind="accent">
            {tx("列にならぶ →", "Join the queue →")}
          </Btn>
          <Btn t={t}>{tx("予約する", "Book")}</Btn>
          <Sticker t={t} bg={SOFT.accent}>
            {tx("● LIVE 配信中", "● LIVE now")}
          </Sticker>
        </div>
        {/* もう一方の言語も小さく出しておく（切り替えなくてもざっと比べられるように） */}
        <p className="text-sm opacity-60" style={pair.heading}>
          {other}
        </p>
      </div>

      <dl className="grid gap-2 p-5 text-xs leading-relaxed">
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 font-bold text-[var(--brand-text-muted)]">見出し</dt>
          <dd>
            日本語 {pair.headingNames.ja} ／ 英語 {pair.headingNames.en}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 font-bold text-[var(--brand-text-muted)]">本文</dt>
          <dd>
            日本語 {pair.bodyNames.ja} ／ 英語 {pair.bodyNames.en}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 font-bold text-[var(--brand-text-muted)]">○</dt>
          <dd>{pair.good}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 font-bold text-[var(--brand-text-muted)]">△</dt>
          <dd>{pair.watch}</dd>
        </div>
      </dl>
    </article>
  );
}

export function FontBoard() {
  const { locale, setLocale } = useI18n();
  const [pairId, setPairId] = useState(PAIRS[0].id);
  const [skew, setSkew] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const close = useCallback(() => setExpanded(null), []);

  const pair = PAIRS.find((item) => item.id === pairId) ?? PAIRS[0];
  const t = themeFor(pair, skew);
  const screens = [
    { label: "ホーム", Screen: () => <HomeScreen t={t} /> },
    { label: "チャンネルページ", Screen: () => <ChannelScreen t={t} /> },
  ];

  return (
    <div className="grid gap-8">
      <section className="ui-panel grid gap-4 p-6">
        <p className="text-sm leading-relaxed text-[var(--brand-text-muted)]">
          A1（Soft Arcade）の色と厚みの上で、丸くてかわいい書体の組み合わせを比べる。見本の文字はサイトの言語設定に合わせて切り替わる。
          気になる組み合わせの「画面に当てる」を押すと、下のホームとチャンネルページに反映される。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="ui-segment" role="group" aria-label="言語">
            {(
              [
                ["jp", "日本語"],
                ["en", "English"],
              ] as const
            ).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setLocale(value)} aria-pressed={locale === value} className="ui-segment__option px-4 text-sm">
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={skew} onChange={(event) => setSkew(event.target.checked)} className="h-4 w-4 accent-[var(--brand-primary)]" />
            見出しを斜めにする（A のゲームらしさ）
          </label>
          <span className="text-xs text-[var(--brand-text-muted)]">言語の切り替えはサイト全体の設定と同じもの</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {PAIRS.map((item) => (
          <Specimen key={item.id} pair={item} skew={skew} selected={item.id === pairId} onSelect={() => setPairId(item.id)} />
        ))}
      </div>

      <section className="ui-panel overflow-hidden">
        <header className="border-b border-[var(--line)] p-6">
          <h2 className="text-xl font-bold">画面に当てた見本：{pair.name}</h2>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            見出し {pair.headingNames.ja} ＋ {pair.headingNames.en} ／ 本文 {pair.bodyNames.ja} ＋ {pair.bodyNames.en}
          </p>
        </header>
        {screens.map((screen, index) => (
          <div key={screen.label} className="p-6 pb-0 last-of-type:pb-6">
            <div className="mb-2 flex items-center gap-3">
              <p className="text-xs font-bold text-[var(--brand-text-muted)]">画面サンプル（1440×900 を縮小）・ {screen.label}</p>
              <button type="button" onClick={() => setExpanded(index)} className="ui-btn ui-btn-sm ui-btn-primary ml-auto">
                <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden />
                最大画面で見る
              </button>
            </div>
            <div onClick={() => setExpanded(index)} className="cursor-zoom-in overflow-hidden rounded-xl border border-[var(--line)]" aria-hidden>
              <ScaledFrame>
                <screen.Screen />
              </ScaledFrame>
            </div>
          </div>
        ))}
        <div className="h-6" />
      </section>

      {expanded !== null ? <FullscreenPreview label={`書体：${pair.name} — ${screens[expanded].label}`} Screen={screens[expanded].Screen} onClose={close} /> : null}
    </div>
  );
}
