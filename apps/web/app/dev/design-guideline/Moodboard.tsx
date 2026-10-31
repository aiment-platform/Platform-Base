"use client";

/**
 * ブランドの方向性を比べるためのムードボード（見た目の雰囲気を並べた見本）。
 *
 *   A. Live Arcade        … 予約から入室までを「試合前のロビー」にする
 *   B. Oshi Stage         … 主役は推し。チャンネルページをタレントの色で塗る
 *   C. After-School Club  … 放課後の部室。紙・付箋・はんこ
 *   A + B（推奨）          … A を土台に、チャンネルページだけ B
 *
 * B が一番よく、A は好きだが黒が強すぎた、という意見を受けて A の派生案を
 * MoodboardArcade.tsx に分けて追加した（A1〜A3）。共通の部品は moodboardKit.tsx。
 * A1 が一番近いという意見を受けて、A1 の上で書体を比べる MoodboardFonts.tsx を追加した。
 *
 * 各案に「色・文字・部品」の見本と、1440×900 の画面サンプルを置く。
 * 画面サンプルは縮小表示しているので、「最大画面で見る」で実寸を確認する。
 *
 * ここにある色や書体はまだ決定ではない。本番の画面・トークンには入れないこと。
 */
import { ArrowsPointingOutIcon, TicketIcon } from "@heroicons/react/20/solid";
import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { AJL_LEVELS } from "../../lib/ajl";
import { ARCADE_VARIANTS } from "./MoodboardArcade";
import { AjlColorBoard } from "./MoodboardAjl";
import { JoinHeroBoard } from "./MoodboardJoin";
import { TicketFamilyBoard } from "./MoodboardTickets";
import { FontBoard } from "./MoodboardFonts";
import {
  DELA,
  FullscreenPreview,
  INK,
  Mascot,
  PURPLE,
  ScaledFrame,
  SESSIONS,
  TALENTS,
  Thumb,
  TzNote,
  klee,
  levelColor,
  rounded,
  type Direction,
  type Talent,
} from "./moodboardKit";

/* --- A. Live Arcade ------------------------------------------------------------ */

const A = { lime: "#C6F432", bg: "#F3F0FF", ink: INK };
const hard = (offset = 4, color = INK): CSSProperties => ({
  border: `2px solid ${color}`,
  boxShadow: `${offset}px ${offset}px 0 0 ${color}`,
});

function ArcadeSticker({
  children,
  bg = A.lime,
  rotate = -4,
  className = "",
}: {
  children: ReactNode;
  bg?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-[13px] leading-none ${className}`}
      style={{
        ...hard(2),
        background: bg,
        color: INK,
        transform: `rotate(${rotate}deg)`,
        fontFamily: rounded.style.fontFamily,
        fontWeight: 900,
      }}
    >
      {children}
    </span>
  );
}

function ArcadeButton({
  children,
  bg = PURPLE,
  color = "#fff",
}: {
  children: ReactNode;
  bg?: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      className="rounded-xl px-5 py-2.5 text-[15px] transition-transform active:translate-x-1 active:translate-y-1"
      style={{
        ...hard(4),
        background: bg,
        color,
        fontFamily: rounded.style.fontFamily,
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

function ArcadeCard({ session, index }: { session: (typeof SESSIONS)[number]; index: number }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white" style={hard(4)}>
      <div className="relative">
        <Thumb
          talent={session.talent}
          className="aspect-video border-b-2"
          style={{ borderColor: INK }}
        />
        <span className="absolute left-3 top-3">
          <ArcadeSticker bg={levelColor(session.level)} rotate={index % 2 ? 4 : -5}>
            AJL {session.level}
          </ArcadeSticker>
        </span>
        <span
          className="absolute bottom-3 right-3 rounded-md bg-white px-2 py-1 text-xs font-black"
          style={hard(2)}
        >
          {session.time} PHT
        </span>
      </div>
      <div className="p-4">
        <p className="text-[15px] font-bold leading-snug">{session.title}</p>
        <div className="mt-3 flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: session.talent.color, border: `2px solid ${INK}` }}
            />
            {session.talent.name}
          </span>
          <span style={{ color: PURPLE }}>のこり {session.seats} 枠</span>
        </div>
      </div>
    </article>
  );
}

function ArcadeNav({ dark = false }: { dark?: boolean }) {
  return (
    <header
      className="border-b-2"
      style={{ borderColor: INK, background: dark ? INK : "#fff", color: dark ? "#fff" : INK }}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-8">
        <span className="flex items-center gap-2 text-2xl" style={{ ...DELA }}>
          <Mascot size={34} />
          aiment
        </span>
        <nav className="flex gap-1 text-sm font-bold">
          {["ホーム", "スケジュール", "チャンネル"].map((item, i) => (
            <span
              key={item}
              className="rounded-lg px-3 py-1.5"
              style={
                i === 0 ? { background: A.lime, color: INK, border: `2px solid ${INK}` } : undefined
              }
            >
              {item}
            </span>
          ))}
        </nav>
        <span className="ml-auto flex items-center gap-3 text-sm font-bold">
          <span
            className="rounded-full px-3 py-1"
            style={{ border: `2px solid ${dark ? "#fff" : INK}` }}
          >
            <TicketIcon className="mr-1 inline h-4 w-4 align-[-3px]" aria-hidden />3
          </span>
          <span
            className="h-9 w-9 rounded-full"
            style={{ background: TALENTS.sora.color, border: `2px solid ${dark ? "#fff" : INK}` }}
          />
        </span>
      </div>
    </header>
  );
}

function ArcadeScreen() {
  const live = SESSIONS[0];
  return (
    <div
      className="min-h-full"
      style={{
        background: A.bg,
        backgroundImage: `radial-gradient(${PURPLE}22 1.5px, transparent 1.5px)`,
        backgroundSize: "18px 18px",
        color: INK,
        fontFamily: rounded.style.fontFamily,
      }}
    >
      <ArcadeNav />
      <main className="mx-auto max-w-[1280px] px-8 pb-16 pt-8">
        {/* いま配信中 ＋ 入室待ちの列 */}
        <section className="grid grid-cols-[1.6fr_1fr] gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-white" style={hard(6)}>
            <div className="grid grid-cols-[1.1fr_1fr]">
              <Thumb
                talent={live.talent}
                className="h-full min-h-[300px] border-r-2"
                style={{ borderColor: INK }}
              />
              <div className="flex flex-col p-7">
                <div className="flex items-center gap-2">
                  <ArcadeSticker bg="#FF3B5C" rotate={-3}>
                    <span className="text-white">● LIVE</span>
                  </ArcadeSticker>
                  <ArcadeSticker bg={levelColor(live.level)} rotate={3}>
                    AJL {live.level}
                  </ArcadeSticker>
                </div>
                <h2
                  className="mt-5 text-[34px] leading-[1.15]"
                  style={{ ...DELA, transform: "skewX(-6deg)" }}
                >
                  いま話せる
                  <br />
                  VTuber がいるよ！
                </h2>
                <p className="mt-3 text-[15px] font-bold">{live.title}</p>
                <p className="mt-1 text-sm font-bold opacity-70">
                  {live.talent.name} ・ のこり {live.seats} 枠
                </p>
                <div className="mt-auto flex items-center gap-3 pt-6">
                  <ArcadeButton bg={A.lime} color={INK}>
                    列にならぶ →
                  </ArcadeButton>
                  <ArcadeButton bg="#fff" color={INK}>
                    くわしく
                  </ArcadeButton>
                </div>
              </div>
            </div>
          </div>

          {/* マッチング待ち（この案の「看板になる画面」） */}
          <div
            className="flex flex-col rounded-3xl p-6 text-white"
            style={{ ...hard(6), background: PURPLE }}
          >
            <p className="text-sm font-black opacity-80">入室まち</p>
            <div className="mt-2 flex items-end gap-3">
              <span
                className="text-[88px] leading-none"
                style={{ ...DELA, color: A.lime, textShadow: `4px 4px 0 ${INK}` }}
              >
                2
              </span>
              <span className="pb-3 text-lg font-black">ばんめ</span>
            </div>
            <div
              className="mt-4 h-4 overflow-hidden rounded-full bg-white/20"
              style={{ border: `2px solid ${INK}` }}
            >
              <div className="h-full w-2/3" style={{ background: A.lime }} />
            </div>
            <div
              className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-3 text-[13px] font-bold"
              style={{ ...hard(3), color: INK }}
            >
              <Mascot size={40} />
              <span>入室まであと 3 分。マイクを ON にして待っててね</span>
            </div>
            <div className="mt-auto flex gap-2 pt-5">
              {["3", "2", "1"].map((n, i) => (
                <span
                  key={n}
                  className="grid h-14 flex-1 place-items-center rounded-xl text-3xl"
                  style={{ ...hard(3), background: i === 0 ? A.lime : "#fff", color: INK, ...DELA }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end gap-4">
            <h3 className="text-[28px]" style={{ ...DELA, transform: "skewX(-6deg)" }}>
              これからの配信
            </h3>
            <ArcadeSticker rotate={-6}>6 本</ArcadeSticker>
            <span className="ml-auto text-xs font-bold opacity-70">
              <TzNote />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-6">
            {SESSIONS.slice(1).map((session, i) => (
              <ArcadeCard key={session.title} session={session} index={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ArcadeParts() {
  return (
    <div
      className="flex flex-wrap items-center gap-5 p-6"
      style={{ background: A.bg, fontFamily: rounded.style.fontFamily, color: INK }}
    >
      <ArcadeButton>予約する</ArcadeButton>
      <ArcadeButton bg={A.lime} color={INK}>
        列にならぶ →
      </ArcadeButton>
      <ArcadeSticker>NEW!</ArcadeSticker>
      <ArcadeSticker bg="#FF3B5C" rotate={4}>
        <span className="text-white">● LIVE</span>
      </ArcadeSticker>
      <span className="flex gap-2">
        {AJL_LEVELS.map((level, i) => (
          <ArcadeSticker key={level.level} bg={level.color} rotate={i % 2 ? 5 : -5}>
            {level.level}
          </ArcadeSticker>
        ))}
      </span>
    </div>
  );
}

/* --- B. Oshi Stage ------------------------------------------------------------- */

function OshiTicket({ session, talent }: { session: (typeof SESSIONS)[number]; talent: Talent }) {
  return (
    <div
      className="flex overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]"
      style={{ border: `1.5px solid ${talent.color}55` }}
    >
      <div
        className="flex w-24 shrink-0 flex-col items-center justify-center py-4"
        style={{ background: talent.color, color: talent.ink }}
      >
        <span className="text-[11px] font-bold opacity-80">10/31</span>
        <span className="text-2xl font-black leading-tight">{session.time}</span>
        <span className="text-[10px] font-bold opacity-80">PHT</span>
      </div>
      {/* もぎり線 */}
      <div
        className="relative w-0 border-l-2 border-dashed"
        style={{ borderColor: `${talent.color}66` }}
      >
        <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-[#FFF5FA]" />
        <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-[#FFF5FA]" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-[0.2em]" style={{ color: talent.color }}>
            1ON1 TICKET ・ AJL {session.level}
          </p>
          <p className="mt-1 truncate text-[15px] font-bold">{session.title}</p>
        </div>
        <button
          type="button"
          className="rounded-full px-5 py-2 text-sm font-black"
          style={{ background: talent.color, color: talent.ink }}
        >
          予約
        </button>
      </div>
    </div>
  );
}

function OshiScreen() {
  const t = TALENTS.luna;
  const profile = [
    ["誕生日", "3月14日"],
    ["身長", "152cm"],
    ["好きなもの", "いちご大福・RPG"],
    ["話せる言語", "日本語 / English すこし"],
    ["得意レベル", "AJL 1〜3"],
  ];
  return (
    <div className="min-h-full" style={{ background: "#FFF5FA", color: INK }}>
      {/* aiment は控えめなナビだけ */}
      <header className="border-b bg-white" style={{ borderColor: `${t.color}33` }}>
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 px-8 text-sm font-bold">
          <span className="flex items-center gap-2 text-lg">
            <Mascot size={26} />
            aiment
          </span>
          <span className="opacity-60">ホーム</span>
          <span className="opacity-60">スケジュール</span>
        </div>
      </header>

      {/* 推しの色で塗られたステージ */}
      <section className="relative overflow-hidden" style={{ background: t.color, color: t.ink }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-[auto_1fr_auto] items-end gap-8 px-8 pb-10 pt-12">
          <div className="grid h-40 w-40 place-items-center rounded-[40px] bg-white/25 ring-8 ring-white/40">
            <Mascot size={110} face="rgba(255,255,255,0.35)" />
          </div>
          <div>
            <p className="text-sm font-black tracking-[0.3em] opacity-80">HOSHIMIYA LUNA</p>
            {/* 名前そのものをロゴとして扱う */}
            <h2
              className="mt-1 text-[76px] leading-none"
              style={{ ...DELA, textShadow: "0 6px 0 rgba(0,0,0,0.12)" }}
            >
              星宮ルナ
            </h2>
            <p className="mt-3 max-w-xl text-[15px] font-bold leading-relaxed">
              いっしょにゆっくり話そ！ はじめての日本語でも大丈夫。まちがえても笑わないよ。
            </p>
          </div>
          <div className="flex gap-3">
            {[
              ["LIVE", "1"],
              ["予定", "4"],
              ["ファン", "1.2k"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-white/90 px-5 py-3 text-center"
                style={{ color: INK }}
              >
                <p className="text-2xl font-black" style={{ color: t.color }}>
                  {value}
                </p>
                <p className="text-[11px] font-bold opacity-60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1280px] grid-cols-[340px_1fr] gap-8 px-8 py-10">
        {/* 図鑑のようなプロフィールカード（VSPO! 系） */}
        <aside
          className="h-fit overflow-hidden rounded-3xl bg-white"
          style={{ border: `2px solid ${t.color}` }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 text-white"
            style={{ background: t.color }}
          >
            <span className="text-xs font-black tracking-[0.25em]">PROFILE</span>
            <span className="text-xs font-black">No.014</span>
          </div>
          <dl className="divide-y px-5" style={{ borderColor: `${t.color}22` }}>
            {profile.map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 py-3 text-sm"
                style={{ borderColor: `${t.color}22` }}
              >
                <dt className="font-bold opacity-60">{k}</dt>
                <dd className="text-right font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div
            className="m-5 rounded-2xl p-4 text-sm font-bold leading-relaxed"
            style={{ background: `${t.color}18` }}
          >
            「ルナのおすすめ」
            <br />
            自己紹介の枠から来てね！
          </div>
        </aside>

        <section>
          <div className="flex items-end gap-3">
            <h3 className="text-2xl font-black">チケット</h3>
            <span className="text-xs font-bold opacity-60">
              <TzNote />
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {SESSIONS.filter((s) => s.talent === t)
              .concat(SESSIONS.slice(1, 3))
              .map((session) => (
                <OshiTicket key={session.title} session={session} talent={t} />
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function OshiParts() {
  return (
    <div className="grid gap-4 p-6" style={{ background: "#FFF5FA", color: INK }}>
      <div className="flex flex-wrap gap-3">
        {Object.values(TALENTS).map((talent) => (
          <span
            key={talent.name}
            className="rounded-full px-4 py-2 text-sm font-black"
            style={{ background: talent.color, color: talent.ink }}
          >
            {talent.name}
          </span>
        ))}
      </div>
      <OshiTicket session={SESSIONS[0]} talent={TALENTS.luna} />
      <OshiTicket session={SESSIONS[1]} talent={TALENTS.sora} />
    </div>
  );
}

/* --- C. After-School Club ------------------------------------------------------ */

const C = { paper: "#FFF8EC", line: "#E9DCC4", red: "#E2483D", ink: "#3A2E2A" };

function Stamp({ children, size = 72 }: { children: ReactNode; size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full text-center leading-tight"
      style={{
        width: size,
        height: size,
        border: `3px solid ${C.red}`,
        color: C.red,
        transform: "rotate(-12deg)",
        fontFamily: klee.style.fontFamily,
        fontWeight: 600,
        fontSize: size / 5.2,
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  );
}

function StickyNote({ session, index }: { session: (typeof SESSIONS)[number]; index: number }) {
  const tilt = [-2, 1.5, -1, 2, -1.5][index % 5];
  return (
    <article
      className="relative bg-white p-4 pt-6"
      style={{
        transform: `rotate(${tilt}deg)`,
        boxShadow: "0 2px 0 rgba(58,46,42,0.12)",
        border: `1px solid ${C.line}`,
      }}
    >
      {/* マスキングテープ */}
      <span
        className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-3deg]"
        style={{ background: `${levelColor(session.level)}AA` }}
      />
      <Thumb talent={session.talent} className="aspect-video rounded-sm" />
      <p className="mt-3 text-[11px] font-bold" style={{ color: C.red }}>
        {session.time} PHT ・ レベル {session.level}
      </p>
      <p
        className="mt-1 text-[15px] leading-snug"
        style={{ fontFamily: klee.style.fontFamily, fontWeight: 600 }}
      >
        {session.title}
      </p>
      <p className="mt-2 text-xs opacity-70">{session.talent.name} 先輩</p>
      {index === 1 ? (
        <span className="absolute -right-3 -top-4">
          <Stamp size={60}>
            予約
            <br />
            ずみ
          </Stamp>
        </span>
      ) : null}
    </article>
  );
}

function ClubScreen() {
  return (
    <div
      className="min-h-full"
      style={{
        background: C.paper,
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px)`,
        backgroundSize: "100% 32px",
        color: C.ink,
      }}
    >
      <header className="border-b bg-[#FFF8EC]" style={{ borderColor: C.line }}>
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-8 text-sm font-bold">
          <span
            className="flex items-center gap-2 text-xl"
            style={{ fontFamily: klee.style.fontFamily, fontWeight: 600 }}
          >
            <Mascot size={32} />
            aiment 日本語部
          </span>
          <span>部室</span>
          <span className="opacity-60">時間割</span>
          <span className="opacity-60">先輩たち</span>
          <span
            className="ml-auto rounded-full bg-white px-3 py-1"
            style={{ border: `1px solid ${C.line}` }}
          >
            出席シール 12 枚
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-8 pb-16 pt-10">
        <section className="grid grid-cols-[1fr_360px] gap-10">
          {/* 黒板 */}
          <div
            className="relative rounded-xl p-8 text-white"
            style={{ background: "#2F4A3A", border: "10px solid #9C6B3F" }}
          >
            <p className="text-sm opacity-80" style={{ fontFamily: klee.style.fontFamily }}>
              10月31日（金）　日直：星宮ルナ
            </p>
            <h2
              className="mt-3 text-[40px] leading-tight"
              style={{ fontFamily: klee.style.fontFamily, fontWeight: 600 }}
            >
              今日の部活、
              <br />
              もう始まってるよ。
            </h2>
            <p className="mt-3 text-[15px] opacity-90">
              「はじめての自己紹介れんしゅう」 ・ のこり 2 席
            </p>
            <button
              type="button"
              className="mt-6 rounded-lg px-6 py-3 text-[15px] font-bold"
              style={{ background: "#FFF8EC", color: C.ink }}
            >
              部室に入る
            </button>
            <span className="absolute bottom-6 right-6 h-2 w-16 rounded bg-white/70" />
          </div>

          {/* 先輩のひとこと */}
          <div className="flex flex-col gap-4">
            <div
              className="relative rounded-2xl bg-white p-5 text-[15px] leading-relaxed"
              style={{ border: `1px solid ${C.line}`, fontFamily: klee.style.fontFamily }}
            >
              きょうは「〜てもいいですか」を使ってみよう。まちがえても大丈夫！
              <span
                className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 bg-white"
                style={{ borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
              />
            </div>
            <div className="flex items-center gap-3 pl-6">
              <Mascot size={56} face={TALENTS.luna.color} />
              <span className="text-sm font-bold">ルナ先輩</span>
            </div>
            <div
              className="mt-2 rounded-2xl bg-white p-5"
              style={{ border: `1px solid ${C.line}` }}
            >
              <p className="text-xs font-bold opacity-60">今週の出席カード</p>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => (
                  <div key={d} className="text-center text-[11px]">
                    <div
                      className="mx-auto grid h-9 w-9 place-items-center rounded-full"
                      style={{
                        border: `1.5px dashed ${C.line}`,
                        background: i < 4 ? levelColor((i % 3) + 1) : "transparent",
                      }}
                    >
                      {i < 4 ? <Mascot size={22} face="transparent" /> : null}
                    </div>
                    <span className="mt-1 block">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h3
            className="text-[26px]"
            style={{ fontFamily: klee.style.fontFamily, fontWeight: 600 }}
          >
            今日の時間割
            <span
              className="ml-3 align-middle text-xs font-bold opacity-60"
              style={{ fontFamily: "inherit" }}
            >
              <TzNote />
            </span>
          </h3>
          <div className="mt-6 grid grid-cols-5 gap-6">
            {SESSIONS.slice(1).map((session, i) => (
              <StickyNote key={session.title} session={session} index={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ClubParts() {
  return (
    <div
      className="flex flex-wrap items-center gap-8 p-6"
      style={{ background: C.paper, color: C.ink }}
    >
      <Stamp>
        予約
        <br />
        ずみ
      </Stamp>
      <Stamp>
        よく
        <br />
        できました
      </Stamp>
      <div className="w-44">
        <StickyNote session={SESSIONS[2]} index={0} />
      </div>
      <button
        type="button"
        className="rounded-lg px-6 py-3 text-[15px] font-bold text-white"
        style={{ background: C.red }}
      >
        部室に入る
      </button>
    </div>
  );
}

/* --- A + B（推奨）: A の部品で、チャンネルページだけ推しの色 ---------------------- */

function HybridScreen() {
  const t = TALENTS.sora;
  return (
    <div
      className="min-h-full"
      style={{ background: A.bg, color: INK, fontFamily: rounded.style.fontFamily }}
    >
      <ArcadeNav />
      <section
        className="relative overflow-hidden border-b-2"
        style={{ background: t.color, borderColor: INK }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(#fff 2px, transparent 2px)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-[auto_1fr_auto] items-end gap-8 px-8 pb-10 pt-12">
          <div className="grid h-40 w-40 place-items-center rounded-full bg-white" style={hard(6)}>
            <Mascot size={120} face={t.color} />
          </div>
          <div>
            <ArcadeSticker rotate={-3}>AJL 3〜5 が得意</ArcadeSticker>
            <h2
              className="mt-3 text-[72px] leading-none"
              style={{
                ...DELA,
                transform: "skewX(-6deg)",
                color: INK,
                textShadow: "4px 4px 0 #fff",
              }}
            >
              雨音ソラ
            </h2>
            <p className="mt-3 max-w-xl text-[15px] font-bold">
              アニメとゲームの話ならまかせて。速く話しすぎたら止めてね！
            </p>
          </div>
          <div className="flex gap-3">
            {[
              ["予定", "6"],
              ["ファン", "860"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-white px-5 py-3 text-center"
                style={hard(4)}
              >
                <p className="text-3xl" style={{ ...DELA }}>
                  {value}
                </p>
                <p className="text-[11px] font-bold opacity-60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1280px] px-8 pb-16 pt-8">
        <div className="flex gap-2 text-sm font-black">
          {["配信予定", "アーカイブ", "プロフィール"].map((tab, i) => (
            <span
              key={tab}
              className="rounded-xl px-4 py-2"
              style={
                i === 0
                  ? { ...hard(3), background: t.color }
                  : { border: "2px solid transparent", opacity: 0.6 }
              }
            >
              {tab}
            </span>
          ))}
          <span className="ml-auto self-center text-xs font-bold opacity-70">
            <TzNote />
          </span>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-6">
          {SESSIONS.slice(0, 3).map((session, i) => (
            <ArcadeCard key={session.title} session={{ ...session, talent: t }} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

/* --- 案の一覧 ------------------------------------------------------------------ */

const DIRECTIONS: Direction[] = [
  {
    id: "arcade",
    code: "A",
    name: "Live Arcade",
    tagline: "予約から入室までを「試合前のロビー」にする",
    mood: ["ワクワク", "いま・ここ", "ゲームのロビー", "ステッカー"],
    palette: [
      { name: "Purple", hex: PURPLE, use: "ブランド・操作（今のまま）" },
      { name: "Lime", hex: A.lime, use: "2色目。いま・入室・押してほしい所" },
      { name: "Ink", hex: INK, use: "黒い枠線と厚み", dark: true },
      { name: "Lavender", hex: A.bg, use: "背景（ドット柄）" },
      { name: "Live Red", hex: "#FF3B5C", use: "LIVE だけ" },
    ],
    fonts: [
      {
        role: "見出し",
        name: "Dela Gothic One",
        style: { ...DELA, fontSize: 30, transform: "skewX(-6deg)" },
        sample: "いま話せるよ！",
      },
      {
        role: "本文・ボタン",
        name: "M PLUS Rounded 1c",
        style: { fontFamily: rounded.style.fontFamily, fontWeight: 800, fontSize: 18 },
        sample: "列にならぶ → のこり 2 枠",
      },
    ],
    references: [
      "Splatoon 3（インク・ステッカー）",
      "Fall Guys（ショー番組の明るさ）",
      "Gumroad（黒枠＋ぼかさない影）",
    ],
    pros: [
      "「ライブ」と「ワクワク」が一番伝わる",
      "今の「平ら＋硬い厚み」に黒枠を足すだけで近づく",
    ],
    cons: ["子どもっぽく見える危険", "待ち時間の演出など、動きを作る手間が増える"],
    screens: [{ label: "ホーム（いま配信中＋入室待ち）", Screen: ArcadeScreen }],
    Parts: ArcadeParts,
  },
  {
    id: "oshi",
    code: "B",
    name: "Oshi Stage",
    tagline: "主役は推し。aiment は舞台装置に徹する",
    mood: ["推しの色", "名前がロゴ", "図鑑カード", "チケット"],
    palette: [
      { name: "Talent", hex: TALENTS.luna.color, use: "タレントごとに差し替わる色" },
      { name: "Talent tint", hex: "#FFF5FA", use: "その色をごく薄くした背景" },
      { name: "Ink", hex: INK, use: "本文", dark: true },
      { name: "Purple", hex: PURPLE, use: "aiment 自体は控えめに（ナビのロゴだけ）" },
    ],
    fonts: [
      {
        role: "タレント名",
        name: "Dela Gothic One",
        style: { ...DELA, fontSize: 34 },
        sample: "星宮ルナ",
      },
      {
        role: "本文",
        name: "システム書体（今のまま）",
        style: { fontWeight: 700, fontSize: 18 },
        sample: "1ON1 TICKET ・ 20:00 PHT",
      },
    ],
    references: [
      "プロセカ（ユニットの色で画面が染まる）",
      "VSPO!（図鑑のようなプロフィール）",
      "hololive（名前をロゴとして扱う）",
    ],
    pros: ["VTuber ファンの文化に一番なじむ", "タレントが自分のページをシェアしたくなる"],
    cons: [
      "aiment 自体の印象が薄くなる",
      "タレントの色ごとに文字の読みやすさ（コントラスト）を確認する必要",
    ],
    screens: [{ label: "チャンネルページ（星宮ルナ）", Screen: OshiScreen }],
    Parts: OshiParts,
  },
  {
    id: "club",
    code: "C",
    name: "After-School Club",
    tagline: "放課後の部室で、先輩と日本語を話す",
    mood: ["あたたかい", "紙と付箋", "はんこ", "先輩"],
    palette: [
      { name: "Paper", hex: C.paper, use: "背景（罫線の入った紙）" },
      { name: "Stamp Red", hex: C.red, use: "2色目。はんこ・押してほしい所" },
      { name: "Blackboard", hex: "#2F4A3A", use: "大事なお知らせ（黒板）", dark: true },
      { name: "Brown ink", hex: C.ink, use: "本文", dark: true },
      { name: "Purple", hex: PURPLE, use: "ロゴのみに後退" },
    ],
    fonts: [
      {
        role: "見出し・手書き",
        name: "Klee One",
        style: { fontFamily: klee.style.fontFamily, fontWeight: 600, fontSize: 28 },
        sample: "今日の部活、始まってるよ",
      },
      {
        role: "本文",
        name: "システム書体（今のまま）",
        style: { fontWeight: 700, fontSize: 18 },
        sample: "20:30 PHT ・ レベル 3",
      },
    ],
    references: [
      "Duolingo（遊ぶように学ぶ）",
      "日本の学校文化（黒板・出席カード）",
      "LINE スタンプ（キャラの表情）",
    ],
    pros: ["「学び」が一番伝わる", "日本の学校への憧れに刺さる"],
    cons: ["ライブ感が弱い", "Duolingo に似すぎるおそれ", "紙の質感は作り込むほど重くなる"],
    screens: [{ label: "ホーム（今日の部活）", Screen: ClubScreen }],
    Parts: ClubParts,
  },
  {
    id: "hybrid",
    code: "A+B",
    name: "Arcade × Oshi（推奨）",
    tagline: "全体は A。チャンネルページだけ推しの色で塗る",
    mood: ["A の部品", "推しの色", "aiment らしさは残す"],
    palette: [
      { name: "Purple", hex: PURPLE, use: "ブランド・操作" },
      { name: "Lime", hex: A.lime, use: "2色目" },
      { name: "Talent", hex: TALENTS.sora.color, use: "チャンネルページの帯とタブだけ" },
      { name: "Ink", hex: INK, use: "黒い枠線と厚み", dark: true },
    ],
    fonts: [
      {
        role: "見出し・タレント名",
        name: "Dela Gothic One",
        style: { ...DELA, fontSize: 30, transform: "skewX(-6deg)" },
        sample: "雨音ソラ",
      },
      {
        role: "本文",
        name: "M PLUS Rounded 1c",
        style: { fontFamily: rounded.style.fontFamily, fontWeight: 800, fontSize: 18 },
        sample: "AJL 3〜5 が得意",
      },
    ],
    references: ["A の参考すべて", "プロセカ（色の差し替え）"],
    pros: [
      "どのページを見ても aiment と分かり、チャンネルでは推しが主役",
      "推しの色は帯・タブ・カードの点だけなので、読みやすさの確認が少なくて済む",
    ],
    cons: ["部品が A と共通なぶん、B ほど推しの世界観には浸れない"],
    screens: [{ label: "チャンネルページ（雨音ソラ）", Screen: HybridScreen }],
    Parts: ArcadeParts,
  },
];

/* --- 本体 ---------------------------------------------------------------------- */

function DirectionBoard({
  direction,
  onExpand,
}: {
  direction: Direction;
  onExpand: (screenIndex: number) => void;
}) {
  const { Parts } = direction;
  return (
    <section id={`mood-${direction.id}`} className="ui-panel scroll-mt-24 overflow-hidden">
      <header className="flex flex-wrap items-start gap-4 border-b border-[var(--line)] p-6">
        <span className="grid h-12 min-w-12 place-items-center rounded-xl bg-[var(--brand-primary-soft)] px-2 text-lg font-black text-[var(--brand-primary-ink)]">
          {direction.code}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{direction.name}</h2>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{direction.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {direction.mood.map((word) => (
              <span
                key={word}
                className="rounded-full bg-[var(--brand-bg-900)] px-2.5 py-1 text-xs font-bold"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="mb-2 text-xs font-bold text-[var(--brand-text-muted)]">色</p>
          <div className="grid gap-2">
            {direction.palette.map((swatch) => (
              <div key={swatch.name} className="flex items-center gap-3">
                <span
                  className="h-10 w-14 shrink-0 rounded-lg border border-[var(--line)]"
                  style={{ background: swatch.hex }}
                />
                <span className="w-24 shrink-0 text-sm font-bold">{swatch.name}</span>
                <code className="w-20 shrink-0 text-xs text-[var(--brand-text-muted)]">
                  {swatch.hex}
                </code>
                <span className="min-w-0 text-xs text-[var(--brand-text-muted)]">{swatch.use}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-[var(--brand-text-muted)]">文字</p>
          <div className="grid gap-3">
            {direction.fonts.map((font) => (
              <div key={font.role} className="rounded-xl bg-[var(--brand-bg-900)] p-4">
                <p className="text-[11px] font-bold text-[var(--brand-text-muted)]">
                  {font.role} ・ {font.name}
                </p>
                <p className="mt-1 leading-tight" style={font.style}>
                  {font.sample}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6">
        <p className="mb-2 text-xs font-bold text-[var(--brand-text-muted)]">部品</p>
        <div className="overflow-hidden rounded-xl border border-[var(--line)]">
          <Parts />
        </div>
      </div>

      {direction.screens.map((screen, index) => (
        <div key={screen.label} className="p-6 pb-0 last-of-type:pb-6">
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-bold text-[var(--brand-text-muted)]">
              画面サンプル（1440×900 を縮小）・ {screen.label}
            </p>
            <button
              type="button"
              onClick={() => onExpand(index)}
              className="ui-btn ui-btn-sm ui-btn-primary ml-auto"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden />
              最大画面で見る
            </button>
          </div>
          {/* 見本の中にボタンがあるので button では包めない。操作は上の「最大画面で見る」が担う */}
          <div
            onClick={() => onExpand(index)}
            className="cursor-zoom-in overflow-hidden rounded-xl border border-[var(--line)]"
            aria-hidden
          >
            <ScaledFrame>
              <screen.Screen />
            </ScaledFrame>
          </div>
        </div>
      ))}
      <div className="h-6" />

      <div className="grid gap-4 border-t border-[var(--line)] p-6 text-sm md:grid-cols-3">
        <div>
          <p className="mb-1.5 text-xs font-bold text-[var(--brand-text-muted)]">参考</p>
          <ul className="grid gap-1">
            {direction.references.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold text-[var(--brand-text-muted)]">向いている点</p>
          <ul className="grid gap-1">
            {direction.pros.map((item) => (
              <li key={item}>○ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold text-[var(--brand-text-muted)]">弱い点</p>
          <ul className="grid gap-1">
            {direction.cons.map((item) => (
              <li key={item}>△ {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** どの案でも使う：2色目の候補 */
function CommonBoard() {
  const candidates = [
    { name: "Discord（比較用）", hex: "#5865F2", note: "今の紫とほぼ同じ色相" },
    { name: "Lime", hex: "#C6F432", note: "A 案。一番ゲームっぽい" },
    { name: "Coral", hex: "#FF7A59", note: "あたたかい。C 案とも合う" },
    { name: "Sky", hex: "#3EC7F5", note: "さわやか。紫と隣り合うので差は小さめ" },
    { name: "Sunflower", hex: "#FFC93C", note: "注意の黄色とかぶる" },
  ];
  return (
    <section className="ui-panel p-6">
      <h2 className="text-xl font-bold">どの案でも使うもの</h2>
      <p className="mb-3 mt-5 text-xs font-bold text-[var(--brand-text-muted)]">2色目の候補（紫 {PURPLE} と並べたとき）</p>
      <div className="grid gap-2">
        {candidates.map((item) => (
          <div key={item.hex} className="flex items-center gap-3">
            <span className="flex overflow-hidden rounded-lg border border-[var(--line)]">
              <span className="h-10 w-10" style={{ background: PURPLE }} />
              <span className="h-10 w-10" style={{ background: item.hex }} />
            </span>
            <span className="w-36 shrink-0 text-sm font-bold">{item.name}</span>
            <span className="text-xs text-[var(--brand-text-muted)]">{item.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const GROUPS = [
  { id: "join", label: "join ページ", directions: [] },
  { id: "tickets", label: "チケットの展開", directions: [] },
  { id: "ajl", label: "AJL の色", directions: [] },
  { id: "fonts", label: "書体くらべ（A1）", directions: [] },
  { id: "arcade", label: "A の派生（黒を使わない厚み）", directions: ARCADE_VARIANTS },
  { id: "first", label: "最初の4案", directions: DIRECTIONS },
] as const;

export function Moodboard() {
  const [groupId, setGroupId] = useState<(typeof GROUPS)[number]["id"]>("tickets");
  const [expanded, setExpanded] = useState<{ id: string; screen: number } | null>(null);
  const group = GROUPS.find((item) => item.id === groupId) ?? GROUPS[0];
  const expandedDirection =
    group.directions.find((direction) => direction.id === expanded?.id) ?? null;
  const close = useCallback(() => setExpanded(null), []);

  return (
    <div className="grid gap-8">
      <div className="ui-panel p-6">
        <p className="text-sm leading-relaxed text-[var(--brand-text-muted)]">
          ブランドの方向性を決めるための見本。色・書体はまだ決定ではなく、本番の画面には入れていない。各案の「最大画面で見る」で、PC
          の画面いっぱいにしたときの見た目を確認できる。
        </p>
        <div className="ui-segment mt-4" role="group" aria-label="見本のまとまり">
          {GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroupId(item.id)}
              aria-pressed={item.id === groupId}
              className="ui-segment__option px-4 text-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
        {group.directions.length ? (
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="案の一覧">
            {group.directions.map((direction) => (
              <a
                key={direction.id}
                href={`#mood-${direction.id}`}
                onClick={(event) => {
                  // ハッシュはタブの切り替えに使っているので、スクロールだけする
                  event.preventDefault();
                  document
                    .getElementById(`mood-${direction.id}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="ui-btn ui-btn-sm ui-btn-ghost"
              >
                {direction.code}. {direction.name}
              </a>
            ))}
          </nav>
        ) : null}
      </div>

      {groupId === "fonts" ? <FontBoard /> : null}
      {groupId === "ajl" ? <AjlColorBoard /> : null}
      {groupId === "join" ? <JoinHeroBoard /> : null}
      {groupId === "tickets" ? <TicketFamilyBoard /> : null}

      {groupId === "fonts" || groupId === "ajl" || groupId === "join" || groupId === "tickets" ? null : groupId === "arcade" ? (
        <p className="-mb-4 text-sm leading-relaxed text-[var(--brand-text-muted)]">
          3案とも、厚みは今の aiment
          のボタンと同じ「同じ色を濃くした影を真下に出す」形。黒い枠線と黒い影は使っていない。
          画面サンプルは2枚ずつで、ホームは A のロビー、チャンネルページは B
          の構成（推しの色の帯・名前がロゴ・図鑑カード・チケット）をその案の部品で描いている。
        </p>
      ) : (
        <CommonBoard />
      )}

      {group.directions.map((direction) => (
        <DirectionBoard
          key={direction.id}
          direction={direction}
          onExpand={(screen) => setExpanded({ id: direction.id, screen })}
        />
      ))}

      {expandedDirection && expanded ? (
        <FullscreenPreview
          label={`${expandedDirection.code}. ${expandedDirection.name} — ${expandedDirection.screens[expanded.screen].label}`}
          Screen={expandedDirection.screens[expanded.screen].Screen}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
