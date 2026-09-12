/**
 * ランディングページ（/for-vtubers, /lp）で共用する部品。
 * 見た目は globals.css の .landing-* に、縦のリズムは .landing-page の3変数にある。
 */

/** アーリーアクセス中の窓口。 */
export const X_URL = "https://x.com/aiment_japan";
export const X_HANDLE = "@aiment_japan";

/* 本文の共通スタイル。モックの「太め・行間広め」をそのまま使う。 */
export const BODY = "text-[clamp(15px,calc(12px_+_0.42vw),18px)] font-bold leading-[2]";
export const BODY_SUB = "text-[clamp(14px,calc(12px_+_0.25vw),15.5px)] font-bold leading-[1.9] text-[var(--ld-ink-soft)]";

/** X（旧Twitter）のロゴ。ブランドマークなのでheroiconsにはない。 */
export function XMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * 行の配列を1つの段落にする。広い画面ではモックどおりの位置で改行し、
 * 狭い画面では <br> を消して自然に折り返す（短い行なら alwaysBreak で固定できる）。
 */
export function Lines({
  lines,
  className = "",
  alwaysBreak = false,
}: {
  /** 文字列のほか、「?」ボタンなどを混ぜた行も渡せる */
  lines: React.ReactNode[];
  className?: string;
  alwaysBreak?: boolean;
}) {
  return (
    <p className={className}>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {/* 行の間の空白は、<br> が消える狭い画面で英文がくっつかないためのもの */}
          {index < lines.length - 1 ? (
            <>
              {" "}
              <br className={alwaysBreak ? undefined : "hidden sm:block"} />
            </>
          ) : null}
        </span>
      ))}
    </p>
  );
}

/**
 * ページの1区画。縦の余白はここで一律に決めていて、区画ごとに勝手な
 * 余白を足さない。隣り合う区画の間はこの値の2倍になる。
 */
export function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`mx-auto w-full max-w-[1180px] px-6 py-[var(--ld-section-y)] lg:px-10 ${className}`.trim()}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "left" }) {
  return (
    <h2
      className={`text-[clamp(24px,calc(14px_+_1.7vw),38px)] font-extrabold leading-tight ${align === "center" ? "text-center" : ""}`.trim()}
    >
      {children}
    </h2>
  );
}

/** 中身がまだないボタン。消さずに「ここに来る」ことだけ見せておく。 */
export function SoonButton({
  children,
  className = "",
  label = "準備中",
}: {
  children: React.ReactNode;
  className?: string;
  /** 札の文言。英語ページでは "Coming soon" を渡す。 */
  label?: string;
}) {
  return (
    <button type="button" disabled title={label} className={`ui-btn ${className}`.trim()}>
      {children}
      <span className="landing-soon">{label}</span>
    </button>
  );
}

export function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="landing-faq">
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
