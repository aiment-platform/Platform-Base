"use client";

import { ComponentType, SVGProps, useEffect, useState, useSyncExternalStore } from "react";
import { TopNav } from "../../components/home/TopNav";
import { StreamSessionCard } from "../../components/home/StreamSessionCard";
import { BrandProgressBar } from "../../components/ui/BrandProgressBar";
import { BrandTransition } from "../../components/ui/BrandTransition";
import { AJL_LEVELS } from "../../lib/ajl";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FieldLabel, SelectField, TextArea, TextInput } from "../../components/ui/Field";
import { PencilSquareIcon, TrashIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import {
  ChatBubbleLeftRightIcon,
  ChevronUpIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  PlayIcon,
  StopIcon,
  UserIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

type UiVersion = "0.3" | "0.2";

// タブの状態は URL ハッシュに持たせる（#ver0.2 で直接開ける / 共有できる）。
function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readVersionFromHash(): UiVersion {
  return window.location.hash === "#ver0.2" ? "0.2" : "0.3";
}

function serverVersion(): UiVersion {
  return "0.3";
}

type Swatch = {
  name: string;
  hex: string;
  token: string;
  use: string;
  ink?: string;
};

type SwatchGroup = {
  title: string;
  items: Swatch[];
};

/* --------------------------------------------------------------------------
   ver0.3 palette — every hex below is sampled from the ver0.3 mockups.
   This table is the single source of truth for "which colours did we use".
   -------------------------------------------------------------------------- */
const V03_PALETTE: SwatchGroup[] = [
  {
    title: "Base",
    items: [
      { name: "Background", hex: "#FFF9F4", token: "--bg", use: "全ページ共通の背景", ink: "#494746" },
      { name: "Surface", hex: "#FFFFFF", token: "--surface", use: "カード / パネル / シート", ink: "#494746" },
      { name: "Card Ring", hex: "#FFFCF9", token: "--surface-ring", use: "配信枠カードの白フチ", ink: "#494746" },
    ],
  },
  {
    title: "Brand",
    items: [
      { name: "Primary", hex: "#7665F6", token: "--primary", use: "ボタン面 / 主要CTA" },
      { name: "Primary Light", hex: "#9180F7", token: "--primary-light", use: "配信枠カードの上部バー" },
      { name: "Primary Dark", hex: "#5E49EE", token: "--primary-dark", use: "ボタンの厚み / 進捗バー / detailタブ" },
      { name: "Secondary", hex: "#9DEA70", token: "--secondary", use: "AJLレベルバッジ", ink: "#494746" },
    ],
  },
  {
    title: "State",
    items: [
      { name: "Accent", hex: "#EB4E60", token: "--accent", use: "退出 / 配信終了など破壊的操作" },
      { name: "Accent Dark", hex: "#CF2C2E", token: "--accent-dark", use: "accentボタンの厚み" },
      { name: "Neutral", hex: "#BDBDBD", token: "--neutral", use: "OFF状態 / 分割ボタンの副側" },
      { name: "Neutral Dark", hex: "#A4A4A4", token: "--neutral-dark", use: "neutralボタンの厚み" },
    ],
  },
  {
    title: "Gray / Text",
    items: [
      { name: "Track", hex: "#E7E7E7", token: "--track", use: "進捗バーの溝", ink: "#494746" },
      { name: "Placeholder", hex: "#D9D9D9", token: "--placeholder", use: "アバター / 画像の空状態", ink: "#494746" },
      { name: "Text", hex: "#494746", token: "--text", use: "タイトル / 本文" },
      { name: "Text Sub", hex: "#999999", token: "--text-sub", use: "チャンネル名 / 補足" },
      { name: "On Color", hex: "#FFFFFF", token: "—", use: "purple / red 上の文字とアイコン", ink: "#494746" },
    ],
  },
];

const V02_PALETTE: SwatchGroup[] = [
  {
    title: "Base",
    items: [
      { name: "BG", hex: "#252423", token: "--bg", use: "ページ背景（ダーク）" },
      { name: "Surface", hex: "#494746", token: "--surface", use: "カード / パネル" },
    ],
  },
  {
    title: "Brand",
    items: [
      { name: "Primary", hex: "#7C6AE6", token: "--primary", use: "主要CTA" },
      { name: "Primary Light", hex: "#AC9EFF", token: "--primary-light", use: "強調テキスト", ink: "#252423" },
      { name: "Primary Dark", hex: "#6248F7", token: "--primary-dark", use: "進捗バー / detailタブ" },
      { name: "Secondary", hex: "#00E5FF", token: "--secondary", use: "レベルバッジ / アシスト系", ink: "#252423" },
    ],
  },
  {
    title: "State / Text",
    items: [
      { name: "Accent", hex: "#FF3B5C", token: "--accent", use: "破壊的操作" },
      { name: "Text", hex: "#EDEDED", token: "--text", use: "本文", ink: "#252423" },
      { name: "Text Muted", hex: "#A3A09E", token: "--text-sub", use: "補足", ink: "#252423" },
    ],
  },
];

const V03_LEVEL_PALETTE: SwatchGroup = {
  title: "AJL Level Badge",
  items: AJL_LEVELS.map((level) => ({
    name: `Level ${level.level} — ${level.label}`,
    hex: level.color,
    token: `AJL_LEVELS[${level.level - 1}].color`,
    use: level.color === level.dropColor ? "面と厚みが同色" : `厚みは ${level.dropColor}`,
    ink: "#494746",
  })),
};

const SPACING_SCALE = ["8px", "12px", "16px", "24px", "32px"];

const RADII = [
  { label: "Small", token: "--ui-radius-sm" },
  { label: "Medium", token: "--ui-radius-md" },
  { label: "Large", token: "--ui-radius-lg" },
  { label: "Pill", token: "--ui-radius-pill" },
];

const CARD_SAMPLE = {
  title: "タイトルタイトルタイトルタイトル",
  channelName: "チャンネル名",
  thumbnail: "/image/thumbnail/thumbnail_1.png",
  startsAt: "2026-06-14T16:00:00+09:00",
  slotsLeft: 2,
  slotsTotal: 5,
  japaneseLevel: 3,
};

function SwatchTable({ groups }: { groups: SwatchGroup[] }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">{group.title}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <div key={item.token + item.hex} className="ui-card-subtle flex items-center gap-3 p-2.5">
                <span
                  className="h-11 w-11 shrink-0 rounded-[var(--ui-radius-sm)] ring-1 ring-black/5"
                  style={{ background: item.hex }}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold">{item.name}</span>
                    <span className="font-mono text-xs text-[var(--brand-text-muted)]">{item.hex}</span>
                  </span>
                  <span className="block truncate text-[11px] text-[var(--brand-text-muted)]">{item.token}</span>
                  <span className="block truncate text-[11px] text-[var(--brand-text-muted)]">{item.use}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ver0.2 の丸型コントロール（比較用に残しているだけ。新規利用は禁止） */
type LegacyCircleProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  offIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  slashedWhenOff?: boolean;
  on: boolean;
  onToggle: () => void;
};

function LegacyCircleControl({ icon: Icon, offIcon: OffIcon, slashedWhenOff, on, onToggle }: LegacyCircleProps) {
  const CurrentIcon = on ? Icon : (OffIcon ?? Icon);
  return (
    <button
      onClick={onToggle}
      aria-label="legacy control"
      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
        on ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)]"
      }`}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <CurrentIcon className="h-6 w-6" aria-hidden />
        {!on && slashedWhenOff && (
          <>
            <span className="pointer-events-none absolute h-7 w-[5px] -rotate-45 rounded-full bg-black" aria-hidden />
            <span className="pointer-events-none absolute h-7 w-[2px] -rotate-45 rounded-full bg-current" aria-hidden />
          </>
        )}
      </span>
    </button>
  );
}

function SectionNote({ lines }: { lines: string[] }) {
  return (
    <div className="mt-3 rounded-[var(--ui-radius-sm)] bg-[var(--brand-bg-900)] p-3 text-xs leading-6 text-[var(--brand-text-muted)]">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function LevelBadgeShowcase() {
  return (
    <div
      className="flex flex-wrap items-start gap-6 rounded-[var(--ui-radius-lg)] p-6"
      style={{ background: "var(--brand-primary-light)" }}
    >
      {AJL_LEVELS.map((level) => (
        <span
          key={level.level}
          className="grid h-11 w-11 place-items-center rounded-[8px] text-xl font-bold leading-none text-white"
          style={{
            background: level.color,
            boxShadow: `0 0 0 4px #FFFCF9, 0 4px 0 4px ${level.dropColor}`,
          }}
        >
          {level.level}
        </span>
      ))}
    </div>
  );
}

function FullscreenTransition({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    // demo は 入り→滞空→抜け でちょうど1周。抜けきってから畳む。
    const timer = window.setTimeout(onDone, 5600);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[95] overflow-hidden" onClick={onDone} role="presentation">
      <BrandTransition phase="demo" />
    </div>
  );
}

function TransitionShowcase() {
  const [replayKey, setReplayKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="h-[340px] overflow-hidden rounded-[var(--ui-radius-lg)]">
        <BrandTransition key={replayKey} inline phase="demo" />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setReplayKey((value) => value + 1)}>
          頭から再生
        </Button>
        <Button variant="primary" onClick={() => setFullscreen(true)}>
          全画面で確認
        </Button>
      </div>
      {fullscreen ? <FullscreenTransition onDone={() => setFullscreen(false)} /> : null}
    </>
  );
}

function CardShowcase() {
  const noop = () => {};
  return (
    <div className="flex flex-wrap gap-8">
      <div className="w-[280px] shrink-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">default</p>
        <StreamSessionCard {...CARD_SAMPLE} onOpen={noop} onOpenChannel={noop} />
      </div>
      <div className="card-hover-preview w-[280px] shrink-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">hover</p>
        <StreamSessionCard {...CARD_SAMPLE} onOpen={noop} onOpenChannel={noop} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ver0.3                                                                      */
/* -------------------------------------------------------------------------- */
function GuidelineV03() {
  const [segment, setSegment] = useState<"JP" | "EN">("JP");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOn, setChatOn] = useState(true);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5 lg:col-span-2">
        <h2 className="text-lg font-bold">Color Tokens</h2>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          ver0.3で実際に使っている色の全リスト。数値はモックからスポイトで取った値そのままで、目分量で動かさないこと。
        </p>
        <div className="mt-4">
          <SwatchTable groups={[...V03_PALETTE, V03_LEVEL_PALETTE]} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold">Button System</h2>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          仕組みは単純で、角丸の板 + 下に落とした影で厚みを作り、押すと影が消えて板が沈む。
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
              Pill — primary / secondary
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" size="md">
                Primary
              </Button>
              <Button variant="secondary" size="md">
                Secondary
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">All variants</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="soft">Soft</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
              Segmented（JP/EN などの切替）
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="ui-segment" role="group" aria-label="サンプル">
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
              <p className="text-[11px] text-[var(--brand-text-muted)]">
                実体は <span className="font-mono">LocaleSwitch</span>。溝の中で選択中のつまみだけが厚みを持つ
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">Split（本体＋▾）</p>
            <div className="ui-btn-group">
              <button type="button" className="ui-btn ui-btn-md ui-btn-primary">
                作成して開始
              </button>
              <button type="button" aria-label="モードを選択" className="ui-btn ui-btn-md ui-btn-primary px-3">
                ▾
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small / 34px</Button>
              <Button size="md">Medium / 42px</Button>
              <Button size="lg">Large / 52px</Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
              Pressed state（比較用に押しっぱなし表示）
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Button variant="primary">default</Button>
              <button type="button" className="ui-btn ui-btn-md ui-btn-primary" data-pressed="true">
                pressed
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">With icon</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">
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
              <button type="button" aria-label="Close" className="ui-btn ui-btn-md ui-btn-ghost ui-btn-square">
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <SectionNote
          lines={[
            "1. 厚み＝影。押下時は translateY で沈め、影を潰す",
            "2. Primaryは主要CTAのみ / Accentは終了・削除など破壊的操作のみ",
            "3. アイコンはボタン先頭、h-4 w-4 が基本（強調のみ h-5 w-5）",
            "4. 文言なしのアイコン単体ボタンは aria-label 必須",
          ]}
        />
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold">Live Controls</h2>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          liveページ（VTuber / リスナー共通）のマイク・カメラ・コメント・退出。こちらは影ではなく濃い同系色のフチで厚みを出す。
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="ui-ctl-group">
            <button
              type="button"
              onClick={() => setMicOn((value) => !value)}
              aria-pressed={micOn}
              aria-label="マイク"
              className={`ui-ctl ui-ctl-md ui-ctl-icon ${micOn ? "ui-ctl-primary" : "ui-ctl-neutral"}`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <MicrophoneIcon className="h-5 w-5" aria-hidden />
                {!micOn && (
                  <>
                    <span className="pointer-events-none absolute h-6 w-[5px] -rotate-45 rounded-full bg-[var(--ctl-face)]" aria-hidden />
                    <span className="pointer-events-none absolute h-6 w-[2px] -rotate-45 rounded-full bg-current" aria-hidden />
                  </>
                )}
              </span>
            </button>
            <button type="button" aria-label="マイク入力を選択" className="ui-ctl ui-ctl-md ui-ctl-neutral w-8 px-0">
              <ChevronUpIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="ui-ctl-group">
            <button
              type="button"
              onClick={() => setCamOn((value) => !value)}
              aria-pressed={camOn}
              aria-label="カメラ"
              className={`ui-ctl ui-ctl-md ui-ctl-icon ${camOn ? "ui-ctl-primary" : "ui-ctl-neutral"}`}
            >
              {camOn ? <VideoCameraIcon className="h-5 w-5" aria-hidden /> : <VideoCameraSlashIcon className="h-5 w-5" aria-hidden />}
            </button>
            <button type="button" aria-label="カメラ入力を選択" className="ui-ctl ui-ctl-md ui-ctl-neutral w-8 px-0">
              <ChevronUpIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setChatOn((value) => !value)}
            aria-pressed={chatOn}
            aria-label="コメント"
            className={`ui-ctl ui-ctl-md ui-ctl-icon ${chatOn ? "ui-ctl-primary" : "ui-ctl-neutral"}`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
          </button>

          <button type="button" className="ui-ctl ui-ctl-md ui-ctl-danger" aria-label="退出">
            <PhoneXMarkIcon className="h-5 w-5" aria-hidden />
          </button>

          <button type="button" className="ui-ctl ui-ctl-md ui-ctl-danger">
            <StopIcon className="h-4 w-4" aria-hidden />
            配信終了
          </button>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">Tile</p>
          <button type="button" className="ui-tile h-[132px] w-[132px]" aria-label="プロフィール">
            <UserIcon className="h-16 w-16" aria-hidden />
          </button>
        </div>

        <SectionNote
          lines={[
            "1. ON = Primary / OFF = Neutral。厚みの色は面の色とセットで決まる",
            "2. 分割ボタン（本体＋∧）はグループ単位で沈む",
            "3. 退出・配信終了は Accent 固定",
          ]}
        />
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold">Input System</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <FieldLabel>Text Input</FieldLabel>
            <TextInput className="mt-1" placeholder="タイトルを入力" />
          </label>
          <label className="block">
            <FieldLabel>Select</FieldLabel>
            <SelectField className="mt-1" defaultValue="english">
              <option value="chat">雑談</option>
              <option value="game">ゲーム</option>
              <option value="english">英語</option>
            </SelectField>
          </label>
          <label className="block">
            <FieldLabel>Textarea</FieldLabel>
            <TextArea className="mt-1" rows={4} placeholder="配信の概要を入力" />
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold">Layout Rules</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold">Spacing Scale</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPACING_SCALE.map((size) => (
                <span key={size} className="ui-card-subtle rounded-[var(--ui-radius-sm)] px-3 py-1 text-xs text-[var(--brand-text-muted)]">
                  {size}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Radius Tokens</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {RADII.map((radius) => (
                <div key={radius.token} className="ui-card-subtle p-3">
                  <div className="h-10 w-full bg-[var(--brand-primary)]/25" style={{ borderRadius: `var(${radius.token})` }} />
                  <p className="mt-2 text-xs font-semibold">{radius.label}</p>
                  <p className="text-[11px] text-[var(--brand-text-muted)]">{radius.token}</p>
                </div>
              ))}
            </div>
          </div>
          <SectionNote
            lines={["1. 余白は 8/12/16/24/32 に固定", "2. 角丸は sm / md / lg / pill の4段階", "3. 背景は #FFF9F4 一択。ダークモードは廃止"]}
          />
        </div>
      </Card>

      <section className="lg:col-span-2">
        <h2 className="text-lg font-bold">Page Transition</h2>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          ページ遷移のワイプ。紫の地に波と水玉を重ねた板が、右外から入り → しばらく滞空 → 左外へ抜けていく。
        </p>
        <div className="mt-4">
          <TransitionShowcase />
        </div>
        <h3 className="mt-8 text-base font-bold">読み込みバー（画面を覆わない方）</h3>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          一覧から詳細へ移るときなど、元の画面が見えていた方が親切な遷移で使う。画面下に出るだけで操作も邪魔しない。
        </p>
        <div className="mt-3 h-[120px] overflow-hidden rounded-[var(--ui-radius-lg)]">
          <BrandProgressBar inline />
        </div>

        <SectionNote
          lines={[
            "1. 入り 880ms / 滞空 / 抜け 590ms の3段。滞空はアニメを持たない状態なので待たせたいだけ待てる",
            "2. 地・帯・水玉を1枚ずつ時間差で流す。ふちが波なので入り抜きの境目も波形になる",
            "3. 地は左右のふちが波＋水玉のほつれ。静止位置では両ふちとも画面の外にあるのでべた塗りに見える",
            "4. 帯 = Primary Light / Primary Dark / Primary+白の淡いラベンダー、地 = Primary",
            "5. 水玉は帯がほどけたもの。ふち際は粒同士が重なってべた塗りになり、離れるほど分離して消える",
            "6. 粒は1周でちょうど1マス送られ、奥で消えてふち側から補充される（無限に流れて見える）",
            "7. ロゴはシンボルのみを白抜き（ロゴタイプは使わない）",
            "8. RouteTransitionProvider がリンククリックを見て出す。コード側の遷移は useRouteTransition().navigate() から出す",
            "9. 覆う wipe と、画面下だけの bar の2種類。bar は入り320ms / 抜け260msと短く、pointer-events も切ってある",
            "10. prefers-reduced-motion では動きを止め、静止画として見せる",
          ]}
        />
      </section>

      <section className="lg:col-span-2">
        <h2 className="text-lg font-bold">Stream Frame Style</h2>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          形はver0.2から変えず、色だけ差し替え。白フチ＋ドロップシャドウでボタン類と同じ質感に揃えている。
        </p>
        <div className="mt-4">
          <CardShowcase />
        </div>

        <h3 className="mt-8 text-base font-bold">難易度バッジ（AJL 1-6）</h3>
        <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
          カード左上のバッジ。ボタンと同じ作りで、白フチの下に同系色の厚みを1枚敷いている。背景はカード上部バーの色。
        </p>
        <div className="mt-3">
          <LevelBadgeShowcase />
        </div>

        <SectionNote
          lines={[
            "1. 上部バー = Primary Light、進捗の実線と detail タブ = Primary Dark",
            "2. レベルバッジはAJL 1-6で色が変わる（数字は常に白、フチは Card Ring）",
            "3. 進捗の溝 = Track、アバター未設定 = Placeholder",
            "4. カードは bg の上に直接置く（別の灰色パネルの上に載せない）",
          ]}
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ver0.2（アーカイブ）                                                         */
/* -------------------------------------------------------------------------- */
function GuidelineV02() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className="ui-v02 rounded-[var(--ui-radius-lg)] p-5">
      <p className="mb-4 rounded-[var(--ui-radius-sm)] bg-[var(--brand-accent)]/15 px-3 py-2 text-xs font-bold text-[var(--brand-accent)]">
        アーカイブ表示です。ver0.2はダーク基調・フラットボタンで、現在の実装では使われていません。
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">Color Tokens</h2>
          <div className="mt-4">
            <SwatchTable groups={V02_PALETTE} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold">Button System</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
          </div>
          <SectionNote lines={["フラット（厚み・押下沈み込みなし）", "角丸は --ui-radius-sm 固定"]} />
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold">Live Controls</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-[var(--brand-surface)]">
              <LegacyCircleControl icon={MicrophoneIcon} slashedWhenOff on={micOn} onToggle={() => setMicOn((v) => !v)} />
              <button type="button" aria-label="Mic device menu" className="flex h-12 w-8 items-center justify-center border-l border-black/20 text-[var(--brand-text-muted)]">
                <ChevronUpIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="inline-flex items-center rounded-full bg-[var(--brand-surface)]">
              <LegacyCircleControl
                icon={VideoCameraIcon}
                offIcon={VideoCameraSlashIcon}
                on={camOn}
                onToggle={() => setCamOn((v) => !v)}
              />
              <button type="button" aria-label="Cam device menu" className="flex h-12 w-8 items-center justify-center border-l border-black/20 text-[var(--brand-text-muted)]">
                <ChevronUpIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--brand-accent)] px-4 text-sm font-semibold text-white"
            >
              <PhoneXMarkIcon className="h-5 w-5" aria-hidden />
              退出
            </button>
          </div>
          <SectionNote lines={["丸型（h-12 w-12）＋左ボーダーで分割", "OFFは透明背景＋muted文字色"]} />
        </Card>

        <section className="lg:col-span-2">
          <h2 className="text-lg font-bold">Stream Frame Style</h2>
          <div className="mt-4">
            <CardShowcase />
          </div>
          <SectionNote lines={["上部バーとフチは Surface（#494746）", "レベルバッジは Secondary（#00E5FF）", "白フチ・ドロップシャドウなし"]} />
        </section>
      </div>
    </div>
  );
}

export default function DesignGuidelinePage() {
  const version = useSyncExternalStore(subscribeToHash, readVersionFromHash, serverVersion);

  const selectVersion = (next: UiVersion) => {
    // assign() so the hashchange fires and useSyncExternalStore re-reads.
    window.location.assign(`#ver${next}`);
  };

  return (
    <div className="min-h-screen bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <TopNav />

      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">Developer Page</p>
          <h1 className="mt-2 text-3xl font-bold">Design Guideline</h1>
          <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
            カラー・ボタン・フォーム・配信枠の見た目を一括確認するページ。バージョンごとにタブで切り替えられる。
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-[var(--ui-radius-pill)] bg-[var(--brand-surface)] p-1 shadow-[var(--ui-shadow-1)]">
            {(["0.3", "0.2"] as UiVersion[]).map((item) => {
              const isActive = item === version;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectVersion(item)}
                  aria-pressed={isActive}
                  className={`rounded-[var(--ui-radius-pill)] px-4 py-1.5 text-sm font-bold transition-colors ${
                    isActive ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                  }`}
                >
                  {`ver${item}`}
                  {item === "0.3" ? <span className="ml-1.5 text-[10px] font-bold opacity-80">current</span> : null}
                </button>
              );
            })}
          </div>
        </header>

        {version === "0.3" ? <GuidelineV03 /> : <GuidelineV02 />}
      </main>
    </div>
  );
}
