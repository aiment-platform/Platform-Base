import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChatBubbleLeftRightIcon, GlobeAsiaAustraliaIcon, PuzzlePieceIcon, UserGroupIcon } from "@heroicons/react/24/outline";

import { WaveEdge } from "../components/landing/WaveEdge";
import {
  BODY,
  BODY_SUB,
  FaqItem,
  Lines,
  Section,
  SectionTitle,
  X_HANDLE,
  X_URL,
  XMark,
} from "../components/landing/primitives";
import { SceneChat, SceneGame, SceneLounge } from "./SupporterScenes";

/**
 * 日本のファン向け「Supporter」のページ。
 *
 * 「推しが海外へ新しい挑戦を始める。その場に、日本のファンも一緒にいられる」
 * というワクワクを伝えるのが役目。制度の説明や、他の参加方法との線引きは
 * 最小限にして（FAQに1行ずつ）、体験を想像できる順に並べる：
 *   Hero → できること → 1回の流れ → 体験のイメージ（挿絵） → CTA → FAQ
 *
 * 中心の語彙は「一緒に・参加する・楽しむ・加わる」。「支える」「サポート」は
 * 連呼しない。「〜ではありません」から始まる説明は置かない。
 *
 * 事実の出典：/supporter-guidelines（マイク・カメラ・申込フロー）、既存の
 * 申込／抽選の仕組み、Supporterの設計方針（Lounge・Chat・音声・アーカイブ）。
 * 料金の金額は未定なので書いていない。
 */

export const metadata: Metadata = {
  title: "Supporter — 推しの新しい挑戦に、一緒に加わろう | aiment",
  description:
    "推しのVTuberが海外の日本語学習者と始める新しい活動。aimentのSupporterは、その場に日本のファンも一緒にいられる参加方法です。",
  openGraph: {
    title: "Supporter — 推しの新しい挑戦に、一緒に加わろう | aiment",
    description: "推しが海外へ始める新しい活動の場に、日本のファンも一緒に。aimentのSupporter。",
  },
};

const SIGNUP_URL = "/auth/signup";
const GUIDELINES_URL = "/supporter-guidelines";

const HERO_LEAD = [
  "aimentで、推しは海外の日本語学習者と",
  "ゲームや雑談を楽しむ新しい活動を始めます。",
  "Supporterは、その場に日本のファンも一緒にいられる参加方法です。",
];

const CAN_DO = [
  {
    icon: UserGroupIcon,
    title: "Supporter Lounge",
    body: "開始前は、VTuberとSupporterだけの作戦会議。今日の企画や遊ぶゲームを、一緒に決める。",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Supporter Chat",
    body: "セッション中は、Supporterだけのチャットで盛り上がる。VTuberがコメントを拾って、話が広がることも。",
  },
  {
    icon: PuzzlePieceIcon,
    title: "ゲーム・企画に参加",
    body: "人数がいる企画や対戦では、プレイヤーとして一緒に遊ぶ。呼ばれたら声でも参加。",
  },
  {
    icon: GlobeAsiaAustraliaIcon,
    title: "海外のファンと同じ場に",
    body: "日本語に挑戦する海外のファンと、同じセッションを楽しむ。推しの新しい景色を、いちばん近くで見る。",
  },
];

const TIMELINE = [
  {
    when: "開始前",
    title: "Supporter Lounge",
    body: ["VTuberとSupporterで作戦会議。", "今日の企画、遊ぶゲーム、流れを一緒に決める。"],
  },
  {
    when: "開始",
    title: "海外のファンが入室",
    body: ["日本語に挑戦する海外のファンが入室。", "いよいよセッションが始まる。"],
  },
  {
    when: "セッション中",
    title: "Chatとゲームで参加",
    body: ["Supporter Chatでリアクション。", "企画ならプレイヤーとして、呼ばれたら声で参加。"],
  },
  {
    when: "終了",
    title: "一緒に締める",
    body: ["今日の活動をみんなで締めくくる。", "次はどうする？の話が出ることも。"],
  },
];

const SCENES = [
  {
    Scene: SceneChat,
    title: "Supporter Chat",
    body: "書いたらそのまま流れる、いつものチャット。見ているのはVTuberとSupporterだけ。",
  },
  {
    Scene: SceneGame,
    title: "ゲーム・企画に参加",
    body: "「Sさんも入って！」と呼ばれて、プレイヤーとしてイン。人数がいる企画ほど出番が増える。",
  },
];

const JOIN_STEPS = ["登録して、ガイドラインに同意", "承認後、セッションに申し込む", "チケットを購入して参加"];

/** 最小限のFAQ。線引きが要るものは、ここで1行ずつ。 */
const FAQ = [
  {
    q: "毎回なにかをする必要はありますか？",
    a: "ありません。Chatで一緒に盛り上がるだけでも十分です。ゲームや声での参加は、その回の流れと本人の気分で。",
  },
  {
    q: "VTuberとは話せますか？",
    a: "開始前のLoungeでは、VTuberとSupporter全員のグループ会話があります。セッション中は基本ミュートで、呼ばれたときや発言リクエストが通ったときに短く話せます。個別通話ではありません。",
  },
  {
    q: "海外の学習者とは、参加のしかたが違いますか？",
    a: "はい。学習者は日本語を使いに来るスピーカーとして、Supporterは日本のファンとして、同じセッションに加わります。入口が違うだけで、楽しむ場は同じです。",
  },
  {
    q: "Supporter Chatは誰が見られますか？",
    a: "SupporterとVTuberです。海外の学習者には表示されず、原則として公開もされません。",
  },
  {
    q: "アーカイブと声の扱いは？",
    a: "公開範囲はVTuberが設定します。参加者の音声は公開アーカイブでは基本的に使わず、字幕にする予定です。",
  },
  {
    q: "参加までの流れは？",
    a: "サポーターとして登録（ガイドラインへの同意と簡単なプロフィール）→ 承認後、セッションごとに申し込み → チケットを購入して参加。申し込みが枠より多いときは抽選になります。",
  },
];

function HeroCtas({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-stretch gap-4 ${className}`.trim()}>
      <Link href={SIGNUP_URL} className="landing-cta ui-btn ui-btn-lg">
        Supporterとして参加する
      </Link>
      <a href="#can-do" className="landing-cta landing-cta--ghost ui-btn ui-btn-lg">
        どんな体験か見る
      </a>
      <p className="mt-1 text-center text-[14px] font-bold leading-[1.9] text-white/90">
        日本のファン向け。
        <br />
        セッションごとに申し込む、有料の参加方法です。
      </p>
    </div>
  );
}

export default function ForSupportersPage() {
  return (
    <main className="landing-page sp-page min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      {/* ================= Hero ================= */}
      <section className="bg-[var(--brand-primary)] pb-[clamp(56px,7vw,96px)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <div className="flex items-center justify-between pt-7">
            <Link href="/" className="inline-flex items-center" aria-label="aiment home">
              <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} priority className="h-9 w-auto" />
            </Link>
            <Link href="/for-vtubers" className="text-[13px] font-bold text-white/85 underline-offset-4 hover:underline">
              VTuberの方はこちら
            </Link>
          </div>

          <div className="mt-[clamp(40px,6vw,88px)] grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div>
              <p className="flex flex-wrap items-center gap-3 text-sm font-bold tracking-[0.2em] text-white/85">
                FOR FANS
                <span className="landing-badge">SUPPORTER</span>
              </p>
              <h1 className="mt-5 text-[clamp(30px,calc(16px_+_2.4vw),52px)] font-extrabold leading-[1.35]">
                推しの新しい挑戦に、
                <br />
                一緒に加わろう。
              </h1>
              <Lines lines={HERO_LEAD} className={`mt-[clamp(20px,2.5vw,36px)] ${BODY}`} />
              <HeroCtas className="mt-[clamp(28px,3.5vw,48px)] w-full max-w-[320px] sm:max-w-[400px]" />
            </div>

            <div className="flex justify-center lg:justify-end">
              <SceneLounge />
            </div>
          </div>
        </div>
      </section>

      <WaveEdge />

      {/* ================= できること ================= */}
      <section id="can-do" className="scroll-mt-6">
        <Section className="pt-[calc(var(--ld-section-y)*0.5)]">
          <SectionTitle>Supporterでできること</SectionTitle>
          <p className={`mx-auto mt-[var(--ld-head-gap)] max-w-[760px] text-left sm:text-center ${BODY}`}>
            推しの新しい活動を、いちばん近くで一緒に楽しむ。ときには、場にも参加する。
          </p>
          <ul className="sp-cards sp-cards--four mt-[var(--ld-head-gap)]">
            {CAN_DO.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <span className="sp-cards__icon">
                    <Icon aria-hidden />
                  </span>
                  <h3>{item.title}</h3>
                  <p className={BODY_SUB}>{item.body}</p>
                </li>
              );
            })}
          </ul>
        </Section>
      </section>

      {/* ================= 1回のセッションの流れ ================= */}
      <Section>
        <SectionTitle>1回のセッションの流れ</SectionTitle>
        <ol className="sp-timeline sp-timeline--row mt-[var(--ld-head-gap)]">
          {TIMELINE.map((step) => (
            <li key={step.when}>
              <span className="sp-timeline__when">{step.when}</span>
              <h3>{step.title}</h3>
              <Lines lines={step.body} className={BODY_SUB} />
            </li>
          ))}
        </ol>
        <p className={`mx-auto mt-[var(--ld-head-gap)] max-w-[760px] text-left sm:text-center ${BODY_SUB}`}>
          毎回なにかを「担当」するわけではありません。Chatで一緒に盛り上がるだけの日があっても、それで十分。
        </p>
      </Section>

      {/* ================= 体験のイメージ ================= */}
      <Section>
        <SectionTitle>セッション中は、こんな感じ</SectionTitle>
        <div className="mt-[var(--ld-head-gap)] grid gap-10 lg:grid-cols-2">
          {SCENES.map((item) => (
            <div key={item.title} className="flex flex-col items-center">
              <item.Scene />
              <h3 className="mt-6 text-[clamp(17px,1.6vw,22px)] font-extrabold leading-[1.4]">{item.title}</h3>
              <p className={`mt-2 max-w-[460px] text-center ${BODY_SUB}`}>{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <WaveEdge flip />

      {/* ================= CTA ================= */}
      <section className="bg-[var(--brand-primary)] text-white">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(64px,8vw,120px)] pt-[clamp(16px,3vw,40px)] text-center lg:px-10">
          <span className="landing-badge">EARLY ACCESS</span>
          <h2 className="mt-6 text-[clamp(24px,3vw,40px)] font-extrabold leading-[1.5]">
            次の挑戦を、
            <br className="sm:hidden" />
            一緒に。
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[clamp(13px,1.15vw,16px)] font-bold leading-[2] text-white/90">
            推しが海外へ向けて始める新しい活動。その場に、日本のファンとしていよう。
          </p>

          <ol className="sp-join mx-auto mt-8 max-w-[760px]">
            {JOIN_STEPS.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href={SIGNUP_URL} className="landing-cta ui-btn ui-btn-lg w-full max-w-[320px] sm:w-auto">
              Supporterとして参加する
            </Link>
            <Link href={GUIDELINES_URL} className="landing-cta landing-cta--ghost ui-btn ui-btn-lg w-full max-w-[320px] sm:w-auto">
              ガイドラインを読む
            </Link>
          </div>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-bold text-white/90 underline-offset-4 hover:underline"
          >
            <XMark className="h-[14px] w-[14px]" />
            {X_HANDLE}／最新情報はXで
          </a>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <Section>
        <SectionTitle align="left">FAQ</SectionTitle>
        <div className="mt-[var(--ld-head-gap)] space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
        <p className={`mt-[var(--ld-head-gap)] ${BODY_SUB}`}>
          行動の指針や禁止事項は{" "}
          <Link href={GUIDELINES_URL} className="font-extrabold text-[var(--brand-primary)] underline underline-offset-4">
            サポーターガイドライン
          </Link>{" "}
          にまとめています。
        </p>
      </Section>

      {/* ================= Footer ================= */}
      <footer className="bg-[var(--brand-primary-dark)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between lg:px-10">
          <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-bold text-white/85" aria-label="Footer">
            <Link href="/for-vtubers" className="hover:underline">
              VTuberの方へ
            </Link>
            <Link href="/lp" className="hover:underline">
              For learners
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
