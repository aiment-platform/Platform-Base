"use client";

/**
 * A「Live Arcade」の派生案。最初の A は黒い枠線と黒い影が強すぎたので、
 * 厚みは今の aiment と同じ「同じ色を濃くした影を真下に出す」やり方に揃えている。
 *
 *   A1. Soft Arcade  … 今の aiment に一番近い。紫＋ライム、斜めの極太見出し
 *   A2. Candy Lobby  … 丸くて甘い。ピンク寄りの背景と珊瑚色、丸文字の見出し
 *   A3. Ink Splash   … 白地にインクのしぶき。旗のようなラベル、マーカー線
 *
 * どの案も 1つのテーマ（ArcadeTheme）を2つの画面の型に流し込んで描く。
 *   ホーム        … A の「試合前のロビー」（いま配信中＋入室待ち＋これからの配信）
 *   チャンネル    … B の「推しの舞台」（推しの色の帯、名前がロゴ、図鑑カード、チケット）
 * B が一番よいという意見だったので、チャンネルページは B の構成をそのまま使っている。
 */
import { TicketIcon } from "@heroicons/react/20/solid";
import type { CSSProperties, ReactNode } from "react";
import { AJL_LEVELS } from "../../lib/ajl";
import { useI18n } from "../../lib/i18n";
import { DELA, Mascot, PURPLE, SESSIONS, TALENTS, Thumb, TzNote, levelColor, rounded, type Direction, type Talent } from "./moodboardKit";

type Session = (typeof SESSIONS)[number];

export type ArcadeTheme = {
  bg: string;
  bgImage?: string;
  bgSize?: string;
  surface: string;
  /** 白い面の下に覗く厚みの色（薄い紫など。黒は使わない） */
  surfaceEdge: string;
  text: string;
  muted: string;
  primary: string;
  primaryEdge: string;
  accent: string;
  accentEdge: string;
  accentText: string;
  lift: number;
  radius: number;
  heading: CSSProperties;
  body: CSSProperties;
  /** ボタン・ラベルなど太くしたい短い文字 */
  strong: CSSProperties;
  skew: number;
  sticker: "tilt" | "pill" | "flag";
  splat?: boolean;
  /** カードの文字の面を、タレントの色でうっすら塗る */
  tintCards?: boolean;
};

const LIVE_RED = "#FF4766";

/** 同じ色を濃くした厚みの色。黒ではなく深い藍色と混ぜるので、くすまない */
function deepen(color: string, amount = 24) {
  return `color-mix(in oklab, ${color} ${100 - amount}%, #2B1D7A)`;
}

function lift(t: ArcadeTheme, edge: string, px = t.lift): CSSProperties {
  return { boxShadow: `0 ${px}px 0 0 ${edge}` };
}

function panel(t: ArcadeTheme, px = t.lift): CSSProperties {
  return { background: t.surface, border: `1.5px solid ${t.surfaceEdge}`, borderRadius: t.radius, ...lift(t, t.surfaceEdge, px) };
}

function seatsLeft(count: number) {
  return `${count} ${count === 1 ? "seat" : "seats"} left`;
}

/* --- 部品 ----------------------------------------------------------------------- */

export function Sticker({ t, bg, edge, color, rotate = -4, children }: { t: ArcadeTheme; bg: string; edge?: string; color?: string; rotate?: number; children: ReactNode }) {
  const base: CSSProperties = { background: bg, color: color ?? t.accentText, ...lift(t, edge ?? deepen(bg), 3), ...t.strong };
  if (t.sticker === "flag") {
    return (
      <span className="inline-block px-3 py-1 text-[13px] leading-none" style={{ ...base, transform: "skewX(-14deg)", borderRadius: 4 }}>
        <span className="inline-block" style={{ transform: "skewX(14deg)" }}>
          {children}
        </span>
      </span>
    );
  }
  if (t.sticker === "pill") {
    return (
      <span className="inline-block rounded-full px-3 py-1 text-[13px] leading-none" style={base}>
        {children}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-lg px-2.5 py-1 text-[13px] leading-none" style={{ ...base, transform: `rotate(${rotate}deg)` }}>
      {children}
    </span>
  );
}

export function Btn({ t, kind = "primary", children }: { t: ArcadeTheme; kind?: "primary" | "accent" | "plain"; children: ReactNode }) {
  const look = {
    primary: { background: t.primary, color: "#fff", edge: t.primaryEdge },
    accent: { background: t.accent, color: t.accentText, edge: t.accentEdge },
    plain: { background: t.surface, color: t.text, edge: t.surfaceEdge },
  }[kind];
  return (
    <button
      type="button"
      className="px-5 py-2.5 text-[15px] transition-transform active:translate-y-1"
      style={{
        background: look.background,
        color: look.color,
        borderRadius: Math.min(t.radius, 16),
        border: kind === "plain" ? `1.5px solid ${t.surfaceEdge}` : "none",
        ...lift(t, look.edge, 5),
        ...t.strong,
      }}
    >
      {children}
    </button>
  );
}

function Heading({ t, size, children, marker }: { t: ArcadeTheme; size: number; children: ReactNode; marker?: string }) {
  return (
    <span className="inline-block leading-[1.15]" style={{ ...t.heading, fontSize: size, transform: t.skew ? `skewX(${t.skew}deg)` : undefined }}>
      {/* A3 は蛍光ペンのような下線を引く。内側を inline にして、折り返した行ごとに線を引く */}
      <span
        style={
          marker
            ? {
                backgroundImage: `linear-gradient(transparent 62%, ${marker} 62%, ${marker} 92%, transparent 92%)`,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }
            : undefined
        }
      >
        {children}
      </span>
    </span>
  );
}

/** A3 のインクのしぶき */
function Splat({ color, className, rotate = 0 }: { color: string; className: string; rotate?: number }) {
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none absolute ${className}`} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
      <path
        fill={color}
        d="M100 18c18 0 22 20 38 24s34-8 42 8-10 30-4 46 26 24 16 40-32 6-44 16-10 34-30 34-22-24-38-30-38 6-46-10 12-28 8-44S8 72 20 58s32-2 44-14 18-26 36-26z"
      />
      <circle cx="182" cy="30" r="9" fill={color} />
      <circle cx="16" cy="170" r="7" fill={color} />
      <circle cx="170" cy="182" r="5" fill={color} />
    </svg>
  );
}

function AjlSticker({ t, level, rotate }: { t: ArcadeTheme; level: number; rotate?: number }) {
  return (
    <Sticker t={t} bg={levelColor(level)} color="#1F2A3A" rotate={rotate}>
      AJL {level}
    </Sticker>
  );
}

function Card({ t, session, index }: { t: ArcadeTheme; session: Session; index: number }) {
  const { tx } = useI18n();
  return (
    <article className="overflow-hidden" style={panel(t)}>
      <div className="relative">
        <Thumb talent={session.talent} className="aspect-video" />
        <span className="absolute left-3 top-3">
          <AjlSticker t={t} level={session.level} rotate={index % 2 ? 4 : -5} />
        </span>
        <span className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs" style={{ background: t.surface, color: t.text, fontWeight: 900, ...lift(t, deepen(session.talent.color, 10), 2) }}>
          {session.time} PHT
        </span>
      </div>
      <div className="p-4" style={t.tintCards ? { background: `color-mix(in srgb, ${session.talent.color} 10%, ${t.surface})` } : undefined}>
        <p className="text-[15px] leading-snug" style={{ fontWeight: 800 }}>
          {tx(session.title, session.titleEn)}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs" style={{ fontWeight: 800 }}>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: session.talent.color }} />
            {tx(session.talent.name, session.talent.nameEn)}
          </span>
          <span style={{ color: t.primaryEdge }}>{tx(`のこり ${session.seats} 枠`, seatsLeft(session.seats))}</span>
        </div>
      </div>
    </article>
  );
}

function Nav({ t, active = 0 }: { t: ArcadeTheme; active?: number }) {
  const { tx } = useI18n();
  return (
    <header style={{ background: t.surface, borderBottom: `1.5px solid ${t.surfaceEdge}`, ...lift(t, t.surfaceEdge, 3) }} className="relative z-10">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/aiment_logotype.svg" alt="aiment" className="h-9 w-auto" />
        <nav className="flex gap-1 text-sm" style={{ fontWeight: 800 }}>
          {[tx("ホーム", "Home"), tx("スケジュール", "Schedule"), tx("チャンネル", "Channels")].map((item, i) => (
            <span key={item} className="rounded-full px-3.5 py-1.5" style={i === active ? { background: t.accent, color: t.accentText, ...lift(t, t.accentEdge, 3) } : { color: t.muted }}>
              {item}
            </span>
          ))}
        </nav>
        <span className="ml-auto flex items-center gap-3 text-sm" style={{ fontWeight: 800 }}>
          <span className="flex items-center gap-1 rounded-full px-3 py-1" style={{ background: t.bg, border: `1.5px solid ${t.surfaceEdge}` }}>
            <TicketIcon className="h-4 w-4" aria-hidden />3
          </span>
          <span className="h-9 w-9 rounded-full" style={{ background: TALENTS.sora.color, ...lift(t, deepen(TALENTS.sora.color), 3) }} />
        </span>
      </div>
    </header>
  );
}

function Backdrop({ t, children }: { t: ArcadeTheme; children: ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: t.bg, backgroundImage: t.bgImage, backgroundSize: t.bgSize, color: t.text, ...t.body }}>
      {children}
    </div>
  );
}

/* --- 画面の型：ホーム（A のロビー） ------------------------------------------------- */

export function HomeScreen({ t }: { t: ArcadeTheme }) {
  const { tx } = useI18n();
  const live = SESSIONS[0];
  return (
    <Backdrop t={t}>
      <Nav t={t} />
      {t.splat ? (
        <>
          <Splat color={`${t.accent}`} className="-left-24 top-40 h-[420px] w-[420px] opacity-60" rotate={20} />
          <Splat color={`${t.primary}33`} className="-right-32 top-[520px] h-[520px] w-[520px]" rotate={-30} />
        </>
      ) : null}
      <main className="relative mx-auto max-w-[1280px] px-8 pb-16 pt-8">
        <section className="grid grid-cols-[1.6fr_1fr] gap-6">
          <div className="grid overflow-hidden" style={panel(t, t.lift + 2)}>
            <div className="grid grid-cols-[1.1fr_1fr]">
              <Thumb talent={live.talent} className="min-h-[300px]" />
              <div className="flex flex-col p-7">
                <div className="flex items-center gap-2">
                  <Sticker t={t} bg={LIVE_RED} color="#fff" rotate={-3}>
                    ● LIVE
                  </Sticker>
                  <AjlSticker t={t} level={live.level} rotate={3} />
                </div>
                <h2 className="mt-5">
                  <Heading t={t} size={34} marker={t.splat ? t.accent : undefined}>
                    {tx("いま話せる", "Talk to a VTuber")}
                    <br />
                    {tx("VTuber がいるよ！", "right now!")}
                  </Heading>
                </h2>
                <p className="mt-3 text-[15px]" style={{ fontWeight: 800 }}>
                  {tx(live.title, live.titleEn)}
                </p>
                <p className="mt-1 text-sm" style={{ color: t.muted, fontWeight: 800 }}>
                  {tx(`${live.talent.name} ・ のこり ${live.seats} 枠`, `${live.talent.nameEn} · ${seatsLeft(live.seats)}`)}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-6">
                  <Btn t={t} kind="accent">
                    {tx("列にならぶ →", "Join the queue →")}
                  </Btn>
                  <Btn t={t} kind="plain">
                    {tx("くわしく", "Details")}
                  </Btn>
                </div>
              </div>
            </div>
          </div>

          {/* 入室待ち。黒い縁取りの代わりに、数字の下に濃い紫の厚みを出す */}
          <div className="flex flex-col p-6 text-white" style={{ background: t.primary, borderRadius: t.radius, ...lift(t, t.primaryEdge, t.lift + 2) }}>
            <p className="text-sm opacity-80" style={{ fontWeight: 900 }}>
              {tx("入室まち", "In queue")}
            </p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-[88px] leading-none" style={{ ...t.heading, color: t.accent, textShadow: `0 6px 0 ${t.primaryEdge}` }}>
                2
              </span>
              <span className="pb-3 text-lg" style={{ fontWeight: 900 }}>
                {tx("ばんめ", "in line")}
              </span>
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full" style={{ background: t.primaryEdge }}>
              <div className="h-full w-2/3 rounded-full" style={{ background: t.accent }} />
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl p-3 text-[13px]" style={{ background: t.surface, color: t.text, fontWeight: 800, ...lift(t, t.primaryEdge, 4) }}>
              <Mascot size={40} face={t.primary} />
              <span>{tx("入室まであと 3 分。マイクを ON にして待っててね", "About 3 min to go. Turn your mic on and hang tight!")}</span>
            </div>
            <div className="mt-auto flex gap-2 pt-5">
              {["3", "2", "1"].map((n, i) => (
                <span
                  key={n}
                  className="grid h-14 flex-1 place-items-center rounded-xl text-3xl"
                  style={{ ...t.heading, background: i === 0 ? t.accent : t.surface, color: i === 0 ? t.accentText : t.text, ...lift(t, i === 0 ? t.accentEdge : t.primaryEdge, 4) }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end gap-4">
            <h3>
              <Heading t={t} size={28} marker={t.splat ? t.accent : undefined}>
                {tx("これからの配信", "Starting soon")}
              </Heading>
            </h3>
            <Sticker t={t} bg={t.accent} rotate={-6}>
              {tx("6 本", "6 streams")}
            </Sticker>
            <span className="ml-auto text-xs" style={{ color: t.muted, fontWeight: 800 }}>
              <TzNote />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-6">
            {SESSIONS.slice(1).map((session, i) => (
              <Card key={session.title} t={t} session={session} index={i} />
            ))}
          </div>
        </section>
      </main>
    </Backdrop>
  );
}

/* --- 画面の型：チャンネル（B の推しの舞台を A の部品で） ---------------------------------- */

function Ticket({ t, session, talent }: { t: ArcadeTheme; session: Session; talent: Talent }) {
  const { tx } = useI18n();
  return (
    <div className="flex overflow-hidden" style={{ ...panel(t, 4), borderColor: `color-mix(in srgb, ${talent.color} 35%, ${t.surfaceEdge})`, boxShadow: `0 4px 0 0 color-mix(in srgb, ${talent.color} 35%, ${t.surfaceEdge})` }}>
      <div className="flex w-24 shrink-0 flex-col items-center justify-center py-4" style={{ background: talent.color, color: talent.ink }}>
        <span className="text-[11px] opacity-80" style={{ fontWeight: 800 }}>
          10/31
        </span>
        <span className="text-xl leading-tight" style={{ ...t.heading }}>
          {session.time}
        </span>
        <span className="text-[10px] opacity-80" style={{ fontWeight: 800 }}>
          PHT
        </span>
      </div>
      <div className="relative w-0 border-l-2 border-dashed" style={{ borderColor: `${talent.color}88` }}>
        <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full" style={{ background: t.bg }} />
        <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full" style={{ background: t.bg }} />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <AjlSticker t={t} level={session.level} rotate={-3} />
          <p className="mt-2 truncate text-[15px]" style={{ fontWeight: 800 }}>
            {tx(session.title, session.titleEn)}
          </p>
        </div>
        <button type="button" className="rounded-full px-5 py-2 text-sm" style={{ background: talent.color, color: talent.ink, fontWeight: 900, ...lift(t, deepen(talent.color), 4) }}>
          {tx("予約", "Book")}
        </button>
      </div>
    </div>
  );
}

export function ChannelScreen({ t }: { t: ArcadeTheme }) {
  const { tx } = useI18n();
  const talent = TALENTS.luna;
  const edge = deepen(talent.color);
  const profile = [
    [tx("誕生日", "Birthday"), tx("3月14日", "March 14")],
    [tx("身長", "Height"), "152cm"],
    [tx("好きなもの", "Likes"), tx("いちご大福・RPG", "Strawberry daifuku, RPGs")],
    [tx("話せる言語", "Languages"), tx("日本語 / English すこし", "Japanese / a little English")],
    [tx("得意レベル", "Best for"), "AJL 1–3"],
  ];
  return (
    <Backdrop t={t}>
      <Nav t={t} active={2} />
      {/* 推しの色で塗られた舞台。下の縁に同じ色の濃い厚みを出す */}
      <section className="relative overflow-hidden" style={{ background: talent.color, color: talent.ink, ...lift(t, edge, 8) }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#fff 2px, transparent 2px)", backgroundSize: "22px 22px" }} />
        {t.splat ? <Splat color="#ffffff33" className="-right-10 -top-24 h-[380px] w-[380px]" rotate={15} /> : null}
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-[auto_1fr_auto] items-end gap-8 px-8 pb-10 pt-12">
          <div className="grid h-40 w-40 place-items-center rounded-full bg-white" style={lift(t, edge, 8)}>
            <Mascot size={120} face={talent.color} />
          </div>
          <div>
            <Sticker t={t} bg={t.accent} rotate={-3}>
              {tx("AJL 1〜3 が得意", "Best for AJL 1–3")}
            </Sticker>
            <h2 className="mt-3 text-white" style={{ textShadow: `0 6px 0 ${edge}` }}>
              <Heading t={t} size={76}>
                {tx(talent.name, talent.nameEn)}
              </Heading>
            </h2>
            <p className="mt-3 max-w-xl text-[15px]" style={{ fontWeight: 800 }}>
              {tx(
                "いっしょにゆっくり話そ！ はじめての日本語でも大丈夫。まちがえても笑わないよ。",
                "Let's take it slow! First time speaking Japanese? No worries — mistakes are totally fine.",
              )}
            </p>
          </div>
          <div className="flex gap-3">
            {[
              ["LIVE", "1"],
              [tx("予定", "Upcoming"), "4"],
              [tx("ファン", "Fans"), "1.2k"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white px-5 py-3 text-center" style={{ color: t.text, ...lift(t, edge, 5) }}>
                <p className="text-3xl" style={{ ...t.heading, color: talent.color }}>
                  {value}
                </p>
                <p className="text-[11px]" style={{ color: t.muted, fontWeight: 800 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="relative mx-auto grid max-w-[1280px] grid-cols-[340px_1fr] gap-8 px-8 py-10">
        <aside className="h-fit overflow-hidden" style={{ ...panel(t), borderColor: `color-mix(in srgb, ${talent.color} 40%, ${t.surfaceEdge})`, boxShadow: `0 ${t.lift}px 0 0 color-mix(in srgb, ${talent.color} 40%, ${t.surfaceEdge})` }}>
          <div className="flex items-center justify-between px-5 py-3 text-white" style={{ background: talent.color }}>
            <span className="text-xs tracking-[0.25em]" style={{ fontWeight: 900 }}>
              PROFILE
            </span>
            <span className="text-xs" style={{ fontWeight: 900 }}>
              No.014
            </span>
          </div>
          <dl className="px-5">
            {profile.map(([k, v], i) => (
              <div key={k} className="flex justify-between gap-4 py-3 text-sm" style={{ borderTop: i ? `1px solid ${talent.color}22` : undefined }}>
                <dt style={{ color: t.muted, fontWeight: 800 }}>{k}</dt>
                <dd className="text-right" style={{ fontWeight: 800 }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="m-5 flex items-center gap-3 rounded-2xl p-4 text-sm" style={{ background: `${talent.color}18`, fontWeight: 800 }}>
            <Mascot size={36} face={talent.color} />
            {tx("自己紹介の枠から来てね！", "Start with the self-intro session!")}
          </div>
        </aside>

        <section>
          <div className="flex items-end gap-3">
            <h3>
              <Heading t={t} size={26} marker={t.splat ? `${talent.color}55` : undefined}>
                {tx("チケット", "Tickets")}
              </Heading>
            </h3>
            <span className="text-xs" style={{ color: t.muted, fontWeight: 800 }}>
              <TzNote />
            </span>
          </div>
          <div className="mt-4 grid gap-4">
            {[SESSIONS[0], SESSIONS[4], SESSIONS[1], SESSIONS[2]].map((session) => (
              <Ticket key={session.title} t={t} session={session} talent={talent} />
            ))}
          </div>
        </section>
      </main>
    </Backdrop>
  );
}

export function Parts({ t }: { t: ArcadeTheme }) {
  const { tx } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-5 p-6 pb-8" style={{ background: t.bg, color: t.text, ...t.body }}>
      <Btn t={t}>{tx("予約する", "Book")}</Btn>
      <Btn t={t} kind="accent">
        {tx("列にならぶ →", "Join the queue →")}
      </Btn>
      <Btn t={t} kind="plain">
        {tx("くわしく", "Details")}
      </Btn>
      <Sticker t={t} bg={t.accent}>
        NEW!
      </Sticker>
      <Sticker t={t} bg={LIVE_RED} color="#fff" rotate={4}>
        ● LIVE
      </Sticker>
      <span className="flex gap-2">
        {AJL_LEVELS.map((level, i) => (
          <Sticker key={level.level} t={t} bg={level.color} color="#1F2A3A" rotate={i % 2 ? 5 : -5}>
            {level.level}
          </Sticker>
        ))}
      </span>
      <span className="px-5 py-3" style={panel(t)}>
        <Heading t={t} size={22} marker={t.splat ? t.accent : undefined}>
          {tx("見出し", "Heading")}
        </Heading>
      </span>
    </div>
  );
}

/* --- テーマ ----------------------------------------------------------------------- */

const ROUNDED_HEAVY: CSSProperties = { ...rounded.style, fontWeight: 900 };
const ROUNDED_BODY: CSSProperties = { ...rounded.style, fontWeight: 800 };

export const SOFT: ArcadeTheme = {
  bg: "#F4F2FF",
  bgImage: `radial-gradient(${PURPLE}1F 1.5px, transparent 1.5px)`,
  bgSize: "18px 18px",
  surface: "#FFFFFF",
  surfaceEdge: "#DCD5FD",
  text: "#2A2340",
  muted: "#7A7394",
  primary: PURPLE,
  primaryEdge: "#5E49EE",
  accent: "#C6F432",
  accentEdge: "#94C21B",
  accentText: "#2A2340",
  lift: 6,
  radius: 22,
  heading: DELA,
  body: ROUNDED_BODY,
  strong: ROUNDED_HEAVY,
  skew: -6,
  sticker: "tilt",
};

const CANDY: ArcadeTheme = {
  bg: "#FFF1F6",
  bgImage: "radial-gradient(circle at 12% 18%, #FFE0EC 0 120px, transparent 121px), radial-gradient(circle at 88% 70%, #EAE6FF 0 180px, transparent 181px)",
  surface: "#FFFFFF",
  surfaceEdge: "#F7D3E3",
  text: "#3A2440",
  muted: "#8E7593",
  primary: PURPLE,
  primaryEdge: "#5E49EE",
  accent: "#FF7A59",
  accentEdge: "#E0573A",
  accentText: "#FFFFFF",
  lift: 7,
  radius: 30,
  heading: ROUNDED_HEAVY,
  body: ROUNDED_BODY,
  strong: ROUNDED_HEAVY,
  skew: 0,
  sticker: "pill",
  tintCards: true,
};

const INKSPLASH: ArcadeTheme = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceEdge: "#E2DDFB",
  text: "#241E3A",
  muted: "#77708F",
  primary: PURPLE,
  primaryEdge: "#5E49EE",
  accent: "#D4F53C",
  accentEdge: "#A3C51A",
  accentText: "#241E3A",
  lift: 5,
  radius: 14,
  heading: DELA,
  body: ROUNDED_BODY,
  strong: ROUNDED_HEAVY,
  skew: -8,
  sticker: "flag",
  splat: true,
};

function screensFor(t: ArcadeTheme) {
  return [
    { label: "ホーム（A のロビー）", Screen: () => <HomeScreen t={t} /> },
    { label: "チャンネルページ（B の構成）", Screen: () => <ChannelScreen t={t} /> },
  ];
}

export const ARCADE_VARIANTS: Direction[] = [
  {
    id: "a1-soft",
    code: "A1",
    name: "Soft Arcade",
    tagline: "最初の A から黒を抜いたもの。今の aiment に一番近い",
    mood: ["紫＋ライム", "薄紫の厚み", "斜めの極太見出し", "ステッカー"],
    palette: [
      { name: "Purple", hex: PURPLE, use: "ブランド・操作。厚みは #5E49EE（今のボタンと同じ）" },
      { name: "Lime", hex: SOFT.accent, use: "2色目。厚みは同じ黄緑を濃くした #94C21B" },
      { name: "Lavender edge", hex: SOFT.surfaceEdge, use: "白い面の下の厚み（黒の代わり）" },
      { name: "Text", hex: SOFT.text, use: "文字。真っ黒ではなく紫寄りの濃い灰" },
      { name: "Background", hex: SOFT.bg, use: "背景（薄い紫のドット）" },
    ],
    fonts: [
      { role: "見出し", name: "Dela Gothic One（斜め 6°）", style: { ...DELA, fontSize: 30, transform: "skewX(-6deg)" }, sample: "いま話せるよ！" },
      { role: "本文・ボタン", name: "M PLUS Rounded 1c", style: { ...ROUNDED_BODY, fontSize: 18 }, sample: "列にならぶ → のこり 2 枠" },
    ],
    references: ["今の aiment のボタン（同じ色の濃い厚み）", "Splatoon 3（斜めの見出し・ステッカー）"],
    pros: ["今の部品をほぼそのまま使える。作り直しが一番少ない", "黒がないので、B の推しの色と並べても喧嘩しない"],
    cons: ["A の中では一番おとなしく、ゲームらしさは控えめ"],
    screens: screensFor(SOFT),
    Parts: () => <Parts t={SOFT} />,
  },
  {
    id: "a2-candy",
    code: "A2",
    name: "Candy Lobby",
    tagline: "丸くて甘い、ショー番組のロビー（Fall Guys 寄り）",
    mood: ["まんまる", "パステル", "珊瑚色", "ぷっくりした厚み"],
    palette: [
      { name: "Purple", hex: PURPLE, use: "ブランド・操作" },
      { name: "Coral", hex: CANDY.accent, use: "2色目。押してほしい所。白文字" },
      { name: "Pink edge", hex: CANDY.surfaceEdge, use: "白い面の下の厚み（ピンク寄り）" },
      { name: "Background", hex: CANDY.bg, use: "背景。大きな丸を薄く置く" },
      { name: "Text", hex: CANDY.text, use: "文字" },
    ],
    fonts: [
      { role: "見出し", name: "M PLUS Rounded 1c Black（傾けない）", style: { ...ROUNDED_HEAVY, fontSize: 30 }, sample: "いま話せるよ！" },
      { role: "本文・ボタン", name: "M PLUS Rounded 1c", style: { ...ROUNDED_BODY, fontSize: 18 }, sample: "列にならぶ → のこり 2 枠" },
    ],
    references: ["Fall Guys（丸さ・明るさ）", "どうぶつの森（丸いアイコンと単色）"],
    pros: ["一番やさしく、初心者や女性ファンに入りやすい", "厚みが大きく丸いので、押せる感じが一番強い"],
    cons: ["幼く見えやすい", "ピンク寄りの背景は、推しの色がピンクのときに埋もれる"],
    screens: screensFor(CANDY),
    Parts: () => <Parts t={CANDY} />,
  },
  {
    id: "a3-ink",
    code: "A3",
    name: "Ink Splash",
    tagline: "白地にインクのしぶき。勢いのあるスポーツ実況っぽさ",
    mood: ["インク", "旗のラベル", "蛍光ペン", "スピード感"],
    palette: [
      { name: "Purple", hex: PURPLE, use: "ブランド・操作。しぶきにも薄く使う" },
      { name: "Lime", hex: INKSPLASH.accent, use: "2色目。しぶき・蛍光ペンの線" },
      { name: "Lavender edge", hex: INKSPLASH.surfaceEdge, use: "白い面の下の厚み" },
      { name: "Background", hex: INKSPLASH.bg, use: "背景は白。しぶきで色を足す" },
      { name: "Text", hex: INKSPLASH.text, use: "文字" },
    ],
    fonts: [
      { role: "見出し", name: "Dela Gothic One（斜め 8°＋蛍光ペン）", style: { ...DELA, fontSize: 30, transform: "skewX(-8deg)", backgroundImage: "linear-gradient(transparent 62%, #D4F53C 62%, #D4F53C 92%, transparent 92%)" }, sample: "いま話せるよ！" },
      { role: "本文・ボタン", name: "M PLUS Rounded 1c", style: { ...ROUNDED_BODY, fontSize: 18 }, sample: "列にならぶ → のこり 2 枠" },
    ],
    references: ["Splatoon 3（インク・旗のようなラベル）", "スポーツ中継のテロップ"],
    pros: ["一番「ゲーム」らしく、スクショで目立つ", "白地なので情報が多い画面でも読みやすい"],
    cons: ["しぶきの置き方にセンスが要る。画面ごとに配置を考える手間", "やりすぎると Splatoon のまねに見える"],
    screens: screensFor(INKSPLASH),
    Parts: () => <Parts t={INKSPLASH} />,
  },
];
