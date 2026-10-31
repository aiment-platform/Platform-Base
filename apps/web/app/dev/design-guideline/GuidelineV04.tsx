"use client";

/**
 * UI ver0.4（試作）のデザインルール。
 *
 * ver0.4 は ver0.31 の上に app/styles/v04.css を重ねたもの（<html data-ui="0.4"> のときだけ効く）。
 * なのでこのページは「0.31 から何が変わるか」だけを並べる。書いていないことは 0.31 のまま。
 * v04.css を変えたら、このページも一緒に直す。
 */
import type { ReactNode } from "react";
import { Button } from "../../components/ui/Button";
import { setUiVersion, useUiVersion } from "../../lib/uiVersion";
import { CardShowcase, SectionNote, SwatchTable, type SwatchGroup } from "./shared";

/* --- 色（app/styles/v04.css の「1・2. 書体と色」と同じ並び） ------------------ */
const PALETTE: SwatchGroup[] = [
  {
    title: "面（灰色 → 紫寄りに）",
    items: [
      { name: "Background", hex: "#F8F7FF", token: "--bg", use: "ページ全体の背景（0.31 は #F7F7F7）" },
      { name: "Sunken", hex: "#EFECFE", token: "--sunken", use: "検索欄・切替の土台（0.31 は #EFEFEF）" },
      { name: "Line", hex: "#E4DFFC", token: "--line / --track", use: "区切り線・進捗バーの溝" },
      { name: "Placeholder", hex: "#DCD5FD", token: "--placeholder / --float-edge", use: "画像なしの面・浮く面の縁" },
    ],
  },
  {
    title: "文字（黒に近すぎない紫寄りの灰）",
    items: [
      { name: "Text", hex: "#4A4166", token: "--text", use: "見出し・本文（背景で 8.8:1）" },
      { name: "Text Sub", hex: "#7A7394", token: "--text-sub", use: "補足（白地で 4.6:1）" },
    ],
  },
  {
    title: "0.4 で増えた色",
    items: [
      { name: "Surface Edge", hex: "#DCD5FD", token: "--surface-edge", use: "白い面の縁・副ボタンの厚み" },
      { name: "Card Edge", hex: "#CFC6FB", token: "--card-edge", use: "配信枠カードの厚み（触れたときだけ）" },
      { name: "Lime", hex: "#D9FF4A", token: "--lime", use: "2色目。ナビの現在地だけ" },
      { name: "Lime Dark", hex: "#A8D417", token: "--lime-dark", use: "ライムの厚み" },
    ],
  },
];

const CHANGES = [
  { area: "書体", before: "角ゴシック", after: "丸ゴシック（英 Nunito → 日 M PLUS Rounded 1c）" },
  { area: "背景・線・文字", before: "灰色", after: "紫寄りの灰（上の色見本）" },
  { area: "パネル（.ui-panel / .ui-card）", before: "縁なし・角丸 18px", after: "1.5px の薄紫の縁・角丸 20px。厚みは付けない" },
  { area: "副ボタン（ghost / secondary）", before: "灰色の塗り", after: "白い面＋薄紫の縁と厚み" },
  { area: "ボタンの文字", before: "700（bold）", after: "800（extrabold）" },
  { area: "ナビの現在地", before: "紫の塗り＋白い文字", after: "ライムの札＋ライムの厚み" },
  { area: "一覧の見出し・件数", before: "見出し 18px / bold。件数はただの灰色の数字", after: "見出し 18px / 800。件数は沈んだ面の丸い札" },
  { area: "配信枠カード", before: "いつも同じ見た目", after: "触れたときだけ 4px 持ち上がって厚みが出る" },
  { area: "AJL レベル", before: "タブの上に載る小さな札（数字は常に表示）", after: "タブ左端の正方形。数字は触れたときだけ（スマホは常に）" },
  { area: "カードの時刻", before: "黒 60%・13px", after: "黒 72%・12px、角に寄せて小さく（縁・厚みなし）" },
  { area: "UPCOMING の帯", before: "表示", after: "出さない（下の一覧のくり返しだから）" },
];

const SECTIONS = [
  ["v04-about", "0.4 とは"],
  ["v04-principles", "原則"],
  ["v04-changes", "0.31 との違い"],
  ["v04-color", "色"],
  ["v04-type", "文字"],
  ["v04-depth", "厚み"],
  ["v04-card", "配信枠カード"],
  ["v04-code", "コードの地図"],
] as const;

/* --- 小さな部品 ----------------------------------------------------------- */
function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className="ui-panel scroll-mt-24 p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {lead ? <p className="mt-1 text-sm leading-relaxed text-[var(--brand-text-muted)]">{lead}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-bold text-[var(--brand-text-muted)]">{children}</p>;
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-[var(--brand-bg-900)] px-1.5 py-0.5 font-mono text-xs text-[var(--brand-text)]">{children}</code>;
}

/* 見本は本物の部品なので、0.4 表示になっていないと 0.31 の見た目で出る。その切り替え口 */
function PreviewSwitch() {
  const version = useUiVersion();
  if (version === "0.4") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--brand-primary-soft)] px-4 py-3 text-sm text-[var(--brand-primary-ink)]">
        <span>いま ver0.4 で表示しています。下の見本は 0.4 の見た目です。</span>
        <Button size="sm" variant="ghost" onClick={() => setUiVersion("0.31")}>
          0.31 に戻す
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--brand-warning-soft)] px-4 py-3 text-sm text-[var(--brand-warning-ink)]">
      <span>いまは ver0.31 で表示中です。下のボタン・カードの見本を 0.4 で見るには切り替えてください。</span>
      <Button size="sm" onClick={() => setUiVersion("0.4")}>
        0.4 で表示する
      </Button>
    </div>
  );
}

function ChangeTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs text-[var(--brand-text-muted)]">
          <tr>
            <th className="py-2 pr-4 font-semibold">どこ</th>
            <th className="py-2 pr-4 font-semibold">0.31</th>
            <th className="py-2 font-semibold">0.4</th>
          </tr>
        </thead>
        <tbody>
          {CHANGES.map((row) => (
            <tr key={row.area} className="border-t border-[var(--line)] align-top">
              <td className="py-2.5 pr-4 font-bold">{row.area}</td>
              <td className="py-2.5 pr-4 text-[var(--brand-text-muted)]">{row.before}</td>
              <td className="py-2.5">{row.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ナビの現在地（ライムの札）の見本。v04.css と同じ値を、表示中の版に関係なく見せる */
function LimeNavSample() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3" style={{ borderBottom: "1.5px solid #dcd5fd" }}>
      {["ホーム", "スケジュール", "チケット"].map((item, index) => (
        <span
          key={item}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{
            fontWeight: 800,
            color: "#4a4166",
            ...(index === 0 ? { background: "#d9ff4a", boxShadow: "0 3px 0 0 #a8d417" } : {}),
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/* --- 本体 ----------------------------------------------------------------- */
export function GuidelineV04() {
  return (
    <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      {/* 目次 */}
      <nav className="hidden lg:block" aria-label="目次">
        <ol className="sticky top-24 space-y-1">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="ui-menu-item h-9 text-sm">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0 space-y-6">
        <Section
          id="v04-about"
          title="0.4 とは"
          lead="ムードボード「A1 Soft Arcade ＋ 書体 まるっと標準」を本物の画面に当てた試作。0.31 の上に差分を重ねている。"
        >
          <PreviewSwitch />
          <SectionNote
            lines={[
              "1. <html data-ui=\"0.4\"> のときだけ app/styles/v04.css が効く。付いていなければ 0.31 のまま",
              "2. 切り替えは画面右下のスイッチ、または URL に ?ui=0.4 / ?ui=0.31。選んだ値はこのブラウザにだけ保存される",
              "3. ここに書いていないルール（角丸・ボタンの種類・入力欄など）は 0.31 タブのとおり",
              "4. やめるときは v04.css と globals.css の import を消すだけで跡形もなく戻る",
            ]}
          />
        </Section>

        <Section id="v04-principles" title="原則" lead="装飾は足さない。足すのは2か所だけに絞る。">
          <SectionNote
            lines={[
              "1. 厚みは押せるものだけ。ボタンと、触れたときのカード。置いてあるだけのパネルは平ら（細い縁だけ）",
              "2. ライムは「いま」「ここ」の1か所だけ（ナビの現在地）。あちこちに使うと目印にならない",
              "3. 見出しは大きくしない。何の一覧か分かれば十分で、大きいと一覧を押し下げる",
              "4. 同じ情報を2回出さない（UPCOMING の帯を省いた理由）",
            ]}
          />
        </Section>

        <Section id="v04-changes" title="0.31 との違い" lead="0.4 で変わるのはこの表の所だけ。">
          <ChangeTable />
        </Section>

        <Section id="v04-color" title="色" lead="変数の値を差し替えているだけなので、画面側は今までどおり var(--brand-*) などを使えばよい。">
          <SwatchTable groups={PALETTE} />
          <div className="mt-6">
            <Label>ライムの使いどころ（ナビの現在地）</Label>
            <LimeNavSample />
          </div>
          <SectionNote
            lines={[
              "1. 背景は白に近いごく薄い紫。紫系のサムネイルが背景に埋もれないよう、濃くしすぎない",
              "2. 本文は真っ黒ではなく紫寄りの灰（#4A4166）。丸い書体と合わせて柔らかく見せる",
              "3. ライムの上の文字は本文の色（--lime-ink）。白にすると読めない",
              "4. 紫・赤・黄の役割は 0.31 と同じ",
            ]}
          />
        </Section>

        <Section id="v04-type" title="文字" lead="丸ゴシックに替え、太さを一段上げる。大きさの5段階は 0.31 と同じ。">
          <div className="divide-y divide-[var(--line)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span className="text-lg" style={{ fontWeight: 800 }}>
                一覧の見出し
              </span>
              <span className="text-xs text-[var(--brand-text-muted)]">.ui-section-title / 18px / 800</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span className="ui-count">12</span>
              <span className="text-xs text-[var(--brand-text-muted)]">.ui-count / 12px / 800・沈んだ面の丸い札（0.4 表示時）</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span className="text-sm" style={{ fontWeight: 800 }}>
                ボタン・ナビの文字
              </span>
              <span className="text-xs text-[var(--brand-text-muted)]">800</span>
            </div>
          </div>
          <SectionNote
            lines={[
              "1. 書体は --font-latin / --font-jp の差し替えで全体に効く。英字は Nunito、和文は M PLUS Rounded 1c（layout.tsx で読み込み）",
              "2. 最小 11px の決まりは 0.31 と同じ",
            ]}
          />
        </Section>

        <Section id="v04-depth" title="厚み" lead="押せるものには厚み、置いてあるだけのものは平ら。0.4 表示にすると下の見本が 0.4 の見た目になる。">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ui-sunken p-4">
              <Label>押せるもの</Label>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="secondary">Secondary</Button>
              </div>
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">副ボタンは白い面＋薄紫の縁と厚み（灰色の塗りをやめた）</p>
            </div>
            <div className="ui-sunken p-4">
              <Label>置かれた面</Label>
              <div className="ui-panel p-4 text-sm">.ui-panel</div>
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">1.5px の薄紫の縁・角丸 20px。厚みがあると押せそうに見えるので付けない</p>
            </div>
          </div>
        </Section>

        <Section id="v04-card" title="配信枠カード" lead="フォルダ形はそのまま。厚みは触れたときだけ出す。">
          <CardShowcase />
          <SectionNote
            lines={[
              "1. 普段は厚みなし。サムネイルの下に厚みがあると「紙が1枚重なった線」に見えるため",
              "2. 触れたら 4px 持ち上げ、--card-edge の硬い厚み（drop-shadow のぼかし 0）を出す。フォルダは mask で描いているので box-shadow では形に沿わない",
              "3. 角丸は 90° の角が 18、斜めの肩が 37（session_container_v04.svg）。弧の長さをそろえて、左上だけ丸く見えるのを防いでいる",
              "4. AJL はタブ左端の正方形。数字は触れたとき・キーボードで選んだときに出す。ホバーのない端末と LP の挿絵では常に出す",
              "5. 時刻は黒の半透明＋白い文字の札。どんなサムネイルの上でも読めて、絵の邪魔をしない",
            ]}
          />
        </Section>

        <Section id="v04-code" title="コードの地図" lead="0.4 に関わるのはこれだけ。">
          <div className="divide-y divide-[var(--line)]">
            {[
              { file: "app/styles/v04.css", what: "0.4 の差分すべて。値もルールもここ" },
              { file: "app/lib/uiVersion.ts", what: "切り替え（setUiVersion / useUiVersion）" },
              { file: "app/lib/uiVersionBoot.ts", what: "最初の描画より前に data-ui を付ける小さなスクリプト（一瞬 0.31 が見えるのを防ぐ）" },
              { file: "app/components/ui/UiVersionToggle.tsx", what: "画面右下のスイッチ（開発中だけ表示）" },
              { file: "public/svg/session_*_v04.svg", what: "配信枠カードの形（角丸を直したもの）" },
            ].map((row) => (
              <div key={row.file} className="grid gap-1 py-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-4">
                <span>
                  <Code>{row.file}</Code>
                </span>
                <span className="text-sm text-[var(--brand-text-muted)]">{row.what}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
