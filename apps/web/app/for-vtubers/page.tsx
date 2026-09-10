import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BanknotesIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

/**
 * VTuber向けのCTAページ。
 *
 * 採用系ランディングページの定石に合わせて、ヘッダーのナビゲーションは置かず
 * ロゴだけにしてある（選択肢を減らして1アクションに集中させるため）。
 * 同じCTAをヒーローと末尾の2箇所に置き、間に「手順 → メリット → FAQ」で
 * 不安をつぶしていく並びにしている。
 *
 * いまはアーリーアクセスなので、行き先はサインアップではなく運営の公式X。
 * 一度お話ししてから参加してもらう流れなので、CTAは「相談する」に寄せてある。
 *
 * 挿絵は後入れ。各手順は2カラムにしてあり、右側が空いているので
 * そこに画像を差すだけで収まる（コメントで位置を示している）。
 *
 * サーバーコンポーネントのまま置けるよう、FAQは <details> で作っている。
 * JSなしで開閉でき、検索エンジンにも中身が読まれる。
 */

/** アーリーアクセス中の唯一の窓口。 */
const X_URL = "https://x.com/aiment_japan";
const X_HANDLE = "@aiment_japan";

export const metadata: Metadata = {
  title: "VTuberのみなさまへ",
  description:
    "aimentは日本語学習者がVTuberから楽しく日本語を学べるサービスです。日本語教師の経験や特別な授業準備は必要ありません。いつもの配信が、誰かの日本語を話すきっかけになります。",
  openGraph: {
    title: "VTuberのみなさまへ | aiment",
    description:
      "いつもの配信が、誰かの日本語を話すきっかけに。日本語教師の経験や特別な授業準備は必要ありません。",
  },
};

/* ==========================================================================
   紫の面のふち（波）
   --------------------------------------------------------------------------
   モックの波をそのまま写し取っている。濃い紫の波の裏に、それより少しだけ
   振幅が大きく・山が右にずれた淡い紫の波が隠れていて、そのずれの分だけ
   下からチラ見えする。だから覗く幅が場所によって太くなったり細くなったりする。

   数字は VTuber用CTA.png の実測値。横1440pxを48px刻みで拾った波の高さで、
   画像の y=900 を 0 とした座標系（＝このSVGのviewBox座標）。
   ========================================================================== */
const EDGE_W = 1440;
const EDGE_H = 152;

/** 手前の濃い紫の波。 */
const EDGE_FRONT = [
  10, 26, 43, 58, 73, 86, 97, 106, 113, 117, 118, 117, 113, 107, 99, 90,
  82, 74, 66, 61, 57, 57, 59, 63, 69, 76, 85, 96, 108, 120, 132,
];

/** 裏の淡い紫の波。手前より下にあり、山と谷の位置も少しずれている。 */
const EDGE_BACK = [
  33, 45, 57, 70, 83, 96, 109, 121, 131, 138, 142, 143, 141, 136, 129, 119,
  108, 98, 90, 83, 78, 74, 72, 73, 79, 86, 95, 105, 116, 130, 147,
];

/**
 * 等間隔に並んだ高さの列を「なめらかな1本の波」に変え、その上を全部塗る形にする。
 *
 * 点を直線でつなぐとカクカクした折れ線になってしまう。そこで Catmull-Rom
 * （前後の点を結んだ向きを、その点での曲線の傾きとして使うやり方）で
 * 3次ベジェ曲線の制御点を作り、全部の点をきれいに通る曲線にしている。
 * 両端は前後の点がないので、自分自身で代用する。
 */
function fillAbove(ys: number[]) {
  const step = EDGE_W / (ys.length - 1);
  const at = (i: number) => ys[Math.min(ys.length - 1, Math.max(0, i))];

  let d = `M 0 ${at(0)}`;
  for (let i = 0; i < ys.length - 1; i++) {
    const x = i * step;
    const c1 = at(i) + (at(i + 1) - at(i - 1)) / 6;
    const c2 = at(i + 1) - (at(i + 2) - at(i)) / 6;
    d += ` C ${(x + step / 3).toFixed(1)} ${c1.toFixed(2)}`;
    d += ` ${(x + (step * 2) / 3).toFixed(1)} ${c2.toFixed(2)}`;
    d += ` ${(x + step).toFixed(1)} ${at(i + 1)}`;
  }
  // 波の上を、SVGの外まではみ出させて塗る。継ぎ目に隙間が出ないようにするため。
  return `${d} L ${EDGE_W} -40 L 0 -40 Z`;
}

const EDGE_FRONT_PATH = fillAbove(EDGE_FRONT);
const EDGE_BACK_PATH = fillAbove(EDGE_BACK);

/**
 * flip = true で上下反転。クリーム→紫の向きになるので、ページ末尾側に使う。
 *
 * 幅100% + 高さautoにして viewBox の比率をそのまま保つ。画面幅が変わっても
 * 波が切り取られたり、縦に潰れて別の形になったりしない。
 */
function WaveEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${EDGE_W} ${EDGE_H}`}
      className={`block w-full ${flip ? "-scale-y-100" : ""}`.trim()}
      aria-hidden
      focusable="false"
    >
      <path fill="var(--brand-primary-light)" d={EDGE_BACK_PATH} />
      <path fill="var(--brand-primary)" d={EDGE_FRONT_PATH} />
    </svg>
  );
}

/** X（旧Twitter）のロゴ。ブランドマークなのでheroiconsにはない。 */
function XMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const STEPS = [
  {
    no: "01",
    title: "枠を作る",
    body: ["日本語レベル・テーマ・日時を選んで、", "サムネを設定。"],
  },
  {
    no: "02",
    title: "スピーカーを迎える",
    body: ["まずは自己紹介から。", "名前や好きなことを話して、ゆっくり", "会話を始めます。"],
  },
  {
    no: "03",
    title: "あとは、いつもの配信",
    body: ["ゲームでも雑談でも企画でも。", "普段のスタイルで一緒に楽しむだけ。"],
  },
];

const MERITS = [
  {
    icon: GlobeAltIcon,
    title: "海外のファンと、もっと近く。",
    body: "日本語を学びたい海外ユーザーと、コメント欄を越えて会話できます。",
  },
  {
    icon: ChatBubbleOvalLeftEllipsisIcon,
    title: "“見るだけ”から、“話したことがある”へ。",
    body: "少人数だからこそ、名前や会話が記憶に残る交流ができます。",
  },
  {
    icon: SparklesIcon,
    title: "いつもの配信に、新しい掛け合いを。",
    body: "ゲームでも雑談でも、参加者が変わるだけで新しい企画になります。",
  },
  {
    icon: BanknotesIcon,
    title: "配信そのものを、新しい収益に。",
    body: "参加型セッションという体験そのものに価値を持たせられます。",
  },
];

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
      <a href={X_URL} target="_blank" rel="noopener noreferrer" className="for-vtubers-cta ui-btn ui-btn-lg">
        <XMark className="h-[17px] w-[17px]" />
        公式Xに相談する
      </a>
      <Link href="/" className="for-vtubers-cta for-vtubers-cta--ghost ui-btn ui-btn-lg">
        まずは観てみる
      </Link>
      <p className="mt-1 text-center text-[13px] font-bold leading-[1.9] text-white/80">
        現在アーリーアクセス中です。
        <br />
        ご参加は{X_HANDLE}のDMから承ります。
      </p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="for-vtubers-faq">
      <summary>
        <span>{q}</span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden focusable="false">
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <p>{a}</p>
    </details>
  );
}

export default function ForVTubersPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
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
              <h1 className="text-[clamp(25px,3.2vw,42px)] font-extrabold leading-[1.45]">
                “あなたの配信”が、
                <br />
                誰かの日本語を話すきっかけになる。
              </h1>
              <p className="mt-[clamp(28px,3.5vw,56px)] text-[clamp(14px,1.25vw,18px)] font-bold leading-[2]">
                aimentは日本語学習者の方がVTuberから楽しく日本語を
                <br className="hidden sm:block" />
                学べるサービスを運営しています。
                <br />
                日本語教師の経験や特別な授業準備は必要ありません。
              </p>
            </div>

            <CtaButtons className="w-full max-w-[320px] lg:mt-4 lg:max-w-none" />
          </div>
        </div>
      </section>

      {/* 紫 → クリーム。濃い波の裏から淡い波がのぞく。 */}
      <WaveEdge />

      {/* ================= 手順 01 / 02 / 03 ================= */}
      <section className="mx-auto w-full max-w-[1180px] px-6 pt-[clamp(40px,5vw,80px)] lg:px-10">
        {STEPS.map((step) => (
          <div
            key={step.no}
            className="grid items-center gap-10 py-[clamp(40px,6vw,96px)] lg:min-h-[380px] lg:grid-cols-2"
          >
            <div>
              <h2 className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="text-[clamp(46px,6vw,86px)] font-extrabold leading-none tracking-tight">
                  {step.no}
                </span>
                <span className="text-[clamp(22px,2.8vw,38px)] font-extrabold leading-tight">{step.title}</span>
              </h2>
              <p className="mt-[clamp(24px,3vw,48px)] text-[clamp(14px,1.25vw,18px)] font-bold leading-[2]">
                {step.body.map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < step.body.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            </div>

            {/* 挿絵の置き場。画像が入るまでは余白として空けておく。 */}
            <div aria-hidden className="hidden lg:block" />
          </div>
        ))}
      </section>

      {/* ================= 4つのメリット ================= */}
      <section className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(56px,7vw,110px)] pt-[clamp(48px,6vw,96px)] lg:px-10">
        <h2 className="text-center text-[clamp(22px,2.8vw,38px)] font-extrabold leading-tight">
          VTuberにとっての4つのメリット
        </h2>

        <ul className="mt-[clamp(32px,4vw,64px)] grid gap-5 sm:grid-cols-2">
          {MERITS.map((merit) => {
            const Icon = merit.icon;
            return (
              <li
                key={merit.title}
                className="rounded-[var(--ui-radius-lg)] bg-[var(--brand-surface)] p-6 shadow-[0_0_0_4px_var(--surface-ring),0_10px_24px_rgba(var(--shadow-rgb),0.14)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[var(--ui-radius-md)] bg-[var(--brand-primary)] text-white shadow-[0_4px_0_0_var(--brand-primary-dark)]">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-[clamp(17px,1.5vw,21px)] font-extrabold leading-snug">{merit.title}</h3>
                <p className="mt-2.5 text-[clamp(13px,1.1vw,15px)] font-bold leading-[1.9] text-[var(--brand-text-muted)]">
                  {merit.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ================= FAQ ================= */}
      <section className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(48px,6vw,90px)] lg:px-10">
        <h2 className="text-[clamp(22px,2.6vw,34px)] font-extrabold leading-tight">FAQ - よくある質問</h2>

        <div className="mt-[clamp(24px,3vw,48px)] space-y-[clamp(28px,3.5vw,52px)]">
          {FAQ_GROUPS.map((group) => (
            <section key={group.label}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
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
      </section>

      {/* クリーム → 紫。ヒーロー側の波を上下反転して対にする。 */}
      <WaveEdge flip />

      {/* ================= 末尾のCTA =================
          モックにはないが、CTAページの終わりに行き先がないのは機会損失なので追加。
          アーリーアクセス中なので、行き先は公式Xの一本に絞っている。 */}
      <section className="bg-[var(--brand-primary)] text-white">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(64px,8vw,120px)] pt-[clamp(16px,3vw,40px)] text-center lg:px-10">
          <span className="for-vtubers-badge">EARLY ACCESS</span>

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
              className="for-vtubers-cta ui-btn ui-btn-lg w-full max-w-[320px]"
            >
              <XMark className="h-[17px] w-[17px]" />
              公式Xに相談する
            </a>
            <p className="text-[13px] font-bold text-white/75">{X_HANDLE}／DMを開放しています</p>
          </div>
        </div>
      </section>
    </main>
  );
}
