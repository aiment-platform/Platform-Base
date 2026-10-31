"use client";

/**
 * join ページの上半分（サムネイル・タイトル・配信者・チケット）。
 *
 * 枠の情報は「チケット」の形で見せる。左の半券に日時を大きく、ミシン目の右に残り枠・レベル・長さ。
 * 「枠を予約するもの」だと、形で伝えるため。
 * 半券の色は状態で変える（これから＝紫 / 配信中＝アクセント / 終了＝灰色）。
 * スマホでは半券を上に置き、ミシン目を横に通す（チケットを縦にした形）。
 */
import type { AjlInfo } from "../../lib/ajl";
import { ReservedStamp, Ticket } from "../../components/ui/Ticket";

export type StartState =
  | { kind: "upcoming"; days: number; hours: number; minutes: number }
  | { kind: "soon" }
  | { kind: "live" }
  | { kind: "ended" }
  | { kind: "tbd" };

/** 開始までの残り時間と、配信の状態をまとめて決める */
export function getStartState(startsAt: string, durationMin: number, status: string | undefined, now: number): StartState {
  if (status === "live") return { kind: "live" };
  if (status === "ended") return { kind: "ended" };
  const start = new Date(startsAt).getTime();
  if (!startsAt || Number.isNaN(start)) return { kind: "tbd" };
  if (now >= start + durationMin * 60_000) return { kind: "ended" };
  if (now >= start) return { kind: "soon" };
  const totalMinutes = Math.ceil((start - now) / 60_000);
  return {
    kind: "upcoming",
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

type Tx = (ja: string, en: string) => string;

export function startStateLabel(state: StartState, tx: Tx): string {
  switch (state.kind) {
    case "live":
      return tx("配信中", "Live now");
    case "ended":
      return tx("終了しました", "Ended");
    case "soon":
      return tx("まもなく開始", "Starting soon");
    case "tbd":
      return tx("日時未定", "Time TBD");
    case "upcoming":
      if (state.days > 0) return tx(`あと ${state.days}日 ${state.hours}時間`, `In ${state.days}d ${state.hours}h`);
      if (state.hours > 0) return tx(`あと ${state.hours}時間 ${state.minutes}分`, `In ${state.hours}h ${state.minutes}m`);
      return tx(`あと ${state.minutes}分`, `In ${state.minutes} min`);
  }
}

export type JoinHeroProps = {
  title: string;
  description: string;
  thumbnail: string;
  host: { name: string; avatarUrl?: string; onOpen?: () => void };
  ajl: AjlInfo;
  start: StartState;
  /** 例: "10/31 21:00 JST" */
  startsAtLabel: string | null;
  /** 視聴者の地域が日本と違うときだけ。例: "21:00 in Japan (JST)" */
  startsAtHostLabel: string | null;
  durationLabel: string;
  slotsLeft: number;
  slotsTotal: number;
  participationType: string;
  /** 自分がこの枠を予約済みか。半券に「予約済み」のスタンプを押し、ゲージの席の1つを「自分の席」にする */
  reserved?: boolean;
  tx: Tx;
};

/** 残りが少ない（2割以下、または残り1） */
function isLow(left: number, total: number) {
  return total > 0 && (left / total <= 0.2 || left === 1);
}

/* 席の色。赤（アクセント）は「自分の席」専用にする。残りが少ないことは、空席の色ではなく「残り」の数字を赤くして伝える
   （空席まで赤くすると、自分の席と見分けがつかなくなる） */
const SEAT_OPEN = "var(--brand-primary)";
const SEAT_MINE = "var(--brand-accent)";

/**
 * 残り枠のゲージ。10枠までは「席」を1つずつ並べ、空いている席を色で塗る（数が少ないと、本数で数えられるほうが早い）。
 * 11枠以上は席が細かくなりすぎるので、カードと同じバーにする
 */
function SlotGauge({ left, total, reserved }: { left: number; total: number; reserved?: boolean }) {
  const color = SEAT_OPEN;
  const taken = Math.max(0, total - left);
  if (total > 0 && total <= 10) {
    // 並びは「空いている席 → 自分の席 → ほかの人の席」。バー（左から残りの分だけ塗る）と同じく、空きを左に寄せる。
    // 自分の席は、空席のすぐ右に赤で縁取りを付けて置く
    const mineIndex = reserved && taken > 0 ? left : -1;
    return (
      <span className="flex gap-1 py-0.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => {
          if (index === mineIndex) {
            return (
              <span
                key={index}
                className="mx-1 h-3.5 w-6 rounded-full"
                style={{ background: SEAT_MINE, boxShadow: `0 0 0 2px var(--brand-bg-900), 0 0 0 4px ${SEAT_MINE}` }}
              />
            );
          }
          return <span key={index} className="h-3.5 w-6 rounded-full" style={{ background: index < left ? color : "var(--track)" }} />;
        })}
      </span>
    );
  }
  const ratio = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  return (
    <span className="block h-3.5 w-40 overflow-hidden rounded-full bg-[var(--track)]" aria-hidden>
      <span className="block h-full rounded-full" style={{ width: `${ratio * 100}%`, background: color }} />
    </span>
  );
}

/** AJL の正方形（カードの左端と同じ色）。数字はいつも出す（詳細ページでは触れなくても読めるように） */
function AjlSquare({ ajl, size = 32 }: { ajl: AjlInfo; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center font-black leading-none"
      style={{ width: size, height: size, borderRadius: size * 0.22, background: ajl.color, color: ajl.inkColor, fontSize: size * 0.55 }}
    >
      {ajl.level}
    </span>
  );
}

function HostLine({ host, tx }: Pick<JoinHeroProps, "host" | "tx">) {
  const initial = (host.name || "A").slice(0, 1).toUpperCase();
  const body = (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--placeholder)] text-sm font-bold text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {host.avatarUrl ? <img src={host.avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
      </span>
      <span className="min-w-0 truncate text-sm font-bold text-[var(--brand-text)]">{host.name}</span>
    </>
  );
  return host.onOpen ? (
    <button
      type="button"
      onClick={host.onOpen}
      className="flex w-fit min-w-0 items-center gap-2 rounded-full pr-2 transition-colors hover:text-[var(--brand-primary-ink)]"
      aria-label={tx(`${host.name} のチャンネル`, `${host.name}'s channel`)}
    >
      {body}
    </button>
  ) : (
    <span className="flex min-w-0 items-center gap-2">{body}</span>
  );
}

function SlotsBlock({
  slotsLeft,
  slotsTotal,
  participationType,
  tx,
  start,
  reserved,
}: Pick<JoinHeroProps, "slotsLeft" | "slotsTotal" | "participationType" | "tx" | "start" | "reserved">) {
  // 終わった枠では、残り枠はもう意味がないので出さない
  if (start.kind === "ended") return null;
  return (
    <div className="grid gap-2">
      <p className="text-xs font-bold text-[var(--brand-text-muted)]">
        {tx("スピーカー枠", "Speaker spots")} ・ {participationType}
      </p>
      <SlotGauge left={slotsLeft} total={slotsTotal} reserved={reserved} />
      <p className="text-sm font-bold text-[var(--brand-text)]">
        {reserved ? (
          <span className="mr-2 rounded-full px-2 py-0.5 text-xs font-black text-white" style={{ background: SEAT_MINE }}>{tx("1席はあなた", "1 is yours")}</span>
        ) : null}
        {slotsLeft === 0 ? (
          tx("満席", "Full")
        ) : (
          <>
            {tx("残り ", "")}
            <span className="text-2xl font-black" style={{ color: isLow(slotsLeft, slotsTotal) ? "var(--brand-accent-ink)" : "var(--brand-primary-ink)" }}>
              {slotsLeft}
            </span>
            {tx(` / ${slotsTotal} 枠`, ` of ${slotsTotal} left`)}
          </>
        )}
      </p>
    </div>
  );
}

function LevelLine({ ajl, durationLabel }: Pick<JoinHeroProps, "ajl" | "durationLabel">) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <AjlSquare ajl={ajl} />
        <div className="min-w-0">
          <p className="text-sm font-black text-[var(--brand-text)]">
            AJL {ajl.level} ・ {ajl.label}
            <span className="ml-1.5 text-xs font-bold text-[var(--brand-text-muted)]">JF {ajl.jfStandard}</span>
          </p>
          <p className="text-xs text-[var(--brand-text-muted)]">{ajl.description}</p>
        </div>
      </div>
      {durationLabel ? <p className="text-sm font-bold text-[var(--brand-text-muted)]">{durationLabel}</p> : null}
    </div>
  );
}

/** 半券の色。これから＝紫 / 配信中＝アクセント / 終了＝灰色 */
function stubColor(start: StartState) {
  if (start.kind === "live") return "var(--brand-accent)";
  if (start.kind === "ended") return "var(--brand-text-muted)";
  return "var(--brand-primary)";
}

export function JoinHero(props: JoinHeroProps) {
  const { title, description, thumbnail, host, tx, start, startsAtLabel, startsAtHostLabel, reserved } = props;
  return (
    <div className="ui-panel overflow-hidden">
      <div className="relative aspect-video max-h-[480px] w-full bg-[var(--brand-primary-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {thumbnail ? <img src={thumbnail} alt={title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="grid gap-6 p-5 sm:p-7">
        <div className="grid gap-3">
          <HostLine host={host} tx={tx} />
          {/* 配信中は、タイトルと見分けがつくよう、小さな札をタイトルの上に置く（タイトルの横に同じ大きさで並べない） */}
          {start.kind === "live" ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--brand-accent)] px-2.5 py-1 text-xs font-black text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              {tx("配信中", "LIVE")}
            </span>
          ) : null}
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">{title}</h1>
        </div>

        <Ticket
          stackWhenNarrow
          stubColor={stubColor(start)}
          stubWidth="minmax(220px, 0.8fr)"
          stubOverlay={reserved && start.kind !== "ended" ? <ReservedStamp label={tx("予約済み", "RESERVED")} /> : null}
          stub={
            <div className="grid gap-2 p-5">
              <p className="text-xs font-bold opacity-80">
                {start.kind === "live" || start.kind === "ended" ? tx("開始した時刻", "Started") : tx("開始", "Starts")}
              </p>
              <p className="text-2xl font-black leading-tight">{startsAtLabel ?? tx("未定", "TBD")}</p>
              {startsAtHostLabel ? <p className="text-xs font-semibold opacity-80">{startsAtHostLabel}</p> : null}
              <p className="mt-1 inline-flex w-fit rounded-full bg-white/20 px-2.5 py-1 text-xs font-black">{startStateLabel(start, tx)}</p>
            </div>
          }
        >
          <div className="grid gap-5 p-5">
            <SlotsBlock {...props} />
            <LevelLine {...props} />
          </div>
        </Ticket>

        {description ? <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-[var(--brand-text-muted)] sm:text-base">{description}</p> : null}
      </div>
    </div>
  );
}
