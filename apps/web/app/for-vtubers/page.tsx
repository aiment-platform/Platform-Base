import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BanknotesIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  MinusCircleIcon,
  PlayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { WaveEdge } from "../components/landing/WaveEdge";
import {
  BODY,
  BODY_SUB,
  FaqItem,
  Lines,
  Section,
  SectionTitle,
  SoonButton,
  X_HANDLE,
  X_URL,
  XMark,
} from "../components/landing/primitives";
import { LevelHelpButton, LevelHelpPanel } from "../components/landing/LevelHelp";
import { SceneCreate, SceneLive, SceneWelcome } from "./StepScenes";

/**
 * VTuber向けのCTAページ。
 *
 * 採用系ランディングページの定石に合わせて、ヘッダーのナビゲーションは置かず
 * ロゴだけにしてある（選択肢を減らして1アクションに集中させるため）。
 * 並びは「問題提起 → 解決策 → 証拠（映像） → 手順 → 頼むこと/頼まないこと
 * → お金 → メリット → 運営の透明性 → 安全 → FAQ → CTA」。上から読むほど
 * 不安が減っていき、最後に行動できるようにしている。
 *
 * いまはアーリーアクセスなので、行き先はサインアップではなく運営の公式X。
 * 一度お話ししてから参加してもらう流れなので、CTAは「相談する」に寄せてある。
 *
 * まだ中身がないもの（経営者情報・各ガイドライン・セッション映像）は、
 * 消さずに「準備中」の無効状態で置いてある。そこに何が来るのかを先に
 * 見せておくと、ページの信頼感が下がりにくい。
 *
 * 3STEPSの挿絵は StepScenes.tsx。ページで使っている本物の部品を並べて
 * CSSで動かしているので、絵を描き直さなくても部品の変更に追従する。
 *
 * サーバーコンポーネントのまま置けるよう、FAQは <details> で作っている。
 * JSなしで開閉でき、検索エンジンにも中身が読まれる。
 */

export const metadata: Metadata = {
  title: "VTuberのみなさまへ",
  description:
    "aimentは、海外の日本語学習者と日本人VTuberが、ゲームや雑談を通して直接会話できるサービスです。日本語を教える必要も、英語を話す必要もありません。いつものVTuber活動の延長で参加できます。",
  openGraph: {
    title: "VTuberのみなさまへ | aiment",
    description:
      "いつもの配信が、誰かの日本語を話すきっかけに。日本語を教える必要も、英語を話す必要もありません。",
  },
};

/* ==========================================================================
   文言
   --------------------------------------------------------------------------
   本文の改行位置はモックに合わせてある。配列の1要素が1行で、広い画面では
   その位置で改行し、狭い画面では自然に折り返す（Lines コンポーネント参照）。
   ========================================================================== */

const HERO_LEAD = [
  "aimentは、海外の日本語学習者と日本人VTuberが、",
  "ゲームや雑談を通して直接会話できるサービスです。",
  "日本語を教える必要も、英語を話す必要もありません。",
  "いつものVTuber活動の延長で参加できます。",
];

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
      "「勉強するための会話」ではなく、",
      "「好きな人と楽しむために日本語を使う時間」をつくるサービスです。",
    ],
  ],
};

const SESSION_VIDEO_NOTE = [
  "aimentには、VTuber、リスナーの他に「スピーカー」というロールが存在します。",
  "aimentをメインで体験していただく方達で、カメラはOFF、マイクONの状態で",
  "セッションに参加します。1セッションあたり平均5名です。",
];

const STEPS = [
  {
    no: "01",
    title: "枠を作る",
    body: [
      <>
        日本語レベル
        <LevelHelpButton id="level-help-steps" lang="ja" />
        ・テーマ・日時を選んで、
      </>,
      "サムネを設定。",
    ],
    Scene: SceneCreate,
  },
  {
    no: "02",
    title: "スピーカーを迎える",
    body: ["まずは自己紹介から。", "名前や好きなことを話して、ゆっくり", "会話を始めます。"],
    Scene: SceneWelcome,
  },
  {
    no: "03",
    title: "あとは、いつもの配信",
    body: ["ゲームでも雑談でも企画でも。", "普段のスタイルで一緒に楽しむだけ。"],
    Scene: SceneLive,
  },
];

const ASKS = ["日本語で参加者と会話する", "ゲームや雑談を一緒に楽しむ", "初心者には少しゆっくり話す", "基本的な参加ルールを守る"];
const NOT_NEEDED = ["日本語教師の資格", "教材づくり", "英語での進行", "aimentへの所属", "毎週の参加"];

const NOT_AGENCY = {
  title: "これは事務所への勧誘ではありません",
  paragraphs: [
    ["aimentはVTuber事務所ではありません。", "aimentへの所属や専属契約、企業勢への転向をお願いするサービスではありません。"],
    ["普段のYouTube・X・配信活動を続けながら、", "参加したいときにaimentのセッションへ出演するという関係です。"],
  ],
};

const REWARD = [
  "セッションに参加するユーザーさんから参加費をいただき、",
  "その一部を出演VTuberさんへの報酬としてお支払いします。",
  "広告案件のように商品を紹介していただくのではなく、",
  "VTuberさんとの交流体験そのものが",
  "価値になる仕組みです。",
];

const MERITS = [
  {
    icon: GlobeAltIcon,
    title: "海外のファンとの接点",
    body: "日本語を学びたい海外ユーザーから新たなファン層を獲得できます。",
  },
  {
    icon: ChatBubbleOvalLeftEllipsisIcon,
    title: "ファンとの交流の深さ",
    body: "少人数だからこそ、名前や会話が記憶に残る交流ができます。",
  },
  {
    icon: SparklesIcon,
    title: "新しい配信体験",
    body: "ゲームでも雑談でも、参加者が変わるだけで新しい企画になります。",
  },
  {
    icon: BanknotesIcon,
    title: "新たな収益",
    body: "普段のスタイルのまま比較的安定した収益をうむことができます。",
  },
];

const STAGE = {
  paragraphs: [
    [
      "aimentは、ビジネスを学ぶ学生が立ち上げ、現在開発・運営しているサービスです。",
      "すでにVTuberさんとのセッションを実施しながら、",
      "2026年10月頃の本格始動に向けて、",
      "参加VTuberと海外ユーザーを少しずつ増やしています。",
    ],
    ["だから今参加していただく方は、単なる出演者ではなく、", "最初のaimentを一緒につくるメンバーでもあります。"],
  ],
};

const GUIDELINES = ["迷惑行為等へのガイドライン", "配信ガイドライン", "アーカイブ公開ガイドライン"];

/**
 * 14問あるので、そのまま並べると探しづらい。知りたいことの種類で
 * 5つに束ねて、上から「参加できるか → 何をするか → 不安 → 条件 → 次の一歩」
 * の順に並べてある。
 */
const FAQ_GROUPS = [
  {
    label: "参加条件について",
    items: [
      {
        q: "日本語を教えた経験がなくても参加できますか？",
        a: "はい。日本語教師の経験や資格は必要ありません。aimentは「日本語を教える授業」ではなく、日本語を学んでいる海外の方と、ゲームや雑談などを通して自然に会話する場です。",
      },
      {
        q: "英語を話せなくても大丈夫ですか？",
        a: "大丈夫です。基本的には日本語で会話します。参加者も日本語を学ぶことを目的に参加するため、VTuber側に英語力は求めていません。",
      },
      {
        q: "個人VTuberでも参加できますか？",
        a: "はい。現在、aimentでは個人で活動しているVTuberの方を対象にご案内しています。チャンネル登録者数や活動規模だけで参加可否を決めることはありません。",
      },
      {
        q: "登録者数が少なくても参加できますか？",
        a: "問題ありません。aimentでは規模よりも、リスナーとの会話を楽しめることや、ゲーム・雑談などを通じて交流できることを重視しています。",
      },
    ],
  },
  {
    label: "配信の内容と準備",
    items: [
      {
        q: "どんな配信をすればいいですか？",
        a: "ゲーム、雑談、テーマトーク、企画など、普段行っている配信スタイルをベースにできます。日本語学習用の特別な授業を用意する必要はありません。",
      },
      {
        q: "事前に何を準備する必要がありますか？",
        a: "主に日時・テーマ・日本語レベル・サムネイルなどを設定します。当日の進め方についても事前に確認できるため、教材や授業資料を作る必要はありません。",
      },
      {
        q: "セッションではどんな流れで進みますか？",
        a: "まず参加するスピーカーと簡単な自己紹介を行い、その後はゲームや雑談など、設定したテーマに沿って会話を楽しみます。普段の配信に、海外の日本語学習者が会話相手として加わるイメージです。",
      },
      {
        q: "普段使っている配信環境のまま参加できますか？",
        a: "基本的には、普段VTuber活動で使用しているPC・マイク・配信環境を利用できます。必要なツールや接続方法がある場合は、事前にご案内します。",
      },
    ],
  },
  {
    label: "参加者と安心",
    items: [
      {
        q: "どんな人が参加しますか？",
        a: "日本語を学んでいる海外ユーザーが中心です。参加するセッションの日本語レベルを設定することで、そのレベルに合った方が参加しやすい仕組みにしています。",
      },
      {
        q: "海外の知らない人と直接話すのが少し不安です。",
        a: "参加者にはルールを設け、安心して交流できる環境づくりを行います。問題のある言動やトラブルが発生した場合には、aiment運営側でも対応できる体制を整えていきます。",
      },
    ],
  },
  {
    label: "報酬と映像の扱い",
    items: [
      {
        q: "報酬はありますか？",
        a: "はい。セッションへの参加に対して報酬をお支払いする想定です。金額や条件については、セッション内容・時間・形式などを踏まえて事前にご案内します。",
      },
      {
        q: "セッションの映像は配信・公開されますか？",
        a: "配信やアーカイブ、切り抜きなどの扱いについては、事前に確認したうえで決定します。本人の確認なく用途を広げることはありません。",
      },
    ],
  },
  {
    label: "はじめかた",
    items: [
      {
        q: "毎週など継続して参加する必要がありますか？",
        a: "ありません。まずは1回から参加できます。継続するかどうかは、実際にセッションを行ったあとで決められます。",
      },
      {
        q: "興味はあるけれど、参加するかまだ決めていません。",
        a: "問題ありません。まずは活動内容や普段の配信スタイルについてお話しし、aimentでどのようなセッションができそうかをご相談できます。",
      },
    ],
  },
];






/**
 * ヒーローと末尾で共用するCTA。
 * 主役は公式Xへの導線、副えとして「まずは観てみる」を置いている。
 * 白ボタンが1つだけ立っていた方が、押す先に迷わない。
 */
function CtaButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-stretch gap-4 ${className}`.trim()}>
      <a href={X_URL} target="_blank" rel="noopener noreferrer" className="landing-cta ui-btn ui-btn-lg">
        <XMark className="h-[17px] w-[17px]" />
        参加について相談する
      </a>
      <Link href="/" className="landing-cta landing-cta--ghost ui-btn ui-btn-lg">
        まずは観てみる
      </Link>
      <p className="mt-1 text-center text-[14px] font-bold leading-[1.9] text-white/90">
        現在アーリーアクセス中です。
        <br />
        ご参加は{X_HANDLE}のDMから承ります。
      </p>
    </div>
  );
}



export default function ForVTubersPage() {
  return (
    <main className="landing-page min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      {/* ================= ヒーロー ================= */}
      <section className="bg-[var(--brand-primary)] pb-[clamp(56px,7vw,96px)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <Link href="/" className="inline-flex items-center pt-7" aria-label="aiment ホームへ">
            <Image
              src="/logo/aiment_logotype.svg"
              alt="aiment"
              width={600}
              height={200}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <p className="mt-10 text-center text-sm font-bold tracking-[0.2em] text-white/85">For VTubers</p>
          <p className="mt-2 text-center text-[clamp(24px,3.2vw,40px)] font-extrabold leading-tight">
            VTuberのみなさまへ
          </p>

          <div className="mt-[clamp(48px,7vw,104px)] grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h1 className="text-[clamp(26px,calc(15px_+_1.9vw),42px)] font-extrabold leading-[1.45]">
                “あなたの配信”が、
                <br />
                誰かの日本語を
                <br className="sm:hidden" />
                話すきっかけになる。
              </h1>
              <Lines lines={HERO_LEAD} className={`mt-[clamp(28px,3.5vw,56px)] ${BODY}`} />
            </div>

            <CtaButtons className="w-full max-w-[320px] sm:max-w-[400px] lg:mt-4 lg:max-w-none" />
          </div>
        </div>
      </section>

      {/* 紫 → クリーム。濃い波の裏から淡い波がのぞく。 */}
      <WaveEdge />

      {/* ================= aimentって何？ ================= */}
      <Section className="pt-[calc(var(--ld-section-y)*0.5)]">
        <SectionTitle align="left">aimentって何？</SectionTitle>
        <Lines
          lines={WHAT_IS.statement}
          alwaysBreak
          className="mt-[var(--ld-head-gap)] text-[clamp(21px,calc(12px_+_1.5vw),34px)] font-extrabold leading-[1.5]"
        />
        <div className="mt-[var(--ld-head-gap)] space-y-[var(--ld-item-gap)]">
          {WHAT_IS.paragraphs.map((lines) => (
            <Lines key={lines[0]} lines={lines} className={BODY} />
          ))}
        </div>
      </Section>

      {/* ================= 実際のセッション映像 =================
          映像はまだない。枠だけ先に置いて「ここに映像が入る」と分かるようにしている。 */}
      <Section>
        <SectionTitle>実際のセッション映像</SectionTitle>
        <div className="landing-video mt-[var(--ld-head-gap)]" role="img" aria-label="セッション映像（準備中）">
          <PlayIcon aria-hidden />
          <span className="landing-soon">準備中</span>
        </div>
        <Lines
          lines={SESSION_VIDEO_NOTE}
          className={`mx-auto mt-[var(--ld-head-gap)] max-w-[880px] text-left sm:text-center ${BODY}`}
        />
      </Section>

      {/* ================= 3STEPS ================= */}
      <Section>
        <SectionTitle>aimentで始める3STEPS</SectionTitle>
        <LevelHelpPanel id="level-help-steps" lang="ja" />
        <div className="mt-[var(--ld-head-gap)] grid gap-[clamp(40px,6vw,80px)]">
          {STEPS.map((step) => (
            <div key={step.no} className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <h3 className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                  <span className="text-[clamp(46px,6vw,86px)] font-medium leading-none tracking-tight">
                    {step.no}
                  </span>
                  <span className="text-[clamp(24px,calc(14px_+_1.7vw),38px)] font-extrabold leading-tight">
                    {step.title}
                  </span>
                </h3>
                <Lines lines={step.body} className={`mt-[var(--ld-head-gap)] ${BODY}`} />
              </div>

              {/* 挿絵。狭い画面では本文の下、広い画面では右に寄せる。 */}
              <div className="flex justify-center lg:justify-end">
                <step.Scene />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ================= お願いすること / しないこと ================= */}
      <Section>
        <SectionTitle>
          VTuberさんに<span className="inline-block">お願いすること</span> /{" "}
          <span className="inline-block">しないこと</span>
        </SectionTitle>

        <div className="mx-auto mt-[var(--ld-head-gap)] grid max-w-[960px] gap-5 sm:grid-cols-2">
          <div className="landing-panel">
            <h3>お願いすること</h3>
            <ul>
              {ASKS.map((item) => (
                <li key={item}>
                  <CheckCircleIcon className="text-[var(--brand-primary)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="landing-panel">
            <h3>必要ないこと</h3>
            <ul>
              {NOT_NEEDED.map((item) => (
                <li key={item}>
                  <MinusCircleIcon className="text-[var(--ld-ink-soft)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="landing-callout mx-auto mt-[var(--ld-head-gap)] max-w-[960px]">
          <h3 className="text-[clamp(17px,1.6vw,22px)] font-extrabold leading-snug">{NOT_AGENCY.title}</h3>
          <div className="mt-5 space-y-4">
            {NOT_AGENCY.paragraphs.map((lines) => (
              <Lines key={lines[0]} lines={lines} className={BODY_SUB} />
            ))}
          </div>
        </div>
      </Section>

      {/* ================= セッション報酬について ================= */}
      <Section>
        <SectionTitle>セッション報酬について</SectionTitle>

        <div className="mt-[var(--ld-head-gap)] grid gap-10 lg:grid-cols-2 lg:items-center">
          <Lines lines={REWARD} className={BODY} />

          {/* 本文の内容を図にしたもの。お金の向きが一目で分かるように。挿絵の位置に置く。 */}
          <ol className="landing-flow" aria-label="報酬の流れ">
            <li>参加ユーザー</li>
            <li className="landing-flow__arrow" aria-hidden>
              <span>参加費</span>
              <ArrowRightIcon />
            </li>
            <li>aiment</li>
            <li className="landing-flow__arrow" aria-hidden>
              <span>報酬</span>
              <ArrowRightIcon />
            </li>
            <li>出演VTuber</li>
          </ol>
        </div>
      </Section>

      {/* ================= 4つのメリット ================= */}
      <Section>
        <SectionTitle>VTuberにとっての4つのメリット</SectionTitle>

        <ul className="mt-[var(--ld-head-gap)] grid gap-5 sm:grid-cols-2">
          {MERITS.map((merit) => {
            const Icon = merit.icon;
            return (
              <li
                key={merit.title}
                className="rounded-[var(--ui-radius-lg)] border border-[color:var(--ld-line)] bg-[var(--brand-surface)] p-6"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[var(--ui-radius-md)] bg-[var(--brand-primary)] text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-[clamp(17px,1.5vw,21px)] font-extrabold leading-snug">{merit.title}</h3>
                <p className={`mt-2.5 ${BODY_SUB}`}>{merit.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ================= 今、aimentはどんな段階？ ================= */}
      <Section>
        <SectionTitle>今、aimentはどんな段階？</SectionTitle>
        <div className="mx-auto mt-[var(--ld-head-gap)] max-w-[880px] space-y-[var(--ld-item-gap)] text-left sm:text-center">
          {STAGE.paragraphs.map((lines) => (
            <Lines key={lines[0]} lines={lines} className={BODY} />
          ))}
        </div>

        {/* 経営者情報はまだ用意がない。押せる方を先に・紫にして、押せない方は準備中の灰色で添える。 */}
        <div className="mt-[var(--ld-head-gap)] flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-lg ui-btn-primary w-full max-w-[320px] sm:w-auto"
          >
            <XMark className="h-[16px] w-[16px]" />
            参加について相談する
          </a>
          <SoonButton className="ui-btn-lg ui-btn-ghost w-full max-w-[320px] sm:w-auto">経営者情報を見る</SoonButton>
        </div>
      </Section>

      {/* ================= 安心して参加できるために ================= */}
      <Section>
        <SectionTitle>安心して参加できるために</SectionTitle>
        <div className="landing-shelf mt-[var(--ld-head-gap)]">
          {GUIDELINES.map((label) => (
            <SoonButton key={label} className="ui-btn-md ui-btn-ghost w-full max-w-[320px] sm:w-auto">
              {label}
            </SoonButton>
          ))}
        </div>
      </Section>

      {/* ================= FAQ ================= */}
      <Section>
        <SectionTitle align="left">FAQ - よくある質問</SectionTitle>

        <div className="mt-[var(--ld-head-gap)] space-y-8 sm:space-y-10">
          {FAQ_GROUPS.map((group) => (
            <section key={group.label}>
              <h3 className="mb-3 text-[13px] font-bold tracking-[0.16em] text-[var(--ld-ink-soft)]">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Section>

      {/* クリーム → 紫。ヒーロー側の波を上下反転して対にする。 */}
      <WaveEdge flip />

      {/* ================= 末尾のCTA =================
          モックにはないが、CTAページの終わりに行き先がないのは機会損失なので追加。
          アーリーアクセス中なので、行き先は公式Xの一本に絞っている。 */}
      <section className="bg-[var(--brand-primary)] text-white">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(64px,8vw,120px)] pt-[clamp(16px,3vw,40px)] text-center lg:px-10">
          <span className="landing-badge">EARLY ACCESS</span>

          <h2 className="mt-6 text-[clamp(22px,2.8vw,38px)] font-extrabold leading-[1.5]">
            いつもの配信のまま、
            <br className="sm:hidden" />
            はじめられます。
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[clamp(13px,1.15vw,16px)] font-bold leading-[2] text-white/90">
            いまは、ご一緒するVTuberさんを少しずつお迎えしている段階です。
            まずは公式XのDMにご連絡ください。活動の内容をうかがったうえで、
            どんなセッションができそうかを一緒に考えます。
          </p>

          <div className="mt-9 flex flex-col items-center gap-3">
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-cta ui-btn ui-btn-lg w-full max-w-[320px]"
            >
              <XMark className="h-[17px] w-[17px]" />
              参加について相談する
            </a>
            <p className="text-[14px] font-bold text-white/90">{X_HANDLE}／DMを開放しています</p>
          </div>
        </div>
      </section>
    </main>
  );
}
