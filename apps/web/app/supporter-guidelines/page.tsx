import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "../components/home/TopNav";

export const metadata: Metadata = {
  title: "日本人サポーター ガイドライン | Aiment",
  description:
    "AimentのVTuberセッションに日本人サポーターとして参加するためのガイドライン・行動規範・禁止事項。",
};

export default function SupporterGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <TopNav />
      <main className="mx-auto max-w-2xl px-5 py-10 md:px-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <span className="mb-3 inline-block rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-400">
            Supporter Guidelines
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            日本人サポーター ガイドライン
          </h1>
          <p className="mt-2 text-sm text-[var(--brand-text-muted)]">v1.0 — 2026年6月</p>
        </div>

        <div className="space-y-10">
          {/* What is a supporter */}
          <Section title="サポーターとは" emoji="🎭">
            <p className="mb-4 leading-relaxed">
              VTuberとAimer（フィリピン人参加者）の架け橋として、セッションを豊かにする存在です。
              <strong>主役はVTuberとAimer。サポーターは縁の下の力持ちです。</strong>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <RoleCard
                title="役割① コミュニケーション補助"
                body="Aimerが詰まった時に「こう言ってみて」とアシスト。日本語の壁をそっと取り除く。"
              />
              <RoleCard
                title="役割② 場の盛り上げ"
                body="リアクション・相槌でセッションのムードを作る。Aimerが安心して話せる空気を作る。"
              />
            </div>
          </Section>

          {/* Conduct guide */}
          <Section title="セッション内での行動指針" emoji="✅">
            <ul className="space-y-2.5">
              {[
                "Aimerが伝えたい内容を察して、日本語表現を優しく補助する",
                "Aimerの日本語の挑戦を肯定的に受け取り、後押しする",
                "VTuberの進行・トーンに合わせて場を盛り上げる",
                "Aimerが萎縮していたら話しかけて緊張をほぐす",
                "会話の主導権はVTuberとAimerに委ねる（サポーターが話しすぎない）",
                "時間を独占せず、Aimerに話す機会を積極的に譲る",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-purple-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          {/* Prohibited */}
          <Section title="禁止事項" emoji="🚫">
            <div className="space-y-5">
              <ProhibitedGroup
                title="コンテンツ・プライバシー"
                items={[
                  "セッション内容の録画・録音・スクリーンショット禁止",
                  "セッション内の発言・映像の外部SNS投稿・転載禁止",
                  "他参加者（Aimer含む）の個人情報の収集・拡散禁止",
                ]}
              />
              <ProhibitedGroup
                title="プラットフォーム外接触"
                items={[
                  "VTuberへのプラットフォーム外でのDM・連絡先交換の試み禁止",
                  "AimerへのSNS・連絡先の要求禁止",
                  "プラットフォーム外に誘導する発言禁止",
                ]}
              />
              <ProhibitedGroup
                title="会話・態度"
                items={[
                  "Aimerの日本語レベルへの嘲笑・馬鹿にする発言禁止",
                  "政治・宗教・性的・差別的な話題の持ち込み禁止",
                  "VTuberへの過度な感情移入・依存・独占的な言動禁止",
                  "他のサポーター・Aimerへのハラスメント行為禁止",
                ]}
              />
              <ProhibitedGroup
                title="なりすまし・不正"
                items={[
                  "複数アカウントによる規約回避禁止",
                  "サポーターとしての立場を利用した営業・勧誘禁止",
                ]}
              />
            </div>
          </Section>

          {/* Technical requirements */}
          <Section title="技術・環境要件" emoji="💻">
            <ul className="space-y-2.5">
              {[
                "マイク必須（クリアな音声が出せること）",
                "安定したインターネット環境（有線推奨）",
                "カメラは使用しない",
                "電話番号による本人認証が必要",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-purple-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          {/* Registration flow */}
          <Section title="申し込み・参加フロー" emoji="📝">
            <ol className="space-y-3">
              {[
                "このガイドラインへの同意（チェックボックス形式）",
                "簡単なプロフィール入力（任意：応援しているVTuber、参加動機）",
                "承認後、チケット購入・予約が可能に",
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[11px] font-bold text-purple-400">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </Section>

          {/* Violation handling */}
          <Section title="違反時の対応フロー" emoji="⚠️">
            <div className="space-y-2">
              <ViolationRow
                severity="警告"
                color="yellow"
                description="軽微な違反（初回）"
              />
              <ViolationRow
                severity="即時退出 + アカウント停止"
                color="orange"
                description="重大な違反・繰り返し"
              />
              <ViolationRow
                severity="即時永久Ban + 法的対応の可能性"
                color="red"
                description="録画・外部共有"
              />
            </div>
            <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-[var(--brand-text-muted)]">
              VTuberおよびAimentスタッフはいつでも強制退出権限を持ちます。
            </p>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center">
          <p className="mb-1 text-sm font-semibold text-purple-300">
            サポーターとして参加する
          </p>
          <p className="mb-4 text-xs text-[var(--brand-text-muted)]">
            このガイドラインに同意した上で、サポーターとしてアカウントを作成できます。
          </p>
          <Link
            href="/auth/signup"
            className="inline-block rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            サポーター登録へ →
          </Link>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
        <span>{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-1.5 text-sm font-semibold text-purple-300">{title}</p>
      <p className="text-xs leading-relaxed text-[var(--brand-text-muted)]">{body}</p>
    </div>
  );
}

function ProhibitedGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-text-muted)]">
        {title}
      </p>
      <ul className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="mt-1 shrink-0 text-red-400/70">✕</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViolationRow({
  severity,
  color,
  description,
}: {
  severity: string;
  color: "yellow" | "orange" | "red";
  description: string;
}) {
  const colorClass =
    color === "red"
      ? "bg-red-500/15 text-red-400 border-red-500/20"
      : color === "orange"
        ? "bg-orange-500/15 text-orange-400 border-orange-500/20"
        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${colorClass}`}>
        {severity}
      </span>
      <span className="text-sm text-[var(--brand-text-muted)]">{description}</span>
    </div>
  );
}
