import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  PlayIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/outline";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";

import { WaveEdge } from "../components/landing/WaveEdge";
import {
  BODY,
  FaqItem,
  Lines,
  Section,
  SectionTitle,
  SoonButton,
  X_HANDLE,
  X_URL,
  XMark,
} from "../components/landing/primitives";
import { AJL_LEVELS } from "../lib/ajl";
import { LevelHelpButton, LevelHelpPanel } from "../components/landing/LevelHelp";
import { SceneFind, SceneReserve, SceneTalk } from "./LearnerScenes";

/**
 * 日本語学習者向けのランディングページ。
 *
 * /for-vtubers と同じ骨格（課題 → 解決 → 証拠 → 手順 → 役割 → 条件 → 安心 →
 * FAQ → CTA）で、同じ部品（landing-* と .ui-btn）で組んである。VTuber向けと
 * 学習者向けが同じ世界を語るように、事実はすべてサイト内に既にある記述
 * （/for-vtubers の本文、参加ページの文言、ajl.ts のレベル定義）から取っている。
 *
 * 主導線は「配信枠を探す」（ホーム）。スピーカーになる操作は枠の中で行うので、
 * 「Become a speaker」は登録ページではなく手順の説明へ送る。
 */

export const metadata: Metadata = {
  title: "aiment — Talk with Japanese VTubers, live",
  description:
    "aiment is where Japanese learners talk with Japanese VTubers live, through games and casual conversation. Pick a session by level, reserve a speaker slot, and say hello.",
  openGraph: {
    title: "aiment — Talk with Japanese VTubers, live",
    description:
      "Talk with Japanese VTubers live, through games and casual conversation. Pick a session by level, reserve a speaker slot, and say hello.",
  },
};

const edited = (name: string) => `/lp/edited/${name}`;
const cell = (name: string) => `/lp/cells/${name}.png`;

const HERO_LEAD = [
  "Talk with Japanese VTubers live, through games",
  "and casual conversation. No textbooks, no scripts.",
  "Just time spent using Japanese with someone you like.",
];

const WHAT_IS = {
  statement: ["Talking with a VTuber becomes", "your time to use Japanese."],
  paragraphs: [
    [
      "Studying Japanese rarely gives you a chance to actually talk with Japanese people.",
      "At the same time, many fans around the world got into Japanese",
      "through VTubers, games and anime.",
    ],
    [
      "aiment connects those learners with Japanese VTubers —",
      "not for “conversation drills”,",
      "but for time spent enjoying Japanese with someone you like.",
    ],
  ],
};

const SESSION_VIDEO_NOTE = [
  "Besides the VTuber and the listeners, aiment has a role called “speaker”.",
  "Speakers join with their camera off and mic on, and talk with the VTuber directly.",
  "On average, about 5 speakers join each session.",
];

const STEPS = [
  {
    no: "01",
    title: "Find a session",
    body: [
      <>
        Sessions are listed by Japanese level
        <LevelHelpButton id="level-help-steps" lang="en" />, theme and start time.
      </>,
      "Times are shown in your local time. Pick one that fits you.",
    ],
    Scene: SceneFind,
  },
  {
    no: "02",
    title: "Reserve a speaker slot",
    body: [
      "Reserving is free. The participation fee is paid",
      "within 24 hours before the stream.",
      "If you have a participation ticket, you can use it instead.",
    ],
    Scene: SceneReserve,
  },
  {
    no: "03",
    title: "Say hello and talk",
    body: ["It starts with a short self-introduction.", "After that it’s games and chat with the VTuber, in Japanese."],
    Scene: SceneTalk,
  },
];

const ROLES = [
  {
    icon: SpeakerWaveIcon,
    label: "Listener",
    lead: "Watch the stream and follow along.",
    image: edited("listener_image.png"),
    points: [
      { icon: PlayIcon, text: "Watch the live stream" },
      { icon: ChatBubbleLeftRightIcon, text: "Follow the conversation in live chat" },
    ],
  },
  {
    icon: MicrophoneIcon,
    label: "Speaker",
    lead: "Join by voice and talk with the VTuber.",
    image: edited("speaker_image.png"),
    points: [
      { icon: VideoCameraSlashIcon, text: "Camera off, mic on" },
      { icon: MicrophoneIcon, text: "Talk with the VTuber directly" },
      { icon: UserGroupIcon, text: "Limited spots — about 5 per session" },
    ],
  },
];

const GUIDELINES = ["Guidelines on harassment", "Streaming guidelines", "Archive publication guidelines"];

/**
 * 答えはすべてサイト内に既にある記述から引いている（新しい約束はしていない）。
 * 出典: /for-vtubers の本文とFAQ、参加ページ（/join）の文言。
 */
const FAQ = [
  {
    q: "Do I need to show my face?",
    a: "No. Speakers join with their camera off and mic on. Only your voice is part of the session.",
  },
  {
    q: "My Japanese is still basic. Can I join?",
    a: "Every session shows a Japanese level, so you can pick one that matches you. VTubers are asked to speak a little more slowly for beginners.",
  },
  {
    q: "Is it free?",
    a: "Reserving a speaker slot is free. A participation fee is paid within 24 hours before the stream. If you have a participation ticket, you can use it instead of paying.",
  },
  {
    q: "What happens in a session?",
    a: "It starts with a short self-introduction between you and the VTuber. After that, it’s games, chat or a themed talk — the VTuber’s usual style, with you in the conversation.",
  },
  {
    q: "How many people are in a session?",
    a: "On average about 5 speakers join each session, so there is room for you to actually talk.",
  },
  {
    q: "What if something goes wrong?",
    a: "Participants follow a set of rules, and the aiment team is building a system to step in when there is a problem. The terms of service and privacy policy are available now; participant guidelines are being prepared.",
  },
];

/** 吹き出し。ヒーローのキャラクターのまわりに置く。 */
function Bubble({ children, className = "", style }: { children: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`lp-bubble ${className}`.trim()} style={style} aria-hidden>
      {children}
    </span>
  );
}

function HeroCtas({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-stretch gap-4 ${className}`.trim()}>
      <Link href="/" className="landing-cta ui-btn ui-btn-lg">
        Find a session
      </Link>
      <a href="#how-it-works" className="landing-cta landing-cta--ghost ui-btn ui-btn-lg">
        How to join as a speaker
      </a>
      <p className="mt-1 text-center text-[14px] font-bold leading-[1.9] text-white/90">
        Speakers join by voice — camera off, mic on.
        <br />
        Reserving a speaker slot is free.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page lp-page min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      {/* ================= Hero ================= */}
      <section className="bg-[var(--brand-primary)] pb-[clamp(56px,7vw,96px)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">
          <div className="flex items-center justify-between pt-7">
            <Link href="/" className="inline-flex items-center" aria-label="aiment home">
              <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} priority className="h-9 w-auto" />
            </Link>
            <Link href="/for-vtubers" className="text-[13px] font-bold text-white/85 underline-offset-4 hover:underline">
              For VTubers
            </Link>
          </div>

          <div className="mt-[clamp(40px,6vw,88px)] grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
            <div>
              <p className="flex flex-wrap items-center gap-3 text-sm font-bold tracking-[0.2em] text-white/85">
                FOR JAPANESE LEARNERS
                <span className="landing-badge">EARLY ACCESS</span>
              </p>
              <h1 className="lp-beyond mt-4">
                bey
                <ChatBubbleOvalLeftIcon className="lp-beyond__o" aria-hidden />
                nd
                <br />
                chat.
              </h1>
              <p className="mt-6 text-[clamp(20px,calc(12px_+_1.2vw),28px)] font-extrabold leading-[1.4]">
                Go beyond just being a fan.
              </p>
              <Lines lines={HERO_LEAD} className={`mt-[clamp(20px,2.5vw,36px)] ${BODY}`} />

              <HeroCtas className="mt-[clamp(28px,3.5vw,48px)] w-full max-w-[320px] sm:max-w-[400px]" />
            </div>

            <div className="lp-hero-art" aria-hidden>
              <span className="lp-hero-art__disc">
                <Image src={edited("aiment_LPchara_v2.PNG")} alt="" width={604} height={881} priority />
              </span>
              <Bubble className="lp-bubble--tl">I love your stream!</Bubble>
              <Bubble className="lp-bubble--ml lp-bubble--tint">Can you say “ありがとう”?</Bubble>
              <Bubble className="lp-bubble--r">You noticed me! 😭</Bubble>
              <Bubble className="lp-bubble--bl lp-bubble--ink">Nice to meet you!</Bubble>
              <span className="lp-hero-art__row">
                {["cell_32", "cell_33", "cell_35"].map((name) => (
                  <Image key={name} src={cell(name)} alt="" width={52} height={52} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </section>

      <WaveEdge />

      {/* ================= What is aiment? ================= */}
      <Section className="pt-[calc(var(--ld-section-y)*0.5)]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div>
            <SectionTitle align="left">What is aiment?</SectionTitle>
            <Lines
              lines={WHAT_IS.statement}
              alwaysBreak
              className="mt-[var(--ld-head-gap)] text-[clamp(21px,calc(12px_+_1.5vw),34px)] font-extrabold leading-[1.5]"
            />
            <div className="mt-[var(--ld-head-gap)] space-y-[var(--ld-item-gap)]">
              {WHAT_IS.paragraphs.map((lines) => (
                <Lines key={lines[0]} lines={lines} className={BODY} />
              ))}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src={edited("concept.png")}
              alt="A fan and a VTuber talking"
              width={1457}
              height={1079}
              className="w-full max-w-[460px]"
            />
          </div>
        </div>
      </Section>

      {/* ================= Real session footage ================= */}
      <Section>
        <SectionTitle>What a session looks like</SectionTitle>
        <div className="landing-video mt-[var(--ld-head-gap)]" role="img" aria-label="Session footage (coming soon)">
          <PlayIcon aria-hidden />
          <span className="landing-soon">Coming soon</span>
        </div>
        <Lines
          lines={SESSION_VIDEO_NOTE}
          className={`mx-auto mt-[var(--ld-head-gap)] max-w-[880px] text-left sm:text-center ${BODY}`}
        />
      </Section>

      {/* ================= 3 steps ================= */}
      <section id="how-it-works" className="scroll-mt-6">
        <Section>
          <SectionTitle>3 steps to your first conversation</SectionTitle>
          <LevelHelpPanel id="level-help-steps" lang="en" />
          <div className="mt-[var(--ld-head-gap)] grid gap-[clamp(40px,6vw,80px)]">
            {STEPS.map((step) => (
              <div key={step.no} className="grid items-center gap-10 lg:grid-cols-2">
                <div>
                  <h3 className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                    <span className="text-[clamp(46px,6vw,86px)] font-medium leading-none tracking-tight">{step.no}</span>
                    <span className="text-[clamp(24px,calc(14px_+_1.7vw),38px)] font-extrabold leading-tight">{step.title}</span>
                  </h3>
                  <Lines lines={step.body} className={`mt-[var(--ld-head-gap)] ${BODY}`} />
                </div>
                <div className="flex justify-center lg:justify-end">
                  <step.Scene />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* ================= Listener / Speaker ================= */}
      <Section>
        <SectionTitle>Listener or speaker</SectionTitle>
        <div className="mx-auto mt-[var(--ld-head-gap)] grid max-w-[960px] gap-5 sm:grid-cols-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.label} className="landing-panel lp-role">
                <div className="lp-role__head">
                  <Icon aria-hidden />
                  <span>{role.label}</span>
                </div>
                <Image src={role.image} alt="" width={604} height={881} className="lp-role__art" />
                <h3>{role.lead}</h3>
                <ul>
                  {role.points.map((point) => {
                    const PointIcon = point.icon;
                    return (
                      <li key={point.text}>
                        <PointIcon className="text-[var(--brand-primary)]" aria-hidden />
                        <span>{point.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ================= Japanese level ================= */}
      <Section>
        <SectionTitle>Every session shows a Japanese level</SectionTitle>
        <p className={`mx-auto mt-[var(--ld-head-gap)] max-w-[760px] text-left sm:text-center ${BODY}`}>
          The badge on each session card tells you who it is for (A1–C2 follows the JF Standard for Japanese-Language
          Education). VTubers are asked to speak a little more slowly for beginners.
        </p>
        <ul className="lp-levels mt-[var(--ld-head-gap)]">
          {AJL_LEVELS.map((level) => (
            <li key={level.level}>
              <span
                className="lp-levels__badge"
                style={{ "--level-face": level.color, "--level-drop": level.dropColor } as CSSProperties}
              >
                {level.level}
              </span>
              <span className="lp-levels__label">
                {level.label}
                <span className="lp-levels__band">{level.jfStandard}</span>
              </span>
              <span className="lp-levels__desc">{level.description}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ================= Safety ================= */}
      <Section>
        <SectionTitle>So you can join with peace of mind</SectionTitle>
        <p className={`mx-auto mt-[var(--ld-head-gap)] max-w-[760px] text-left sm:text-center ${BODY}`}>
          Participants follow a set of rules, and the aiment team is building a system to step in when there is a
          problem.
        </p>
        <div className="landing-shelf mt-[var(--ld-head-gap)]">
          <Link href="/terms" className="ui-btn ui-btn-md ui-btn-secondary w-full max-w-[320px] sm:w-auto">
            Terms of service
          </Link>
          <Link href="/privacy" className="ui-btn ui-btn-md ui-btn-secondary w-full max-w-[320px] sm:w-auto">
            Privacy policy
          </Link>
          {GUIDELINES.map((label) => (
            <SoonButton key={label} label="Coming soon" className="ui-btn-md ui-btn-ghost w-full max-w-[320px] sm:w-auto">
              {label}
            </SoonButton>
          ))}
        </div>
      </Section>

      {/* ================= FAQ ================= */}
      <Section>
        <SectionTitle align="left">FAQ</SectionTitle>
        <div className="mt-[var(--ld-head-gap)] space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </Section>

      <WaveEdge flip />

      {/* ================= Closing CTA ================= */}
      <section className="bg-[var(--brand-primary)] text-white">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-[clamp(64px,8vw,120px)] pt-[clamp(16px,3vw,40px)] text-center lg:px-10">
          <span className="landing-badge">EARLY ACCESS</span>
          <h2 className="mt-6 text-[clamp(22px,2.8vw,38px)] font-extrabold leading-[1.5]">
            Your first conversation is one reservation away.
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[clamp(13px,1.15vw,16px)] font-bold leading-[2] text-white/90">
            Find a session that matches your level, reserve a speaker slot, and say hello.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <Link href="/" className="landing-cta ui-btn ui-btn-lg w-full max-w-[320px]">
              Find a session
            </Link>
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-white/90 underline-offset-4 hover:underline"
            >
              <XMark className="h-[14px] w-[14px]" />
              Follow {X_HANDLE} for updates
            </a>
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="bg-[var(--brand-primary-dark)] text-white [--brand-logo-filter:brightness(0)_invert(1)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:justify-between lg:px-10">
          <Image src="/logo/aiment_logotype.svg" alt="aiment" width={600} height={200} className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-bold text-white/85" aria-label="Footer">
            <Link href="/for-vtubers" className="hover:underline">
              For VTubers
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
              <XMark className="h-[13px] w-[13px]" />
              {X_HANDLE}
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
