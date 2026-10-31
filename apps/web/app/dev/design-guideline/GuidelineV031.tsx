"use client";

/**
 * 現行のデザインルール（UI ver0.31）。
 *
 * 値の実体は app/styles/tokens.css、部品の見た目は app/styles/*.css にある。
 * このページはそれを「見本＋使い方」として並べたもの。ルールを変えたら、
 * CSS とこのページを一緒に直す。
 */
import { useState, type ReactNode } from "react";
import { PencilSquareIcon, TrashIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import {
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  PlayIcon,
  StopIcon,
  UserIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { BrandProgressBar } from "../../components/ui/BrandProgressBar";
import { Button } from "../../components/ui/Button";
import { FieldLabel, SelectField, TextArea, TextInput } from "../../components/ui/Field";
import { AJL_LEVELS } from "../../lib/ajl";
import { CardShowcase, SectionNote, SwatchTable, TransitionShowcase, type SwatchGroup } from "./shared";

/* --- 色（app/styles/tokens.css の「2. 素の色」と同じ並び） ------------------ */
const PALETTE: SwatchGroup[] = [
  {
    title: "面",
    items: [
      { name: "Background", hex: "#F7F7F7", token: "--bg", use: "ページ全体の背景", ink: "#494746" },
      { name: "Surface", hex: "#FFFFFF", token: "--surface", use: "パネル・カード・浮く面", ink: "#494746" },
      { name: "Sunken", hex: "#EFEFEF", token: "--sunken", use: "白い面の中の沈んだ部分・副ボタン", ink: "#494746" },
      { name: "Line", hex: "#E7E7E7", token: "--line", use: "区切り線（ヘッダー下など）", ink: "#494746" },
    ],
  },
  {
    title: "ブランド（紫）",
    items: [
      { name: "Primary", hex: "#7665F6", token: "--primary", use: "主ボタン・選択中・オン" },
      { name: "Primary Dark", hex: "#5E49EE", token: "--primary-dark", use: "紫ボタンの厚み・白地の上の紫の文字（--brand-primary-ink）" },
      { name: "Primary Light", hex: "#9180F7", token: "--primary-light", use: "配信枠カードのタブ" },
      { name: "Primary Soft", hex: "#EEEBFE", token: "--primary-soft", use: "選択中・成功メッセージ・札の下敷き", ink: "#5E49EE" },
    ],
  },
  {
    title: "状態",
    items: [
      { name: "Accent", hex: "#EB4E60", token: "--accent", use: "退出・削除など危険な操作・LIVE" },
      { name: "Accent Dark", hex: "#CF2C2E", token: "--accent-dark", use: "赤ボタンの厚み" },
      { name: "Accent Ink", hex: "#C8283A", token: "--accent-ink", use: "エラー文などの赤い文字" },
      { name: "Accent Soft", hex: "#FDEAEC", token: "--accent-soft", use: "エラーの下敷き", ink: "#C8283A" },
      { name: "Warning", hex: "#F2A93B", token: "--warning", use: "注意の塗り（文字には使わない）", ink: "#494746" },
      { name: "Warning Ink", hex: "#9A5B00", token: "--warning-ink", use: "注意の文字" },
      { name: "Warning Soft", hex: "#FDF3E1", token: "--warning-soft", use: "注意の下敷き", ink: "#9A5B00" },
      { name: "Neutral", hex: "#BDBDBD", token: "--neutral", use: "オフ状態の操作ボタン" },
      { name: "Neutral Dark", hex: "#A4A4A4", token: "--neutral-dark", use: "オフ状態の厚み" },
    ],
  },
  {
    title: "文字・グレー",
    items: [
      { name: "Text", hex: "#494746", token: "--text", use: "見出し・本文" },
      { name: "Text Sub", hex: "#999999", token: "--text-sub", use: "補足・注釈" },
      { name: "Placeholder", hex: "#D9D9D9", token: "--placeholder", use: "画像なし・グレーボタンの厚み", ink: "#494746" },
      { name: "Track", hex: "#E7E7E7", token: "--track", use: "進捗バーの溝", ink: "#494746" },
    ],
  },
];

const TYPE_SCALE = [
  { label: "ページ見出し", className: "text-2xl font-bold", spec: "text-2xl（24px）/ bold" },
  { label: "セクション見出し", className: "text-lg font-bold", spec: "text-lg（18px）/ bold" },
  { label: "本文・ボタン", className: "text-sm", spec: "text-sm（14px）/ semibold（全体の既定）" },
  { label: "補足", className: "text-xs text-[var(--brand-text-muted)]", spec: "text-xs（12px）/ Text Sub" },
  { label: "注釈（最小）", className: "text-[11px] text-[var(--brand-text-muted)]", spec: "text-[11px] / これより小さくしない" },
];

const RADII = [
  { label: "小", token: "--ui-radius-sm", value: "10px", tailwind: "rounded-md / rounded-lg", use: "入力欄・チップ・小さな部品" },
  { label: "中", token: "--ui-radius-md", value: "14px", tailwind: "rounded-xl", use: "ボタン・メニュー・切替" },
  { label: "大", token: "--ui-radius-lg", value: "18px", tailwind: "rounded-2xl / rounded-3xl", use: "パネル・モーダル" },
  { label: "丸", token: "--ui-radius-pill", value: "999px", tailwind: "rounded-full", use: "アバター・バッジ・点" },
];

const CODE_MAP = [
  { file: "app/styles/tokens.css", what: "色・文字・角丸・深さの値。サイト全体の見た目を変えるならここ" },
  { file: "app/styles/controls.css", what: "ボタン（.ui-btn）、操作ボタン（.ui-ctl）、切替、入力欄、メニュー行" },
  { file: "app/styles/surfaces.css", what: "面（.ui-panel / .ui-sunken / .ui-float）" },
  { file: "app/styles/session-card.css", what: "配信枠カード" },
  { file: "app/styles/transitions.css", what: "画面遷移の演出（ワイプと画面下の帯）" },
  { file: "app/styles/base.css", what: "フォント、body、フォーム要素の既定" },
  { file: "app/styles/landing/*.css", what: "LP（/lp, /for-vtubers, /for-mates）固有の部分" },
  { file: "app/styles/legacy-v02.css", what: "旧 ver0.2 の見本専用。新しい画面では使わない" },
  { file: "app/components/ui/Button.tsx", what: "<Button variant size> と buttonClassName()。.ui-btn を組み立てる" },
  { file: "app/components/ui/Card.tsx / Field.tsx", what: "面（.ui-panel）と入力欄の部品" },
];

const SECTIONS = [
  ["principles", "原則"],
  ["color", "色"],
  ["type", "文字"],
  ["radius", "角丸"],
  ["depth", "深さ"],
  ["buttons", "ボタン"],
  ["controls", "操作ボタン"],
  ["surfaces", "面"],
  ["inputs", "入力"],
  ["card", "配信枠カード"],
  ["transition", "画面遷移"],
  ["code", "コードの地図"],
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

/* 色の役割の早見表。新しい色を足す前にここを見る。 */
const COLOR_ROLES = [
  { color: "紫", token: "--brand-primary", fill: "主ボタン、選択中、オン（スイッチ）、進捗、成功・完了", text: "リンク、日時、予定、保存しました（-ink）", never: "意味のない飾り" },
  { color: "赤", token: "--brand-accent", fill: "退出・削除、LIVE", text: "エラー文、必須の印（-ink）", never: "予定・お知らせの見出し" },
  { color: "黄", token: "--brand-warning", fill: "注意の札、LP の Learner", text: "注意文（-ink のみ）", never: "白地の上の文字（読めない）" },
  { color: "AJL の6色", token: "ajl.color", fill: "難易度の札だけ", text: "使わない", never: "札以外のすべて" },
];

function ColorRoles() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs text-[var(--brand-text-muted)]">
          <tr>
            <th className="py-2 pr-4 font-semibold">色</th>
            <th className="py-2 pr-4 font-semibold">塗り（面）に使う</th>
            <th className="py-2 pr-4 font-semibold">文字に使う</th>
            <th className="py-2 font-semibold">使わない</th>
          </tr>
        </thead>
        <tbody>
          {COLOR_ROLES.map((role) => (
            <tr key={role.color} className="border-t border-[var(--line)] align-top">
              <td className="py-2.5 pr-4">
                <p className="font-bold">{role.color}</p>
                <Code>{role.token}</Code>
              </td>
              <td className="py-2.5 pr-4">{role.fill}</td>
              <td className="py-2.5 pr-4">{role.text}</td>
              <td className="py-2.5 text-[var(--brand-text-muted)]">{role.never}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusSamples() {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <p className="rounded-lg bg-[var(--brand-primary-soft)] px-3 py-2 text-sm text-[var(--brand-primary-ink)]">保存しました</p>
      <p className="rounded-lg bg-[var(--brand-warning-soft)] px-3 py-2 text-sm text-[var(--brand-warning-ink)]">開発用コード: 123456</p>
      <p className="rounded-lg bg-[var(--brand-accent-soft)] px-3 py-2 text-sm text-[var(--brand-accent-ink)]">送信に失敗しました</p>
      <span className="rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--brand-primary-ink)]">配信前</span>
      <span className="rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--brand-accent-ink)]">配信中</span>
      <span className="rounded-full bg-[var(--brand-bg-900)] px-2.5 py-1 text-[11px] font-bold text-[var(--brand-text-muted)]">終了</span>
    </div>
  );
}

/* 見本の舞台。ページの背景・ヘッダー・置かれた面を小さく再現する */
function FloatStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[230px] overflow-hidden rounded-xl bg-[var(--bg)]">
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)] bg-[var(--brand-surface)] px-3">
        <span className="h-2.5 w-14 rounded-full bg-[var(--brand-primary)]" />
        <span className="h-5 w-16 rounded-lg bg-[var(--brand-bg-900)]" />
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="h-20 rounded-xl bg-[var(--brand-surface)]" />
        <div className="h-20 rounded-xl bg-[var(--brand-surface)]" />
        <div className="h-16 rounded-xl bg-[var(--brand-surface)]" />
        <div className="h-16 rounded-xl bg-[var(--brand-surface)]" />
      </div>
      {children}
    </div>
  );
}

/* 小さく浮く面（メニュー）の見本 */
function FloatMenuSample() {
  return (
    <FloatStage>
      <div className="ui-float absolute right-3 top-11 w-[132px] p-1.5">
        {["プロフィール", "設定", "ログアウト"].map((item) => (
          <div key={item} className="ui-menu-item text-xs">
            {item}
          </div>
        ))}
      </div>
    </FloatStage>
  );
}

/* 画面を占領する面（モーダル）の見本。幕は舞台の中だけに敷く */
function ModalSample() {
  return (
    <FloatStage>
      <div className="ui-scrim absolute inset-0" />
      <div className="ui-modal absolute inset-x-4 top-1/2 -translate-y-1/2 p-3">
        <p className="text-xs font-bold">予約を確定しますか？</p>
        <p className="mt-1 text-[11px] text-[var(--brand-text-muted)]">9/7 16:29 の配信枠</p>
        <div className="mt-3 flex gap-2">
          <span className="ui-btn ui-btn-sm ui-btn-primary flex-1">確定</span>
          <span className="ui-btn ui-btn-sm ui-btn-ghost flex-1">戻る</span>
        </div>
      </div>
    </FloatStage>
  );
}

function LevelBadges() {
  return (
    <div className="flex flex-wrap items-start gap-5 rounded-2xl p-6" style={{ background: "var(--brand-primary-light)" }}>
      {AJL_LEVELS.map((level) => (
        <span
          key={level.level}
          className="grid h-11 w-11 place-items-center rounded-lg text-xl font-bold leading-none text-white"
          style={{ background: level.color, boxShadow: `0 4px 0 0 ${level.dropColor}` }}
        >
          {level.level}
        </span>
      ))}
    </div>
  );
}

/* --- 本体 ----------------------------------------------------------------- */
export function GuidelineV031() {
  const [segment, setSegment] = useState<"JP" | "EN">("JP");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatOn, setChatOn] = useState(true);

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
        <Section id="principles" title="原則" lead="迷ったらこの4つに戻る。ここに合わないものは、方言（ばらつき）として直す対象。">
          <SectionNote
            lines={[
              "1. マット。面はべた塗りで、グラデーションやにじんだ影で質感を足さない",
              "2. 押せるものには厚みを付ける。面の下にぼかしのない濃い色の縁があり、押すと縁の分だけ沈む",
              "3. ぼかした影は使わない。浮くものは「縁＋硬い厚み」（メニュー）か「幕」（モーダル）で見せる",
              "4. 枠線で囲まない。区別は面の色の差で付ける。線を引いてよいのは区切り線（--line）だけ",
            ]}
          />
        </Section>

        <Section id="color" title="色" lead="画面では役割の名前（--brand-*）で使う。色を増やす前に、ここにある色で表せないか考える。">
          <SwatchTable groups={PALETTE} />
          <div className="mt-6">
            <Label>役割の早見表</Label>
            <ColorRoles />
          </div>
          <div className="mt-6">
            <Label>状態の表し方（薄い塗り＋同じ色の -ink の文字）</Label>
            <StatusSamples />
          </div>
          <div className="mt-6">
            <Label>AJLレベル（配信枠カードのバッジ）</Label>
            <LevelBadges />
          </div>
          <SectionNote
            lines={[
              "1. ページの背景は --bg（ごく薄いグレー）、その上に白い面。白い面の中の沈んだ部分は --sunken（背景より一段濃いグレー）",
              "2. 色は「紫＝ブランド・操作・成功・オン」「赤＝危険・LIVE」「黄＝注意」。意味のない飾りに色を使わない",
              "3. 白地に色の文字を書くときは、必ず -ink（濃いほう）を使う。面の色（--brand-primary など）をそのまま文字にすると読みにくい",
              "4. 紫・赤の面の上の文字・アイコンは白。黄の面の上は本文の色",
              "5. AJL の6色は難易度の札専用。ほかの用途に流用しない",
            ]}
          />
        </Section>

        <Section id="type" title="文字" lead="太さは全体で semibold が既定。大きさは5段階だけ使う。">
          <div className="divide-y divide-[var(--line)]">
            {TYPE_SCALE.map((item) => (
              <div key={item.label} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span className={item.className}>{item.label}</span>
                <span className="text-xs text-[var(--brand-text-muted)]">{item.spec}</span>
              </div>
            ))}
          </div>
          <SectionNote lines={["1. 最小は 11px（--ui-text-min）。それより小さい指定はしない", "2. 薄いグレーの文字（Text Sub）は補足だけ。本文には使わない"]} />
        </Section>

        <Section
          id="radius"
          title="角丸"
          lead="3段階＋丸。Tailwind の rounded-* はこの値に結び付けてあるので、クラス名を選ぶだけでそろう。"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {RADII.map((radius) => (
              <div key={radius.token} className="ui-sunken flex items-center gap-4 p-4">
                <span className="h-14 w-20 shrink-0 bg-[var(--brand-primary)]" style={{ borderRadius: `var(${radius.token})` }} />
                <span className="min-w-0 text-sm">
                  <span className="block font-bold">
                    {radius.label}　{radius.value}
                  </span>
                  <span className="block text-xs text-[var(--brand-text-muted)]">{radius.tailwind}</span>
                  <span className="block text-xs text-[var(--brand-text-muted)]">{radius.use}</span>
                </span>
              </div>
            ))}
          </div>
          <SectionNote lines={["1. rounded-[28px] のような任意の値は使わない", "2. 入れ子にするときは、外側を大きく、内側を小さく（パネル=大、中のボタン=中、入力欄=小）"]} />
        </Section>

        <Section id="depth" title="深さ" lead="ぼかした影は使わない。押せるものの「厚み」、小さく浮くものの「縁＋厚み」、モーダルの「幕」の3つだけ。ページに置かれた面は平ら。">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ui-sunken p-4">
              <Label>押せるもの（厚み）</Label>
              <Button>押せるボタン</Button>
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">ぼかしのない濃い色の縁。押すと沈む</p>
            </div>
            <div className="ui-sunken p-4">
              <Label>置かれた面（平ら）</Label>
              <div className="ui-panel p-4 text-sm">.ui-panel</div>
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">影なし。背景との色差で区切る</p>
            </div>
            <div className="ui-sunken p-4">
              <Label>小さく浮く面（.ui-float）</Label>
              <FloatMenuSample />
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">メニュー・ツールチップ・日付選択。四方に 1px の縁＋下に 4px の硬い厚み（--ui-shadow-float）</p>
            </div>
            <div className="ui-sunken p-4">
              <Label>モーダル（.ui-scrim＋.ui-modal）</Label>
              <ModalSample />
              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">後ろを幕（--ui-scrim）で覆い、面は影なし</p>
            </div>
          </div>
          <SectionNote
            lines={[
              "1. ぼかした影（shadow-lg や 0 12px 32px のような指定）は使わない",
              "2. 小さく浮く面は「重なった板」。縁があるので、出っ張ったボタンとは見分けが付く",
              "3. モーダルの幕は黒ではなく --ui-scrim（本文と同じ灰色の35%）。画面が暗くなりすぎない",
            ]}
          />
        </Section>

        <Section id="buttons" title="ボタン" lead="すべて .ui-btn。React では <Button variant size>、リンクなどには buttonClassName() を使う。">
          <div className="space-y-6">
            <div>
              <Label>種類</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="danger">Danger</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <Label>大きさ</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small 34px</Button>
                <Button size="md">Medium 42px</Button>
                <Button size="lg">Large 52px</Button>
              </div>
            </div>
            <div>
              <Label>通常と、押している状態</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button>通常</Button>
                <button type="button" className="ui-btn ui-btn-md ui-btn-primary" data-pressed="true">
                  押している
                </button>
              </div>
            </div>
            <div>
              <Label>アイコン付き・アイコンだけ</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button>
                  <PlayIcon className="h-4 w-4" aria-hidden />
                  配信開始
                </Button>
                <Button variant="soft">
                  <PencilSquareIcon className="h-4 w-4" aria-hidden />
                  編集
                </Button>
                <Button variant="danger">
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  削除
                </Button>
                <Button variant="ghost">
                  <UserPlusIcon className="h-4 w-4" aria-hidden />
                  参加
                </Button>
                <button type="button" aria-label="閉じる" className="ui-btn ui-btn-md ui-btn-ghost ui-btn-square">
                  <XMarkIcon className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <div>
              <Label>分割ボタン（本体と選択）</Label>
              <div className="ui-btn-group">
                <button type="button" className="ui-btn ui-btn-md ui-btn-primary">
                  作成して開始
                </button>
                <button type="button" aria-label="モードを選択" className="ui-btn ui-btn-md ui-btn-primary px-3">
                  <ChevronDownIcon className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <div>
              <Label>切替（JP/EN など）</Label>
              <div className="ui-segment" role="group" aria-label="見本">
                {(["JP", "EN"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSegment(option)}
                    aria-pressed={segment === option}
                    className="ui-segment__option"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <SectionNote
            lines={[
              "1. Primary は画面の主役の操作に1つ。Danger は退出・削除など取り消せない操作だけ",
              "2. 副ボタンは Ghost（灰色の面＋灰色の文字）。紫の文字で少し強めたいときは Secondary",
              "3. 同じ行に並ぶ操作は1つだけ Primary。削除は行に出さず「…」メニューの中へ（危険な操作を目立たせすぎない）",
              "4. アイコンは文字の前に h-4 w-4。アイコンだけのボタンには aria-label を必ず付ける",
              "5. メニューの中の行はボタンにせず .ui-menu-item（厚みなし）にする",
            ]}
          />
        </Section>

        <Section
          id="controls"
          title="操作ボタン"
          lead="配信画面・ルーム画面の丸い操作ボタン（.ui-ctl）。作りは .ui-btn と同じで、大きさと色の付け方だけ違う。"
        >
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => setMicOn((value) => !value)}
              aria-pressed={micOn}
              aria-label="マイク"
              className={`ui-ctl ui-ctl-md ui-ctl-icon ${micOn ? "ui-ctl-primary" : "ui-ctl-neutral"}`}
            >
              <MicrophoneIcon className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setVideoOn((value) => !value)}
              aria-pressed={videoOn}
              aria-label="映像"
              className={`ui-ctl ui-ctl-md ui-ctl-icon ${videoOn ? "ui-ctl-primary" : "ui-ctl-neutral"}`}
            >
              {videoOn ? <VideoCameraIcon className="h-5 w-5" aria-hidden /> : <VideoCameraSlashIcon className="h-5 w-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => setChatOn((value) => !value)}
              aria-pressed={chatOn}
              aria-label="コメント"
              className={`ui-ctl ui-ctl-md ui-ctl-icon ${chatOn ? "ui-ctl-primary" : "ui-ctl-neutral"}`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className="ui-ctl ui-ctl-md ui-ctl-icon ui-ctl-danger" aria-label="退出">
              <PhoneXMarkIcon className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className="ui-ctl ui-ctl-md ui-ctl-danger">
              <StopIcon className="h-4 w-4" aria-hidden />
              配信終了
            </button>
            <button type="button" className="ui-tile h-[96px] w-[96px]" aria-label="プロフィール">
              <UserIcon className="h-12 w-12" aria-hidden />
            </button>
          </div>
          <SectionNote lines={["1. オン = Primary、オフ = Neutral。押して切り替えて試せる", "2. 退出・配信終了は Danger 固定"]} />
        </Section>

        <Section id="surfaces" title="面" lead="面は4種類だけ。ぼかした影はどれにも使わない。">
          <div className="grid gap-4 rounded-2xl bg-[var(--bg)] p-5 sm:grid-cols-3">
            <div className="ui-panel p-4">
              <p className="text-sm font-bold">.ui-panel</p>
              <p className="mt-1 text-xs text-[var(--brand-text-muted)]">ページに置く白い面。影なし</p>
              <div className="ui-sunken mt-3 p-3">
                <p className="text-sm font-bold">.ui-sunken</p>
                <p className="mt-1 text-xs text-[var(--brand-text-muted)]">白い面の中の沈んだ部分</p>
              </div>
            </div>
            <div className="ui-float p-4 sm:self-start">
              <p className="text-sm font-bold">.ui-float</p>
              <p className="mt-1 text-xs text-[var(--brand-text-muted)]">メニュー・ツールチップなど、その場に小さく浮くもの。細い縁＋硬い厚み</p>
            </div>
            <div className="ui-modal p-4 sm:self-start">
              <p className="text-sm font-bold">.ui-modal</p>
              <p className="mt-1 text-xs text-[var(--brand-text-muted)]">モーダル。面は影なしで、後ろに .ui-scrim の幕を敷く</p>
            </div>
          </div>
          <SectionNote
            lines={[
              "1. 背景（--bg）の上には白い面（.ui-panel）を置く",
              "2. 白い面の中で区切りたいときは、線ではなく .ui-sunken（灰色の面）を使う",
              "3. 上下の区切りが必要なときだけ 1px の --line（例: ヘッダーの下）",
            ]}
          />
        </Section>

        <Section id="inputs" title="入力" lead="入力欄は灰色の沈んだ面。枠線は付けず、フォーカス時だけ紫の輪を出す。">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>テキスト</FieldLabel>
              <TextInput className="mt-1" placeholder="タイトルを入力" />
            </label>
            <label className="block">
              <FieldLabel>選択</FieldLabel>
              <SelectField className="mt-1" defaultValue="english">
                <option value="chat">雑談</option>
                <option value="game">ゲーム</option>
                <option value="english">英語</option>
              </SelectField>
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>複数行</FieldLabel>
              <TextArea className="mt-1" rows={3} placeholder="配信の概要を入力" />
            </label>
          </div>
          <SectionNote lines={["1. 部品は Field.tsx の TextInput / SelectField / TextArea（クラスは .ui-input など）", "2. ラベルは FieldLabel（text-xs・Text Sub）"]} />
        </Section>

        <Section id="card" title="配信枠カード" lead="フォルダ形。白フチと落ち影はなく、形と紫の色だけで見せる。">
          <CardShowcase />
          <SectionNote
            lines={[
              "1. タブ = Primary Light、進捗と detail タブ = Primary Dark、進捗の溝 = Track",
              "2. レベルのバッジは AJL ごとの色。下の厚みもボタンと同じ作り",
              "3. サムネ未設定の枠は aiment の標準画像（lib/thumbnail.ts）",
            ]}
          />
        </Section>

        <Section
          id="transition"
          title="画面遷移"
          lead="配信の場（/room, /studio/live）に入る・出るときだけ全画面のワイプ。それ以外は画面下の帯。どちらも読み込みが終わるまで抜けない。"
        >
          <TransitionShowcase />
          <div className="mt-5">
            <Label>画面下の帯（ふつうのページ移動）</Label>
            <div className="h-[120px] overflow-hidden rounded-2xl">
              <BrandProgressBar inline />
            </div>
          </div>
          <SectionNote
            lines={[
              "1. 出し入れは RouteTransition.tsx。抜けるのは「URLが変わった・通信が終わった・ページの待ちがない」がそろったとき",
              "2. ページ側で待たせたいときは useTransitionHold(読み込み中かどうか)",
            ]}
          />
        </Section>

        <Section id="code" title="コードの地図" lead="どこを直せば何が変わるか。">
          <div className="divide-y divide-[var(--line)]">
            {CODE_MAP.map((row) => (
              <div key={row.file} className="grid gap-1 py-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-4">
                <span>
                  <Code>{row.file}</Code>
                </span>
                <span className="text-sm text-[var(--brand-text-muted)]">{row.what}</span>
              </div>
            ))}
          </div>
          <SectionNote
            lines={[
              "1. 画面（.tsx）に色・影・角丸の値を直書きしない。変数（--brand-*）か共通クラスを使う",
              "2. 新しい見た目が必要になったら、まず tokens.css と共通クラスに足してから使う",
            ]}
          />
        </Section>
      </div>
    </div>
  );
}
