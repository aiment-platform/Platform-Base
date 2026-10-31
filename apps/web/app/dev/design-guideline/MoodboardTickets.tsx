"use client";

/**
 * チケットの形を、join ページ以外へ広げる見本。まだ本番には入れていない。
 *   3. 視聴者の「マイチケット」ページ（新しく作る）
 *   4. チャンネルページの 1on1 チケット購入
 *   5. 配信者の My Sessions の行
 * チケットの外枠は本物の部品（app/components/ui/Ticket.tsx）。中身は見本のデータ。
 */
import type { ReactNode } from "react";
import { Ticket } from "../../components/ui/Ticket";
import { getAjlInfo } from "../../lib/ajl";

function AjlSquare({ level, size = 24 }: { level: number; size?: number }) {
  const ajl = getAjlInfo(level);
  return (
    <span
      className="grid shrink-0 place-items-center font-black leading-none"
      style={{ width: size, height: size, borderRadius: size * 0.22, background: ajl.color, color: ajl.inkColor, fontSize: size * 0.55 }}
    >
      {ajl.level}
    </span>
  );
}

function Board({ title, idea, children, notes }: { title: string; idea: string; children: ReactNode; notes: { good: string[]; watch: string[] } }) {
  return (
    <section className="ui-panel grid gap-5 p-6">
      <h4 className="text-xl font-black">{title}</h4>
      <p className="text-sm leading-relaxed">{idea}</p>
      {children}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-black text-[var(--brand-primary-ink)]">よいところ</p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {notes.good.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-black text-[var(--brand-accent-ink)]">気になるところ</p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {notes.watch.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** 見本の画面を置く台（ページの背景色）。label はその上に小さく */
function Stage({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <p className="text-xs font-black text-[var(--brand-text-muted)]">{label}</p>
      <div className="rounded-2xl bg-[var(--bg)] p-4">{children}</div>
    </div>
  );
}

// --- 3. マイチケット ----------------------------------------------------------------------

type MyTicket = {
  title: string;
  host: string;
  date: string;
  time: string;
  countdown: string;
  level: number;
  thumb: number;
  state: "live" | "upcoming" | "ended";
};

const MY_TICKETS: MyTicket[] = [
  { title: "ゆっくり雑談しよう", host: "バナージ", date: "10/30", time: "19:09", countdown: "配信中", level: 2, thumb: 2, state: "live" },
  { title: "夏祭りの思い出を話そう", host: "バナージ", date: "10/30", time: "21:19", countdown: "あと 1時間 58分", level: 3, thumb: 3, state: "upcoming" },
  { title: "ニュースを読んで意見を言おう", host: "AJLサンプル", date: "11/02", time: "20:00", countdown: "あと 3日", level: 5, thumb: 5, state: "upcoming" },
];

const PAST_TICKETS: MyTicket[] = [
  { title: "昨日の雑談", host: "バナージ", date: "10/29", time: "21:00", countdown: "終了", level: 3, thumb: 2, state: "ended" },
];

function stateColor(state: MyTicket["state"]) {
  return state === "live" ? "var(--brand-accent)" : state === "ended" ? "var(--brand-text-muted)" : "var(--brand-primary)";
}

function MyTicketRow({ ticket, compact }: { ticket: MyTicket; compact?: boolean }) {
  return (
    <Ticket
      stubColor={stateColor(ticket.state)}
      stubWidth={compact ? "96px" : "132px"}
      cutout="var(--bg)"
      notch={18}
      className={ticket.state === "ended" ? "opacity-70" : ""}
      stub={
        <div className="grid gap-0.5 px-3 py-3 text-center">
          <p className={`${compact ? "text-xl" : "text-2xl"} font-black leading-none`}>{ticket.date}</p>
          <p className="text-sm font-black opacity-90">{ticket.time}</p>
          <p className="mt-1 text-[10px] font-black opacity-80">{ticket.countdown}</p>
        </div>
      }
    >
      <div className={`flex items-center gap-3 ${compact ? "p-3" : "p-4"}`}>
        {compact ? null : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/image/thumbnail/samples/thumbnail_${ticket.thumb}.jpg`} alt="" className="aspect-video w-28 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--brand-text)]">{ticket.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs font-bold text-[var(--brand-text-muted)]">
            <AjlSquare level={ticket.level} size={18} />
            <span className="truncate">{ticket.host}</span>
          </div>
        </div>
        {ticket.state === "ended" ? null : (
          <span className={`ui-btn ui-btn-sm shrink-0 ${ticket.state === "live" ? "ui-btn-primary" : "ui-btn-ghost"}`}>
            {ticket.state === "live" ? "今すぐ入る" : compact ? "詳細" : "マイク確認"}
          </span>
        )}
      </div>
    </Ticket>
  );
}

function MyTicketsMock({ compact }: { compact?: boolean }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <h5 className="text-2xl font-black">マイチケット</h5>
        <span className="text-xs font-bold text-[var(--brand-text-muted)]">時刻は JST</span>
      </div>
      <div className="ui-segment w-fit" role="group" aria-label="見本">
        <span className="ui-segment__option px-3 text-sm" aria-pressed="true">
          これから 3
        </span>
        <span className="ui-segment__option px-3 text-sm" aria-pressed="false">
          過去
        </span>
      </div>
      {MY_TICKETS.map((ticket) => (
        <MyTicketRow key={ticket.title} ticket={ticket} compact={compact} />
      ))}
      <p className="mt-2 text-xs font-black text-[var(--brand-text-muted)]">過去（タブを切り替えたとき）</p>
      {PAST_TICKETS.map((ticket) => (
        <MyTicketRow key={ticket.title} ticket={ticket} compact={compact} />
      ))}
    </div>
  );
}

// --- 4. 1on1 チケット ----------------------------------------------------------------------

const ONE_ON_ONE = [
  { minutes: 10, price: "PHP 499", note: "短く質問したいときに" },
  { minutes: 30, price: "PHP 1,399", note: "じっくり話したいときに", best: true },
];

function OneOnOneMock() {
  return (
    <div className="grid gap-3 rounded-2xl bg-[var(--brand-surface)] p-5">
      <p className="text-sm font-black text-[var(--brand-text)]">バナージと 1on1</p>
      {/* 横に2枚並べると本体が狭くなり、値段と一言が折れるので、縦に並べる */}
      <div className="grid gap-3">
        {ONE_ON_ONE.map((plan) => (
          <Ticket
            key={plan.minutes}
            stubWidth="110px"
            notch={18}
            stubColor={plan.best ? "var(--brand-primary-dark)" : "var(--brand-primary)"}
            stub={
              <div className="grid gap-0.5 py-4 text-center">
                <p className="text-4xl font-black leading-none">{plan.minutes}</p>
                <p className="text-xs font-black opacity-90">分</p>
              </div>
            }
          >
            <div className="flex h-full items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-[var(--brand-text)]">{plan.price}</p>
                <p className="text-xs font-bold text-[var(--brand-text-muted)]">{plan.note}</p>
              </div>
              <span className="ui-btn ui-btn-sm ui-btn-primary shrink-0">買う</span>
            </div>
          </Ticket>
        ))}
      </div>
    </div>
  );
}

function OneOnOneNow() {
  return (
    <div className="grid gap-3 rounded-2xl bg-[var(--brand-surface)] p-5">
      <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--brand-text-muted)]">1ON1 TICKET</p>
      <p className="text-sm font-black">1on1 with バナージ</p>
      <div className="grid gap-3 md:grid-cols-2">
        <span className="ui-btn ui-btn-md ui-btn-primary">Buy 10 min ticket — PHP 499</span>
        <span className="ui-btn ui-btn-md ui-btn-primary">Buy 30 min ticket — PHP 1,399</span>
      </div>
    </div>
  );
}

// --- 5. My Sessions --------------------------------------------------------------------------

const HOST_ROWS = [
  { title: "ゆっくり雑談しよう", date: "10/30", time: "19:09", status: "配信中", state: "live" as const, level: 2, left: 2, total: 4, thumb: 2 },
  { title: "夏祭りの思い出を話そう", date: "10/30", time: "21:19", status: "あと 2時間", state: "upcoming" as const, level: 3, left: 3, total: 5, thumb: 3 },
  { title: "なんでもフリートーク", date: "11/06", time: "22:00", status: "あと 7日", state: "upcoming" as const, level: 6, left: 5, total: 5, thumb: 1 },
];

function HostRowsMock() {
  return (
    <div className="grid gap-3">
      {HOST_ROWS.map((row) => (
        <Ticket
          key={row.title}
          stubWidth="112px"
          notch={18}
          cutout="var(--bg)"
          stubColor={stateColor(row.state)}
          stub={
            <div className="grid gap-0.5 py-3 text-center">
              <p className="text-2xl font-black leading-none">{row.date}</p>
              <p className="text-sm font-black opacity-90">{row.time}</p>
              <p className="mt-1 text-[10px] font-black opacity-80">{row.status}</p>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/image/thumbnail/samples/thumbnail_${row.thumb}.jpg`} alt="" className="aspect-video w-28 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[var(--brand-text)]">{row.title}</p>
              <div className="mt-2 flex items-center gap-3 text-xs font-bold text-[var(--brand-text-muted)]">
                <AjlSquare level={row.level} size={18} />
                <span className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: row.total }, (_, index) => (
                    <span
                      key={index}
                      className="h-2.5 w-4 rounded-full"
                      style={{ background: index < row.total - row.left ? "var(--brand-primary)" : "var(--track)" }}
                    />
                  ))}
                </span>
                <span>
                  予約 {row.total - row.left}/{row.total}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <span className={`ui-btn ui-btn-sm ${row.state === "live" ? "ui-btn-primary" : "ui-btn-ghost"}`}>
                {row.state === "live" ? "配信画面へ" : "配信を始める"}
              </span>
              <span className="ui-btn ui-btn-sm ui-btn-ghost">編集</span>
            </div>
          </div>
        </Ticket>
      ))}
    </div>
  );
}

export function TicketFamilyBoard() {
  return (
    <div className="grid gap-8">
      <div className="ui-panel grid gap-3 p-6 text-sm leading-relaxed">
        <h3 className="text-lg font-black">チケットの形を、ほかの画面へ広げる</h3>
        <p>
          join ページのチケット（左の半券に日時、ミシン目の右に中身）を、ほかの画面にも使った見本。3 のマイチケットは /tickets に実装済み。4・5 はまだ見本だけ。
          半券の色のルールは join と同じ（これから＝紫 / 配信中＝赤 / 終了＝灰色）。
        </p>
      </div>

      <Board
        title="3. マイチケット（実装済み：/tickets）"
        idea="今は、予約した枠を一覧で見られる場所がない。予約した枠を半券の形で並べ、配信中のものは「今すぐ入る」を前に出す。過去のものは灰色にして、タブを分ける。"
        notes={{
          good: ["join のチケットと同じ形なので、「さっき予約したもの」がここに並んでいると分かる", "半券の日付だけを縦に追えば、予定がすぐ読める"],
          watch: ["ヘッダーのどこから入るかを決める必要がある（アカウントのメニュー、または「Live／Schedule」の横）", "予約が多い人では縦に長くなる。月ごとの見出しが要るかもしれない"],
        }}
      >
        <div className="flex flex-wrap items-start gap-6">
          <Stage label="PC" className="max-w-[760px] flex-1 basis-[520px]">
            <MyTicketsMock />
          </Stage>
          <Stage label="スマホ（サムネイルを省く）" className="w-[360px]">
            <MyTicketsMock compact />
          </Stage>
        </div>
      </Board>

      <Board
        title="4. チャンネルページの 1on1 チケット"
        idea="今は同じ大きさのボタンが2つ並んでいるだけ。半券に「10分 / 30分」を大きく、本体に値段と一言。おすすめの方は半券を濃い紫にする。"
        notes={{
          good: ["「チケットを買う」という言葉と形が一致する", "違い（時間）が半券でいちばん大きく出るので、選びやすい"],
          watch: ["join の「枠のチケット」と、買う「1on1 チケット」が同じ形になる。持っているものと、これから買うものの区別は、ボタン（予約する / 買う）に頼ることになる"],
        }}
      >
        <div className="flex flex-wrap items-start gap-6">
          <Stage label="今" className="max-w-[640px] flex-1 basis-[420px]">
            <OneOnOneNow />
          </Stage>
          <Stage label="チケットの形" className="max-w-[640px] flex-1 basis-[420px]">
            <OneOnOneMock />
          </Stage>
        </div>
      </Board>

      <Board
        title="5. 配信者の My Sessions の行"
        idea="各行の左に、日時の半券を付ける。今は日付が2回（「09/07 16:29」の札と「9/7/2026」）出ているので、半券の1回にまとめる。予約の入り具合は、join と同じ席のゲージで。"
        notes={{
          good: ["日付が1回になり、行が読みやすくなる", "視聴者のマイチケットと同じ形なので、配信者にも「売っている枠」のイメージが伝わる", "配信中の行が赤い半券で目立つ"],
          watch: ["配信者にとっては「チケット」というより「予定表」。形の意味が少し弱い", "行が少し縦に高くなる"],
        }}
      >
        <Stage label="PC" className="max-w-[900px]">
          <HostRowsMock />
        </Stage>
      </Board>

      <div className="ui-panel p-6 text-sm leading-relaxed">
        <p className="font-black">見本だけで、本番では使っていない部分</p>
        <p className="mt-1 text-[var(--brand-text-muted)]">
          予約済みのスタンプは join ページにだけ入れてある。マイチケットに並ぶものは全部「予約済み」なので、ここではスタンプを押していない。
        </p>
      </div>
    </div>
  );
}
