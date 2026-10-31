/**
 * チケットの外枠。左の半券（stub）と本体を、ミシン目でつなぐ。
 *
 * ミシン目は、境目の両端に「まわりの背景色の丸」を置いて切り欠きに見せ、間を点線でつないで描く。
 * 丸の色（cutout）は、チケットを置く面の色に合わせる（白い箱の中なら --brand-surface）。
 *
 * stackWhenNarrow を付けると、置かれた場所の幅が 520px 未満のときは半券を上に積み、ミシン目を横に通す
 * （チケットを縦にした形）。画面の幅ではなく「置かれた場所の幅」で決める（コンテナクエリ）ので、
 * スマホでも、PC の細い列の中でも、同じように縦になる。一覧に並べる小さなチケットは、横のまま使う。
 */
import type { CSSProperties, ReactNode } from "react";

type TicketProps = {
  stub: ReactNode;
  children: ReactNode;
  /** 半券の色（文字は白） */
  stubColor?: string;
  /** 半券の幅（CSS の grid-template-columns の1列目） */
  stubWidth?: string;
  /** 切り欠きの色。チケットを置く面の色 */
  cutout?: string;
  /** 切り欠きの直径（px） */
  notch?: number;
  stackWhenNarrow?: boolean;
  className?: string;
  /** 半券に重ねるもの（予約済みのスタンプなど） */
  stubOverlay?: ReactNode;
};

export function Ticket({
  stub,
  children,
  stubColor = "var(--brand-primary)",
  stubWidth = "minmax(200px, 0.8fr)",
  cutout = "var(--brand-surface)",
  notch = 24,
  stackWhenNarrow = false,
  className = "",
  stubOverlay,
}: TicketProps) {
  const half = notch / 2;
  const vars = { "--ticket-stub": stubWidth, "--ticket-notch": `${notch}px`, "--ticket-half": `-${half}px` } as CSSProperties;
  const ticket = (
    <div
      className={`grid overflow-hidden rounded-2xl bg-[var(--brand-bg-900)] ${
        stackWhenNarrow ? "@min-[520px]:grid-cols-[var(--ticket-stub)_minmax(0,1fr)]" : "grid-cols-[var(--ticket-stub)_minmax(0,1fr)]"
      } ${className}`}
      style={vars}
    >
      <div className="relative grid content-center text-white" style={{ background: stubColor }}>
        {stub}
        {stubOverlay}
        {stackWhenNarrow ? (
          <>
            {/* 狭いときは境目が下の辺、520px 以上は右の辺 */}
            <span
              className="absolute bottom-[var(--ticket-half)] left-[var(--ticket-half)] h-[var(--ticket-notch)] w-[var(--ticket-notch)] rounded-full @min-[520px]:bottom-auto @min-[520px]:left-auto @min-[520px]:right-[var(--ticket-half)] @min-[520px]:top-[var(--ticket-half)]"
              style={{ background: cutout }}
              aria-hidden
            />
            <span
              className="absolute bottom-[var(--ticket-half)] right-[var(--ticket-half)] h-[var(--ticket-notch)] w-[var(--ticket-notch)] rounded-full"
              style={{ background: cutout }}
              aria-hidden
            />
            <span
              className="absolute bottom-0 left-4 right-4 border-b-2 border-dashed border-white/50 @min-[520px]:bottom-4 @min-[520px]:left-auto @min-[520px]:right-0 @min-[520px]:top-4 @min-[520px]:border-b-0 @min-[520px]:border-r-2"
              aria-hidden
            />
          </>
        ) : (
          <>
            <span
              className="absolute right-[var(--ticket-half)] top-[var(--ticket-half)] h-[var(--ticket-notch)] w-[var(--ticket-notch)] rounded-full"
              style={{ background: cutout }}
              aria-hidden
            />
            <span
              className="absolute bottom-[var(--ticket-half)] right-[var(--ticket-half)] h-[var(--ticket-notch)] w-[var(--ticket-notch)] rounded-full"
              style={{ background: cutout }}
              aria-hidden
            />
            <span className="absolute bottom-3 right-0 top-3 border-r-2 border-dashed border-white/50" aria-hidden />
          </>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
  // 幅で切り替えるときは、外側を「幅を測る箱」（@container）にする
  return stackWhenNarrow ? <div className="@container">{ticket}</div> : ticket;
}

/**
 * 「予約済み」のスタンプ。半券の右上に、少し傾けて押したように重ねる。
 * 半券の色の上でも読めるよう、白の二重線の丸に白い文字
 */
export function ReservedStamp({ label }: { label: string }) {
  return (
    <span
      className="pointer-events-none absolute right-5 top-4 grid h-[68px] w-[68px] -rotate-12 place-items-center rounded-full border-[3px] border-white px-1 text-center text-[9.5px] font-black leading-tight tracking-wide text-white"
      style={{ boxShadow: "inset 0 0 0 3px transparent, inset 0 0 0 5px rgba(255,255,255,0.6)" }}
      aria-hidden
    >
      {label}
    </span>
  );
}
