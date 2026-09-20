import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PlayIcon } from "@heroicons/react/24/outline";

import { RoleDiagram } from "../components/landing/RoleDiagram";
import { WaveEdge } from "../components/landing/WaveEdge";
import { BODY, FaqItem, Lines as BreakLines, Section, SectionTitle, X_HANDLE, X_URL, XMark } from "../components/landing/primitives";
import { MembershipCard } from "./MembershipCard";
import { mockSlots, STYLE_LABEL, type SupporterStyle } from "./slots";
import { StyleDiagram } from "./StyleDiagram";
import { SupporterSlotCard } from "./SupporterSlotCard";
import {
  SceneBackup,
  SceneEnd,
  SceneGather,
  SceneHero,
  SceneNativeMix,
  SceneStart,
  SceneWatch,
} from "./SupporterScenes";

/**
 * 日本のファン向けの aiment 入口ページ。日本のファンの参加方法「メイト（Mate）」を案内する。
 *
 * 前半は学習者向けLP（/lp）と同じ：aimentって何？ → 実際のセッション映像。
 * そのあと（LPで3STEPSに入るところ）からメイトの話に切り替える：
 * メイトとは → できること → 参加スタイル → 1回の例 → 参加できる回 →
 * Membership → 参加方法 → FAQ。
 * 文章は短く、場面は挿絵で。決まりごとは FAQ とガイドラインに。
 *
 * 固有名詞は使わない。仮データは「VTuber A」「ゲームA」のような抽象名。
 * 料金は未定。参加できる回は仮データ（slots.ts）。
 */

export const metadata: Metadata = {
  title: "推しのaimentに、日本のファンも。 | aiment",
  description:
    "aimentでは、海外の日本語学習者とVTuberが、ゲームや企画を通して日本語で交流します。メイト枠のある回では、日本のファンも一緒に参加できます。",
  openGraph: {
    title: "推しのaimentに、日本のファンも。 | aiment",
    description: "メイト枠のある回では、日本のファンも一緒に参加できます。VTuberごとの月額メンバーシップ。",
  },
};

const SIGNUP_URL = "/auth/signup";
const GUIDELINES_URL = "/supporter-guidelines";
const edited = (name: string) => `/lp/edited/${name}`;

/** /for-vtubers, /lp と同じ「aimentって何？」。ページをまたいで同じ説明にする。 */
const WHAT_IS = {
  statement: ["VTuberと話すこと自体を、", "日本語を使う体験に。"],
  paragraphs: [
    [
      "日本語を勉強していても、実際に日本人と話す機会は多くありません。",
      "一方で、日本のVTuberやゲーム、アニメをきっかけに日本語を",
      "学んでいる海外ファンはたくさんいます。",
    ],
    [
      "aimentは、そんな日本語学習者と日本人VTuberをつなぎ、",
      "「好きな人と楽しむために日本語を使う時間」をつくるサービスです。",
    ],
  ],
};

const SESSION_VIDEO_NOTE = [
  "aimentには、VTuber、リスナーの他に「スピーカー」というロールが存在します。",
  "aimentをメインで体験していただく方達で、カメラはOFF、マイクONの状態で",
  "セッションに参加します。1セッションあたり平均5名です。",
];

/** 関係図の下の4行 */
const ROLES = [
  { key: "vtuber", name: "VTuber", body: "セッションを開いて、進行する。" },
  { key: "learner", name: "学習者", body: "海外の日本語学習者。声で参加して、日本語を使う。" },
  { key: "mate", name: "メイト", body: "日本のファン。コメントで参加し、必要なときや後半は声で中へ。" },
  { key: "listener", name: "リスナー", body: "配信を見て、コメントする。" },
];

const CAN_DO = [
  {
    label: "開始前",
    title: ["少し早く、", "集合。"],
    body: ["本編開始前に、VTuberとその回のメイトで集まります。", "マイクやゲームを確認しながら、今日の企画について少し話します。"],
    Scene: SceneGather,
  },
  {
    label: "本編中",
    title: ["コメントしながら、", "一緒に参加。"],
    body: ["本編中は自由にコメントできます。", "VTuber・日本語学習者・メイトが、同じコメントを見ながらセッションを楽しみます。"],
    Scene: SceneWatch,
  },
  {
    label: "必要なとき",
    title: ["ちょっと", "手を貸す。"],
    body: [
      "音声が聞こえにくいとき。ゲームに入れていない人がいるとき。人数が足りないとき。",
      "気づいたメイトが、必要なときだけ少し手伝います。",
    ],
    Scene: SceneBackup,
  },
];

const STYLES: { style: SupporterStyle; lines: string[] }[] = [
  { style: "native-mix", lines: ["前半は日本語学習者中心。", "後半になるとメイトもマイクをONにして、みんなでゲームや会話に参加します。"] },
  { style: "open-mix", lines: ["最初からメイトも音声参加。", "ゲームや参加型企画など、みんなで一緒に遊ぶ回に向いています。"] },
  { style: "call-in", lines: ["基本はコメント中心。", "ゲーム参加やサポートが必要になったときに、メイトが中に入ります。"] },
];

/** メイトがいる意味。できることの下に置く数文。 */
const WHY = [
  "音声が二重になっている。カメラがついていない。ゲームに入れずに困っている人がいる。",
  "セッション中に起きる小さなつまずきは、日本語が通じる人がひとりいるだけで、落ち着いて対処できます。",
  "VTuberも学習者も、安心して本編に集中できる。メイトは、そのためにいます。",
];

const EXAMPLE = {
  meta: ["60分", "ゲームA", "日本語学習者 3人", "メイト 3人", "後半から合流"],
  moments: [
    { time: "開始5分前", title: "メイト集合", body: "VTuberとメイトで少し早めに集まり、マイクやゲームを確認しながら軽く話します。", Scene: SceneGather },
    { time: "本編開始", title: "日本語学習者が参加", body: "メイトはコメントしながら同じセッションを楽しみます。", Scene: SceneStart },
    { time: "前半", title: "日本語学習者中心", body: "必要なときには、ゲームや音声のサポートに入ることもあります。", Scene: SceneWatch },
    { time: "後半", title: "みんなで合流", body: "メイトもマイクをONにして、みんなでゲームや会話に参加します。", Scene: SceneNativeMix },
    { time: "終了", title: "その日のセッション終了", body: "", Scene: SceneEnd },
  ],
};

const STEPS = ["メイトに登録", "推しのメイト メンバーシップに加入", "メイト枠のあるセッションを選ぶ", "当日は開始前から参加"];

const FAQ = [
  { q: "どのセッションに参加できますか？", a: "VTuberがメイト枠を設定した回です。セッション一覧とこのページで確認できます。" },
  {
    q: "本編中は話せますか？",
    a: "回の参加スタイルによります。「後半から合流」は後半、「最初から合流」は最初から、「呼ばれたら合流」は呼ばれたときに音声で参加します。コメントはどの回でもいつでもできます。",
  },
  {
    q: "参加スタイルとは何ですか？",
    a: "本編中にメイトがどう音声参加するかの種類です。「後半から合流」「最初から合流」「呼ばれたら合流」の3つがあり、VTuberが回ごとに選びます。セッション詳細に表示されます。",
  },
  {
    q: "ゲームには参加できますか？",
    a: "回によります。後半から合流する回や最初から合流する回で一緒にプレイしたり、人数が足りないときに入ったりします。申し込み前にセッション詳細で確認できます。",
  },
  {
    q: "何か仕事をする必要がありますか？",
    a: "ありません。「マイク聞こえてないかも」と知らせたり、困っている人に少しヒントを出したり、気づいたことをできる範囲で。",
  },
  { q: "英語が話せなくても大丈夫ですか？", a: "はい。セッションは日本語で進みます。" },
  { q: "1対1で話せますか？", a: "メイト メンバーシップに1対1の通話は含まれていません。" },
  {
    q: "自分の声はアーカイブに残りますか？",
    a: "アーカイブの公開はVTuberが決めます。参加者の音声は、公開アーカイブでは字幕にする予定です。",
  },
  {
    q: "毎月何回参加できますか？",
    a: "メンバーシップに毎月1回分の参加券が含まれます。2回目以降は、追加の参加券を購入して参加できます。",
  },
];

function Lines({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <p className={className}>
      {lines.map((line, index) => (
        <span key={line}>
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

export default function ForSupportersPage() {
  return (
    <main className="landing-page sp-page min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      {/* ================= Hero ================= */}
      <section className="bg-[var(--brand-primary)] pb-[clamp(48px,6vw,88px)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <div className="flex items-center justify-between pt-7">
            <Link href="/" className="inline-flex items-center" aria-label="aiment home">
              <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} priority className="h-9 w-auto" />
            </Link>
            <Link href="/for-vtubers" className="text-[13px] font-bold text-white/85 underline-offset-4 hover:underline">
              VTuberの方はこちら
            </Link>
          </div>

          <div className="mt-[clamp(36px,5vw,72px)] grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-white/85">日本のファンの方へ</p>
              <h1 className="mt-5 text-[clamp(30px,calc(14px_+_2.3vw),46px)] font-extrabold leading-[1.3]">
                推しのaimentに、
                <br />
                日本のファンも。
              </h1>
              <Lines
                lines={["aimentでは、海外の日本語学習者とVTuberが、", "ゲームや企画を通して日本語で交流します。"]}
                className="mt-6 text-[clamp(15px,calc(12px_+_0.42vw),18px)] font-bold leading-[2]"
              />
              <Lines
                lines={["メイト枠のある回では、", "日本のファンも一緒に参加できます。"]}
                className="mt-3 text-[clamp(15px,calc(12px_+_0.42vw),18px)] font-bold leading-[2]"
              />
              <div className="mt-8 flex w-full max-w-[400px] flex-col gap-4">
                <a href="#sessions" className="landing-cta ui-btn ui-btn-lg">
                  参加できる回を見る
                </a>
                <a href="#supporter" className="landing-cta landing-cta--ghost ui-btn ui-btn-lg">
                  メイトについて見る
                </a>
              </div>
            </div>
            <div className="sp-hero-art">
              <SceneHero />
            </div>
          </div>
        </div>
      </section>

      <WaveEdge />

      {/* ================= aimentって何？（/lp と同じ） ================= */}
      <Section className="pt-[calc(var(--ld-section-y)*0.5)]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div>
            <SectionTitle align="left">aimentって何？</SectionTitle>
            <BreakLines
              lines={WHAT_IS.statement}
              alwaysBreak
              className="mt-[var(--ld-head-gap)] text-[clamp(21px,calc(12px_+_1.5vw),34px)] font-extrabold leading-[1.5]"
            />
            <div className="mt-[var(--ld-head-gap)] space-y-[var(--ld-item-gap)]">
              {WHAT_IS.paragraphs.map((lines) => (
                <BreakLines key={lines[0]} lines={lines} className={BODY} />
              ))}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src={edited("concept.png")}
              alt="ファンとVTuberが話している"
              width={1457}
              height={1079}
              className="w-full max-w-[460px]"
            />
          </div>
        </div>
      </Section>

      {/* ================= 実際のセッション映像（/lp と同じ） ================= */}
      <Section>
        <SectionTitle>実際のセッション映像</SectionTitle>
        <div className="landing-video mt-[var(--ld-head-gap)]" role="img" aria-label="セッション映像（準備中）">
          <PlayIcon aria-hidden />
          <span className="landing-soon">準備中</span>
        </div>
        <BreakLines
          lines={SESSION_VIDEO_NOTE}
          className={`mx-auto mt-[var(--ld-head-gap)] max-w-[880px] text-left sm:text-center ${BODY}`}
        />
      </Section>

      {/* ================= 日本のファンはメイトとして参加 ================= */}
      <section id="supporter" className="sp-band scroll-mt-6">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <p className="sp-kicker">日本のファンはメイトとして参加</p>
          <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <h2 className="text-[clamp(26px,calc(14px_+_1.9vw),40px)] font-extrabold leading-[1.4]">
                メイトとして、
                <br />
                少し内側から。
              </h2>
              <Lines lines={["メイトは、", "そのVTuberのaimentでの活動に参加できる月額メンバーシップです。"]} className="sp-lead mt-5" />
              <Lines
                lines={["開始前に少し早く集まったり、", "本編をコメントしながら見たり、", "必要なときに少し手を貸したり。"]}
                className="sp-lead mt-4"
              />
              <p className="sp-lead mt-4">回によっては、ゲームや会話にも参加します。</p>
            </div>
            <div>
              <RoleDiagram />
              <ul className="rd-legend">
                {ROLES.map((role) => (
                  <li key={role.key}>
                    <i className={`is-${role.key}`} aria-hidden />
                    <span>
                      <b>{role.name}</b>
                      {role.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= メイトでできること ================= */}
      <section className="mx-auto w-full max-w-[1180px] px-6 py-[var(--ld-section-y)] lg:px-10">
        <p className="sp-kicker">メイトでできること</p>
        <div className="sp-cando">
          {CAN_DO.map((item, index) => (
            <div key={item.label} className={`sp-cando__row ${index % 2 === 1 ? "is-flip" : ""}`.trim()}>
              <div className="sp-cando__text">
                <p className="sp-cando__label">{item.label}</p>
                <h2>
                  {item.title[0]}
                  <br />
                  {item.title[1]}
                </h2>
                <Lines lines={item.body} />
              </div>
              <div className="sp-cando__art">
                <item.Scene />
              </div>
            </div>
          ))}
        </div>
        <div className="sp-why">
          <p>{WHY.join("")}</p>
        </div>
      </section>

      {/* ================= 参加スタイル ================= */}
      <section className="sp-band">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <p className="sp-kicker">メイトの参加スタイル</p>
          <h2 className="sp-h2">回によって、参加のしかたが変わります。</h2>
          <div className="sp-styles mt-[var(--ld-head-gap)]">
            {STYLES.map((item) => (
              <div key={item.style} className="sp-style">
                <h3>{STYLE_LABEL[item.style]}</h3>
                <StyleDiagram style={item.style} />
                <Lines lines={item.lines} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 1回のセッション例 ================= */}
      <section className="sp-example">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <p className="sp-kicker sp-kicker--light">1回のセッション例</p>
          <h2 className="sp-example__game">たとえば、こんな60分。</h2>
          <ul className="sp-example__meta" aria-label="この回の構成">
            {EXAMPLE.meta.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <ol className="sp-moments" aria-label="セッションの流れ">
          {EXAMPLE.moments.map((moment) => (
            <li key={moment.time} className="sp-moment">
              <div className="sp-moment__art">
                <moment.Scene />
              </div>
              <p className="sp-moment__time">{moment.time}</p>
              <h3>{moment.title}</h3>
              {moment.body ? <p className="sp-moment__body">{moment.body}</p> : null}
            </li>
          ))}
        </ol>
      </section>

      {/* ================= 参加できる回 ================= */}
      <section id="sessions" className="mx-auto w-full max-w-[1180px] scroll-mt-6 px-6 py-[var(--ld-section-y)] lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="sp-kicker">参加できる回</p>
            <h2 className="sp-h2">いま参加できるセッション</h2>
          </div>
          <Link href="/" className="text-[14px] font-extrabold text-[var(--brand-primary)] underline-offset-4 hover:underline">
            セッション一覧を見る →
          </Link>
        </div>
        <div className="sp-slots mt-[var(--ld-head-gap)]">
          {mockSlots.map((slot) => (
            <SupporterSlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      </section>

      {/* ================= Membership ================= */}
      <section className="sp-band">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="sp-kicker">メンバーシップ</p>
              <h2 className="sp-h2">推しのメイトになる。</h2>
              <p className="sp-lead mt-5">メイトはVTuberごとの月額メンバーシップです。</p>
              <Lines
                lines={[
                  "メンバーシップに加入すると、毎月1枚、",
                  "メイトとしてセッションに参加するチケットが付与されます。",
                  "2回目以降は、その都度メイト券を購入していただく形になります。",
                ]}
                className="sp-lead mt-4"
              />
            </div>
            <div className="flex justify-center lg:justify-end">
              <MembershipCard vtuberName="VTuber A" priceJpy={null} href={SIGNUP_URL} sample />
            </div>
          </div>
        </div>
      </section>

      {/* ================= 参加方法 ================= */}
      <section className="mx-auto w-full max-w-[1180px] px-6 py-[var(--ld-section-y)] lg:px-10">
        <p className="sp-kicker">参加方法</p>
        <h2 className="sp-h2">参加まで</h2>
        <ol className="sp-steps sp-steps--four">
          {STEPS.map((step, index) => (
            <li key={step}>
              <span className="sp-steps__no">{index + 1}</span>
              <h3>{step}</h3>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
          <Link href={SIGNUP_URL} className="ui-btn ui-btn-lg ui-btn-primary w-full max-w-[320px] sm:w-auto">
            メイトに登録
          </Link>
          <Link href={GUIDELINES_URL} className="ui-btn ui-btn-lg ui-btn-ghost w-full max-w-[320px] sm:w-auto">
            ガイドラインを読む
          </Link>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="mx-auto w-full max-w-[1180px] px-6 pb-[var(--ld-section-y)] lg:px-10">
        <p className="sp-kicker">FAQ</p>
        <div className="mt-[var(--ld-head-gap)] space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      <WaveEdge flip />

      {/* ================= Closing ================= */}
      <section className="bg-[var(--brand-primary)] text-white">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(56px,7vw,100px)] pt-[clamp(16px,3vw,40px)] text-center lg:px-10">
          <h2 className="text-[clamp(26px,3.2vw,44px)] font-extrabold leading-[1.4]">推しの次の回に。</h2>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#sessions" className="landing-cta ui-btn ui-btn-lg w-full max-w-[320px] sm:w-auto">
              参加できる回を見る
            </a>
            <Link href={SIGNUP_URL} className="landing-cta landing-cta--ghost ui-btn ui-btn-lg w-full max-w-[320px] sm:w-auto">
              メイトに登録
            </Link>
          </div>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-bold text-white/90 underline-offset-4 hover:underline"
          >
            <XMark className="h-[14px] w-[14px]" />
            {X_HANDLE}
          </a>
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="bg-[var(--brand-primary-dark)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between lg:px-10">
          <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-bold text-white/85" aria-label="Footer">
            <Link href="/for-vtubers" className="hover:underline">
              VTuberの方へ
            </Link>
            <Link href="/lp" className="hover:underline">
              学習者の方へ（English）
            </Link>
            <Link href={GUIDELINES_URL} className="hover:underline">
              ガイドライン
            </Link>
            <Link href="/terms" className="hover:underline">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:underline">
              プライバシー
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
