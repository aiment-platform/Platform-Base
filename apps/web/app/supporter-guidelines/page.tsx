import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { TopNav } from "../components/home/TopNav";
import { SiteFooter } from "../components/landing/SiteFooter";

export const metadata: Metadata = {
  title: "日本人メイト ガイドライン | Aiment",
  description:
    "AimentのVTuberセッションに日本人メイトとして参加するためのガイドライン・行動規範・禁止事項。",
};

const SECTIONS = [
  ["about", "メイトとは"],
  ["conduct", "行動指針"],
  ["prohibited", "禁止事項"],
  ["requirements", "環境要件"],
  ["flow", "参加までの流れ"],
  ["violations", "違反時の対応"],
] as const;

const CONDUCT = [
  "Aimerが伝えたい内容を察して、日本語表現を優しく補助する",
  "Aimerの日本語の挑戦を肯定的に受け取り、後押しする",
  "VTuberの進行・トーンに合わせて場を盛り上げる",
  "Aimerが萎縮していたら話しかけて緊張をほぐす",
  "会話の主導権はVTuberとAimerに委ねる（メイトが話しすぎない）",
  "時間を独占せず、Aimerに話す機会を積極的に譲る",
];

const PROHIBITED = [
  {
    title: "コンテンツ・プライバシー",
    items: [
      "セッション内容の録画・録音・スクリーンショット",
      "セッション内の発言・映像の外部SNS投稿・転載",
      "他参加者（Aimer含む）の個人情報の収集・拡散",
    ],
  },
  {
    title: "プラットフォーム外での接触",
    items: [
      "VTuberへのプラットフォーム外でのDM・連絡先交換の試み",
      "AimerへのSNS・連絡先の要求",
      "プラットフォーム外に誘導する発言",
    ],
  },
  {
    title: "会話・態度",
    items: [
      "Aimerの日本語レベルを嘲笑する・馬鹿にする発言",
      "政治・宗教・性的・差別的な話題の持ち込み",
      "VTuberへの過度な感情移入・依存・独占的な言動",
      "他のメイト・Aimerへのハラスメント",
    ],
  },
  {
    title: "なりすまし・不正",
    items: ["複数アカウントによる規約回避", "メイトとしての立場を利用した営業・勧誘"],
  },
];

const REQUIREMENTS = [
  "マイク必須（クリアな音声が出せること）",
  "安定したインターネット環境（有線推奨）",
  "カメラは使用しない",
  "電話番号による本人認証が必要",
];

const FLOW = [
  { title: "ガイドラインに同意", body: "登録画面のチェックボックスで同意します。" },
  { title: "プロフィールを入力", body: "応援しているVTuberや参加の動機など（任意）。" },
  { title: "承認後に予約できる", body: "承認されると、チケットの購入とセッションの予約ができます。" },
];

const VIOLATIONS = [
  { level: "警告", case: "軽微な違反（初回）", tone: "bg-[var(--brand-bg-900)] text-[var(--brand-text)]" },
  {
    level: "即時退出＋アカウント停止",
    case: "重大な違反・繰り返し",
    tone: "bg-[var(--brand-warning-soft)] text-[var(--brand-warning-ink)]",
  },
  {
    level: "永久停止＋法的対応の可能性",
    case: "録画・外部への共有",
    tone: "bg-[var(--brand-accent-soft)] text-[var(--brand-accent-ink)]",
  },
];

export default function SupporterGuidelinesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <header className="mb-8 max-w-[640px]">
          <p className="text-xs font-bold text-[var(--brand-primary-ink)]">Mate Guidelines</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">日本人メイト ガイドライン</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--brand-text-muted)]">
            VTuberのセッションにメイトとして参加する前に読んでください。登録時にこの内容への同意をお願いしています。
          </p>
          <p className="mt-2 text-xs text-[var(--brand-text-muted)]">v1.0（2026年6月）</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <nav className="hidden lg:block" aria-label="目次">
            <ol className="sticky top-24 space-y-1">
              {SECTIONS.map(([id, label], index) => (
                <li key={id}>
                  <a href={`#${id}`} className="ui-menu-item h-9 gap-2 text-sm">
                    <span className="w-4 text-xs text-[var(--brand-text-muted)]">{index + 1}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 space-y-5">
            <Section id="about" index={1} title="メイトとは">
              <p className="text-sm leading-relaxed">
                VTuberとAimer（フィリピンから参加する学習者）の架け橋として、セッションを豊かにする存在です。
                主役はVTuberとAimer。メイトは縁の下の力持ちです。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <RoleCard title="コミュニケーションの補助" body="Aimerが詰まったときに「こう言ってみて」とアシストし、日本語の壁をそっと取り除きます。" />
                <RoleCard title="場の盛り上げ" body="リアクションや相槌でセッションの空気を作り、Aimerが安心して話せるようにします。" />
              </div>
            </Section>

            <Section id="conduct" index={2} title="セッション内での行動指針">
              <ul className="space-y-2.5">
                {CONDUCT.map((item) => (
                  <ListRow key={item} icon={<CheckIcon className="h-4 w-4 text-[var(--brand-primary-ink)]" aria-hidden />}>
                    {item}
                  </ListRow>
                ))}
              </ul>
            </Section>

            <Section id="prohibited" index={3} title="禁止事項" lead="以下は禁止です。違反した場合は「違反時の対応」に沿って対処します。">
              <div className="grid gap-3 sm:grid-cols-2">
                {PROHIBITED.map((group) => (
                  <div key={group.title} className="ui-sunken p-4">
                    <p className="mb-2.5 text-xs font-bold text-[var(--brand-text-muted)]">{group.title}</p>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <ListRow key={item} icon={<XMarkIcon className="h-4 w-4 text-[var(--brand-accent-ink)]" aria-hidden />}>
                          {item}
                        </ListRow>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="requirements" index={4} title="技術・環境要件">
              <ul className="space-y-2.5">
                {REQUIREMENTS.map((item) => (
                  <ListRow key={item} icon={<span className="mt-[7px] block h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" aria-hidden />}>
                    {item}
                  </ListRow>
                ))}
              </ul>
            </Section>

            <Section id="flow" index={5} title="申し込みから参加までの流れ">
              <ol className="grid gap-3 sm:grid-cols-3">
                {FLOW.map((step, index) => (
                  <li key={step.title} className="ui-sunken p-4">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-primary)] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm font-bold">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--brand-text-muted)]">{step.body}</p>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="violations" index={6} title="違反時の対応">
              <div className="divide-y divide-[var(--line)]">
                {VIOLATIONS.map((row) => (
                  <div key={row.level} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="text-sm">{row.case}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.tone}`}>{row.level}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">VTuberとAimentスタッフは、いつでも参加者を退出させることができます。</p>
            </Section>

            <section className="ui-panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold">メイトとして参加する</p>
                <p className="mt-1 text-sm text-[var(--brand-text-muted)]">このガイドラインに同意したうえで、アカウントを作成できます。</p>
              </div>
              <Link href="/auth/signup" className="ui-btn ui-btn-md ui-btn-primary shrink-0">
                メイト登録へ進む
              </Link>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string;
  index: number;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="ui-panel scroll-mt-24 p-6">
      <h2 className="flex items-baseline gap-3 text-lg font-bold">
        <span className="text-sm text-[var(--brand-primary-ink)]">{String(index).padStart(2, "0")}</span>
        {title}
      </h2>
      {lead ? <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{lead}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="ui-sunken p-4">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--brand-text-muted)]">{body}</p>
    </div>
  );
}

function ListRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed">
      <span className="mt-[3px] grid w-4 shrink-0 place-items-center">{icon}</span>
      <span>{children}</span>
    </li>
  );
}
