"use client";

import { type ComponentType, type FormEvent, type SVGProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  LanguageIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, MicrophoneIcon } from "@heroicons/react/24/solid";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatSessionStartTime, getAjlInfo } from "../../lib/ajl";
import { useI18n } from "../../lib/i18n";
import { participationLabel } from "../../lib/labels";
import { getStreamSession } from "../../lib/streamSessions";
import { useUserSession } from "../../lib/userSession";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type AuthStatus = "loading" | "guest" | "logged-in";
type ReservationStatus = "loading" | "none" | "reserving" | "reserved" | "paid" | "error";

type SessionMeta = {
  id: string;
  vtuber: string;
  title: string;
  description: string;
  duration: string;
  startsAt: string;
  japaneseLevel?: number;
  speakerSlotsLeft: number;
  speakerSlotsTotal: number;
  participationType: string;
  thumbnail: string;
};

// ── Stripe payment form (inline) ──────────────────────────────────────────────
function PaymentForm({
  sessionId,
  amountPhp,
  onSuccess,
  onCancel,
}: {
  sessionId: string;
  amountPhp: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "決済に失敗しました。");
      setLoading(false);
      return;
    }

    if (!paymentIntent?.id) {
      setError("決済情報が取得できませんでした。");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations/confirm-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "支払い確定に失敗しました。");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch {
      setError("支払い確定に失敗しました。");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-[var(--brand-primary)] py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "処理中..." : `₱${amountPhp} を支払う`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="w-full rounded-xl bg-[var(--brand-surface)] py-2.5 text-sm text-[var(--brand-text-muted)] disabled:opacity-60"
      >
        キャンセル
      </button>
    </form>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  help,
  tone = "surface",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  help?: string;
  tone?: "surface" | "accent";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${
        tone === "accent"
          ? "border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/14"
          : "border-white/8 bg-[var(--brand-bg-800)]/82"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          tone === "accent" ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--brand-surface)] text-[var(--brand-secondary)]"
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-text-muted)]">
          <span>{label}</span>
          {help ? <HelpTooltip label={label} body={help} /> : null}
        </p>
        <p className="truncate text-sm font-extrabold text-[var(--brand-text)]">{value}</p>
      </div>
    </div>
  );
}

function HelpTooltip({ label, body }: { label: string; body: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${label} help`}
        className="grid h-4 w-4 place-items-center rounded-full bg-white/10 text-[var(--brand-text-muted)] transition-colors hover:bg-[var(--brand-primary)] hover:text-white focus:bg-[var(--brand-primary)] focus:text-white focus:outline-none"
      >
        <QuestionMarkCircleIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-30 hidden w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[var(--brand-surface)] px-3 py-2 text-left text-xs font-medium leading-5 text-[var(--brand-text)] shadow-xl shadow-black/35 group-hover:block group-focus-within:block">
        {body}
      </span>
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function JoinPageClient() {
  const router = useRouter();
  const { tx } = useI18n();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "";
  const [dynamicSession, setDynamicSession] = useState<Awaited<ReturnType<typeof getStreamSession>>>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>("loading");
  const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<"watch" | "speaker" | null>(null);

  // Payment flow
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountPhp, setAmountPhp] = useState(200);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { isAuthenticated, hydrated, user } = useUserSession();
  const authStatus: AuthStatus = !hydrated ? "loading" : isAuthenticated ? "logged-in" : "guest";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSessionLoading(true);
      const found = await getStreamSession(sessionId);
      if (!cancelled) {
        setDynamicSession(found);
        setSessionLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [sessionId]);

  const checkReservation = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        `/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          hasSpeakerReservation?: boolean;
          hasPaidSpeakerReservation?: boolean;
          paymentWindowOpen?: boolean;
        };
        setPaymentWindowOpen(data.paymentWindowOpen ?? false);
        if (data.hasPaidSpeakerReservation) {
          setReservationStatus("paid");
        } else if (data.hasSpeakerReservation) {
          setReservationStatus("reserved");
        } else {
          setReservationStatus("none");
        }
      } else {
        setReservationStatus("none");
      }
    } catch {
      setReservationStatus("error");
    }
  }, [sessionId]);

  useEffect(() => {
    if (authStatus === "logged-in") void checkReservation();
    else if (authStatus === "guest") setReservationStatus("none");
  }, [authStatus, checkReservation]);

  // Reserve (free) and optionally open payment
  const handleReserve = async () => {
    setReservationStatus("reserving");
    setPaymentError(null);

    try {
      const res = await fetch(
        `/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "speaker" }),
        },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        if (!data.error?.includes("already have")) {
          setReservationStatus("none");
          setPaymentError(data.error ?? "予約の作成に失敗しました。");
          return;
        }
      }
      // Re-check status (also updates paymentWindowOpen)
      await checkReservation();
    } catch {
      setReservationStatus("none");
      setPaymentError("予約の作成に失敗しました。");
    }
  };

  // Initialize Stripe PaymentIntent
  const handleStartPayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/billing/speaker-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as {
        clientSecret?: string;
        amountPhp?: number;
        error?: string;
      };
      if (!res.ok || !data.clientSecret) {
        setPaymentError(data.error ?? "決済の準備に失敗しました。");
        setPaymentLoading(false);
        return;
      }
      setClientSecret(data.clientSecret);
      if (data.amountPhp) setAmountPhp(data.amountPhp);
    } catch {
      setPaymentError("決済の準備に失敗しました。");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setReservationStatus("paid");
  };

  // Mic setup
  const streamRef = useRef<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [showMicMenu, setShowMicMenu] = useState(false);

  useEffect(() => {
    if (!(authStatus === "logged-in" && reservationStatus === "paid" && selectedPath === "speaker")) {
      setReady(false);
      setMicLevel(0);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }

    let mounted = true;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let meterTimer: number | null = null;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true,
          video: false,
        });
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audios = devices.filter((d) => d.kind === "audioinput");
        if (mounted) {
          setAudioDevices(audios);
          if (!selectedAudioDeviceId && audios.length > 0) setSelectedAudioDeviceId(audios[0].deviceId);
        }

        meterTimer = window.setInterval(() => {
          if (!analyser) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((s, v) => s + v, 0) / data.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }, 120);

        setReady(true);
        setErrorMessage(null);
      } catch {
        setErrorMessage(tx("マイクの利用が許可されていません。ブラウザ設定を確認してください。", "Microphone access is not allowed. Please check your browser settings."));
        setReady(false);
      }
    };

    void setup();
    return () => {
      mounted = false;
      if (meterTimer) window.clearInterval(meterTimer);
      source?.disconnect();
      analyser?.disconnect();
      audioContext?.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [authStatus, reservationStatus, selectedAudioDeviceId, selectedPath, tx]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = micOn; });
  }, [micOn]);

  const applyMic = (enabled: boolean) => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    setMicOn(enabled);
  };

  const joinNow = () => {
    const roomId = encodeURIComponent(session.id);
    const query = new URLSearchParams({
      role: "speaker",
      mic: micOn ? "1" : "0",
      ...(selectedAudioDeviceId ? { micDeviceId: selectedAudioDeviceId } : {}),
    }).toString();
    router.push(`/room/${roomId}?${query}`);
  };

  const watchNow = () => {
    router.push(`/room/${encodeURIComponent(session.id)}?role=listener`);
  };

  const session = useMemo<SessionMeta>(() => {
    if (dynamicSession) {
      return {
        id: dynamicSession.sessionId,
        vtuber: dynamicSession.hostName,
        title: dynamicSession.title,
        description: dynamicSession.description,
        duration:
          dynamicSession.status === "live"
            ? tx("配信中", "Live now")
            : tx(`約${dynamicSession.plannedDurationMin ?? 60}分`, `About ${dynamicSession.plannedDurationMin ?? 60} min`),
        startsAt: dynamicSession.startsAt,
        japaneseLevel: dynamicSession.japaneseLevel,
        speakerSlotsLeft: dynamicSession.speakerSlotsLeft,
        speakerSlotsTotal: dynamicSession.speakerSlotsTotal,
        participationType: participationLabel(dynamicSession.participationType, tx),
        thumbnail: dynamicSession.thumbnail,
      };
    }
    return {
      id: sessionId || "unknown",
      vtuber: tx("読み込み中", "Loading"),
      title: tx("配信枠を読み込んでいます", "Loading session"),
      description: "",
      duration: "",
      startsAt: "",
      speakerSlotsLeft: 0,
      speakerSlotsTotal: 0,
      participationType: participationLabel("First-come", tx),
      thumbnail: "",
    };
  }, [dynamicSession, sessionId, tx]);

  const ajl = getAjlInfo(session.japaneseLevel);

  if (!sessionLoading && !dynamicSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
        <p className="text-lg font-semibold">{tx("配信枠が見つかりません", "Session not found")}</p>
        <p className="text-sm text-[var(--brand-text-muted)]">{tx("この枠はすでに終了しているか、存在しません。", "This session has ended or does not exist.")}</p>
        <button onClick={() => router.push("/")} className="rounded-xl bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-bold text-white">
          {tx("ホームに戻る", "Back to Home")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <header className="bg-[var(--brand-bg-900)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-5 lg:px-12">
          <button onClick={() => router.push("/")} className="flex items-center">
            <Image src="/logo/aiment_logotype.svg" alt="aiment" width={150} height={50} className="h-10 w-auto object-contain brightness-0 invert" />
          </button>
          <p className="text-sm text-[var(--brand-text-muted)]">{tx("視聴・参加の案内", "Viewing & participation")}</p>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-5 px-4 pb-8 pt-3 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <section className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[var(--brand-bg-800)] shadow-2xl shadow-black/30">
            <div className="relative min-h-[520px] lg:min-h-[620px]" style={{ aspectRatio: "16/9" }}>
              {session.thumbnail ? (
                <img src={session.thumbnail} alt={session.vtuber} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(124,106,230,0.35),transparent_32%),var(--brand-surface)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-bg-900)] via-[var(--brand-bg-900)]/42 to-[var(--brand-bg-900)]/10" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-black/62 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">{tx("共有用レッスンページ", "Shareable lesson page")}</span>
                <span className="rounded-full bg-[var(--brand-secondary)] px-3 py-1.5 text-xs font-black text-black">AJL {ajl.level}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-8">
                <div className="max-w-4xl">
                  <p className="mb-3 text-sm font-bold text-[var(--brand-secondary)]">{tx(`${session.vtuber} のライブレッスン`, `${session.vtuber}'s live lesson`)}</p>
                  <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{session.title}</h1>
                  {session.description ? (
                    <p className="mt-4 max-w-3xl text-base leading-8 text-white/82 sm:text-lg">{session.description}</p>
                  ) : null}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoPill
                      icon={CalendarDaysIcon}
                      label={tx("開始", "Starts")}
                      value={session.startsAt ? formatSessionStartTime(session.startsAt) : tx("未定", "TBD")}
                      help={tx("レッスンの開始予定時刻です。時間は端末の表示設定に合わせて表示されます。", "Scheduled lesson start time. It follows your device display settings.")}
                    />
                    <InfoPill
                      icon={ClockIcon}
                      label={tx("時間", "Duration")}
                      value={session.duration || "-"}
                      help={tx("配信枠の予定時間です。進行により前後する場合があります。", "Planned session length. The actual ending time may vary.")}
                    />
                    <InfoPill
                      icon={LanguageIcon}
                      label={tx("目安レベル", "Level")}
                      value={`AJL ${ajl.level} / JF ${ajl.jfStandard}`}
                      help={tx(
                        `AJLはaiment Japanese Levelの略です。この枠はAJL ${ajl.level}（${ajl.label}）で、${ajl.description} が目安です。`,
                        `AJL means aiment Japanese Level. This session is AJL ${ajl.level} (${ajl.label}); recommended ability: ${ajl.description}.`,
                      )}
                      tone="accent"
                    />
                    <InfoPill
                      icon={UserGroupIcon}
                      label={tx("スピーカー枠", "Speaker spots")}
                      value={`${session.speakerSlotsLeft}/${session.speakerSlotsTotal}`}
                      help={tx("声で会話に参加できるスピーカー枠の残数です。視聴だけの場合はこの枠を使いません。", "Remaining speaker slots for people joining by voice. Watching does not use these slots.")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-[var(--brand-bg-800)] px-4 py-3 shadow-lg shadow-black/12">
            <p className="text-sm font-bold text-[var(--brand-text)]">{tx("aimentライブレッスン", "aiment live lesson")}</p>
            <HelpTooltip
              label={tx("aimentとは", "What is aiment?")}
              body={tx(
                "aimentは、配信を見ながら日本語で会話に参加できるライブレッスンです。視聴だけでも、スピーカーとして声で参加しても大丈夫です。",
                "aiment is a live lesson where you can watch a stream and join the conversation in Japanese. You can watch quietly or join by voice as a speaker.",
              )}
            />
            <span className="text-sm text-[var(--brand-text-muted)]">
              {tx("見るだけでも、話して参加してもOK。", "Watch quietly, or join the conversation.")}
            </span>
          </section>

          <section className="rounded-2xl border border-white/8 bg-[var(--brand-bg-800)] p-5 shadow-lg shadow-black/12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-text-muted)]">{tx("Join Guide", "Join Guide")}</p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-[var(--brand-text)]">
                  <span>{tx("参加方法を選ぶ", "Choose how to join")}</span>
                  <HelpTooltip
                    label={tx("参加方法", "Join options")}
                    body={tx(
                      "視聴はログイン不要です。スピーカー参加はログイン、枠予約、支払い、マイク確認が必要です。",
                      "Watching does not require login. Speaker participation requires login, a slot reservation, payment, and a microphone check.",
                    )}
                  />
                </h2>
              </div>
              <span className="rounded-full bg-[var(--brand-surface)] px-3 py-1 text-xs font-bold text-[var(--brand-text-muted)]">
                {session.participationType}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={watchNow}
                className="group rounded-2xl border border-white/8 bg-[var(--brand-bg-900)] p-5 text-left transition-colors hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-black text-[var(--brand-text)]">{tx("視聴する", "Watch")}</p>
                  <ArrowRightIcon className="h-5 w-5 text-[var(--brand-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]" aria-hidden />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--brand-text-muted)]">
                  {tx(
                    "ログイン不要。まず雰囲気を見る人向けです。",
                    "No login needed. Good for checking the vibe first.",
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPath("speaker")}
                className={`group rounded-2xl border p-5 text-left transition-colors ${
                  selectedPath === "speaker"
                    ? "border-[var(--brand-primary)]/55 bg-[var(--brand-primary)]/15"
                    : "border-white/8 bg-[var(--brand-bg-900)] hover:border-[var(--brand-primary)]/45 hover:bg-[var(--brand-primary)]/10"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-black text-[var(--brand-text)]">{tx("スピーカーとして参加", "Join as speaker")}</p>
                  <ArrowRightIcon className="h-5 w-5 text-[var(--brand-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]" aria-hidden />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--brand-text-muted)]">
                  {tx(
                    "ログインして枠を予約。会話に参加する人向けです。",
                    "Log in and reserve a slot. Best if you want to speak.",
                  )}
                </p>
              </button>
            </div>
          </section>
        </section>

        <aside className="self-start rounded-2xl border border-white/8 bg-[var(--brand-bg-800)] p-5 shadow-xl shadow-black/20 lg:sticky lg:top-5">
          <div className="rounded-2xl bg-[var(--brand-bg-900)] p-4">
            <p className="text-base font-black text-[var(--brand-text)]">{tx("参加の準備", "Get ready to join")}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--brand-text-muted)]">
              {tx("見るだけならすぐ入れます。話す場合はスピーカー枠の申し込みへ進んでください。", "You can watch right away. To speak, continue to the speaker application flow.")}
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={watchNow}
                className="w-full rounded-xl bg-[var(--brand-secondary)] px-4 py-3 text-sm font-extrabold text-black transition-transform hover:-translate-y-0.5"
              >
                {tx("視聴で入る", "Enter as viewer")}
              </button>
              <button
                onClick={() => setSelectedPath("speaker")}
                className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  selectedPath === "speaker"
                    ? "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]"
                    : "bg-[var(--brand-surface)] text-[var(--brand-text)]"
                }`}
              >
                {tx("スピーカー参加を進める", "Continue as speaker")}
              </button>
            </div>
          </div>

          {selectedPath !== "speaker" && (
            <div className="mt-4 rounded-2xl bg-[var(--brand-bg-900)] p-4">
              <p className="text-sm font-bold text-[var(--brand-text)]">{tx("初めての方へ", "For first-time visitors")}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--brand-text-muted)]">
                {tx(
                  "共有リンクから来た場合は、まず日時とAJLを確認してください。迷ったら視聴で入って、雰囲気を見てから次回スピーカー参加でも大丈夫です。",
                  "If you arrived from a shared link, first check the time and AJL level. If unsure, start as a viewer and join as a speaker another time.",
                )}
              </p>
            </div>
          )}

          {selectedPath === "speaker" && (authStatus === "loading" || reservationStatus === "loading") && (
            <div className="mt-4 flex h-40 items-center justify-center">
              <p className="text-sm text-[var(--brand-text-muted)]">{tx("確認中...", "Checking...")}</p>
            </div>
          )}

          {selectedPath === "speaker" && authStatus === "guest" && reservationStatus !== "loading" && (
            <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-[var(--brand-bg-900)] p-5 text-center">
              <p className="text-sm text-[var(--brand-text)]">
                {tx("スピーカーとして参加するにはアカウントが必要です。", "You need an account to join as a speaker.")}
              </p>
              <button
                onClick={() => router.push(`/auth?redirect=${encodeURIComponent(`/join/${sessionId}`)}`)}
                className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white"
              >
                {tx("ログイン / アカウント作成", "Log in / Sign up")}
              </button>
            </div>
          )}

          {/* 未予約 → 予約ボタン */}
          {selectedPath === "speaker" && authStatus === "logged-in" && (reservationStatus === "none" || reservationStatus === "reserving") && (
            <div className="mt-4 flex flex-col gap-4 rounded-xl bg-[var(--brand-bg-900)] p-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-text-muted)]">{tx("プロフィール確認", "Profile check")}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--brand-text)]">{user?.name || tx("表示名未設定", "No display name set")}</p>
                <p className="mt-1 text-xs text-[var(--brand-text-muted)]">{tx("この名前で参加者一覧に表示されます。", "This name will be shown in the participant list.")}</p>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--brand-text)]">{tx("スピーカー枠を申し込む", "Apply for a speaker slot")}</h2>
                <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
                  {dynamicSession
                    ? tx(`残り ${dynamicSession.speakerSlotsLeft} 枠 / ${dynamicSession.speakerSlotsTotal} 枠`, `${dynamicSession.speakerSlotsLeft} / ${dynamicSession.speakerSlotsTotal} slots left`)
                    : tx("スピーカー枠の詳細を確認しています", "Checking speaker slots...")}
                </p>
                <p className="mt-2 rounded-lg bg-[var(--brand-surface)] px-3 py-2 text-xs text-[var(--brand-text-muted)]">
                  {tx("予約は無料です。配信24時間前になったら参加費の支払いが必要です。", "Reservation is free. Payment is required within 24h of the stream.")}
                </p>
              </div>
              {paymentError && <p className="text-xs text-red-400">{paymentError}</p>}
              <button
                onClick={() => void handleReserve()}
                disabled={reservationStatus === "reserving" || (dynamicSession != null && dynamicSession.speakerSlotsLeft === 0)}
                className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reservationStatus === "reserving"
                  ? tx("予約中...", "Reserving...")
                  : dynamicSession != null && dynamicSession.speakerSlotsLeft === 0
                    ? tx("満枠です", "No slots left")
                    : tx("スピーカー枠を予約する（無料）", "Reserve a speaker slot (free)")}
              </button>
            </div>
          )}

          {/* 予約完了後 — 24h以内: 支払いオプション / 24h超: 案内 */}
          {selectedPath === "speaker" && authStatus === "logged-in" && reservationStatus === "reserved" && !clientSecret && (
            <div className="mt-4 flex flex-col gap-4 rounded-xl bg-[var(--brand-bg-900)] p-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-primary)]">{tx("予約完了", "Reserved")}</p>
                <h2 className="mt-2 text-base font-semibold text-[var(--brand-text)]">
                  {paymentWindowOpen
                    ? tx("支払いを完了して参加を確定する", "Pay to confirm your participation")
                    : tx("予約が完了しました", "Your reservation is confirmed")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--brand-text-muted)]">
                  {paymentWindowOpen
                    ? tx(
                        "支払いが可能になりました。配信に参加するには支払いを完了してください。支払いが完了していない場合は入室できません。",
                        "Payment is now open. Please pay to join. You won't be able to enter without completing payment.",
                      )
                    : tx(
                        "配信24時間前になると支払いが可能になります。支払いを済ませてから配信に参加してください。支払いが完了していない場合は入室できません。",
                        "Payment opens 24 hours before the stream. You must pay before joining — unpaid reservations cannot enter.",
                      )}
                </p>
              </div>
              {paymentError && <p className="text-xs text-red-400">{paymentError}</p>}
              {paymentWindowOpen ? (
                <button
                  onClick={() => void handleStartPayment()}
                  disabled={paymentLoading}
                  className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {paymentLoading ? tx("準備中...", "Preparing...") : tx("今すぐ支払う →", "Pay now →")}
                </button>
              ) : (
                <div className="rounded-lg bg-[var(--brand-surface)] px-3 py-2.5 text-xs text-[var(--brand-text-muted)]">
                  {dynamicSession?.startsAt
                    ? tx(
                        `支払い開始: ${new Date(new Date(dynamicSession.startsAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString("ja-JP")}`,
                        `Payment opens: ${new Date(new Date(dynamicSession.startsAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString("en-US")}`,
                      )
                    : tx("配信24時間前から支払い可能です", "Payment opens 24h before the stream")}
                </div>
              )}
            </div>
          )}

          {/* 支払い Stripe フォーム（インライン） */}
          {selectedPath === "speaker" && authStatus === "logged-in" && reservationStatus === "reserved" && clientSecret && (
            <div className="mt-4 rounded-xl bg-[var(--brand-bg-900)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-primary)]">{tx("参加費のお支払い", "Speaker Fee")}</p>
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "night" } }}
              >
                <PaymentForm
                  sessionId={sessionId}
                  amountPhp={amountPhp}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setClientSecret(null)}
                />
              </Elements>
            </div>
          )}

          {/* 支払い済み → マイクチェック → 入室 */}
          {selectedPath === "speaker" && authStatus === "logged-in" && reservationStatus === "paid" && (
            <div className="mt-4 rounded-xl bg-[var(--brand-bg-900)] p-5">
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-text-muted)]">{tx("参加前の確認", "Before you join")}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--brand-text)]">{user?.name || tx("表示名未設定", "No display name set")}</p>
                <p className="mt-1 text-xs text-[var(--brand-text-muted)]">{tx("必要ならアカウント設定で表示名やアイコンを整えてから参加してください。", "If needed, update your display name and avatar in account settings before joining.")}</p>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--brand-text-muted)]">{tx("デバイス確認", "Device Check")}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ready ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]" : "bg-[var(--brand-accent)]/20 text-[var(--brand-accent)]"}`}>
                  {ready ? tx("準備OK", "Ready") : tx("準備中", "Preparing")}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-[var(--brand-bg-900)]" style={{ aspectRatio: "16/10" }}>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[var(--brand-text-muted)]">
                  {tx("マイクをチェックしてください", "Check your microphone")}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[var(--brand-surface)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--brand-text-muted)]">{tx("マイク入力レベル", "Mic input level")}</p>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-bg-900)]">
                  <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all" style={{ width: `${micOn ? micLevel : 0}%` }} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="relative inline-flex items-center rounded-full bg-[var(--brand-bg-900)]">
                  <button
                    onClick={() => applyMic(!micOn)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${micOn ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)]"}`}
                  >
                    {micOn ? (
                      <MicrophoneIcon className="h-5 w-5" aria-hidden />
                    ) : (
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        <MicrophoneIcon className="h-5 w-5" aria-hidden />
                        <span className="pointer-events-none absolute h-6 w-[5px] -rotate-45 rounded-full bg-black" aria-hidden />
                        <span className="pointer-events-none absolute h-6 w-[2px] -rotate-45 rounded-full bg-current" aria-hidden />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMicMenu((v) => !v)}
                    className="flex h-12 w-8 items-center justify-center border-l border-black/20 bg-transparent text-[var(--brand-text-muted)]"
                  >
                    <ChevronDownIcon className="h-4 w-4" aria-hidden />
                  </button>
                  {showMicMenu && (
                    <div className="absolute left-0 top-14 z-20 min-w-[220px] rounded-xl bg-[var(--brand-surface)] p-2 shadow-xl shadow-black/35">
                      {audioDevices.map((device, index) => (
                        <button
                          key={device.deviceId}
                          type="button"
                          onClick={() => { setSelectedAudioDeviceId(device.deviceId); setShowMicMenu(false); }}
                          className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selectedAudioDeviceId === device.deviceId ? "bg-[var(--brand-primary)] font-bold text-white" : "text-[var(--brand-text)] hover:bg-[var(--brand-bg-900)]"}`}
                        >
                          {device.label || `Microphone ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && <p className="mt-4 rounded-xl bg-[var(--brand-accent)]/15 px-4 py-3 text-sm text-[var(--brand-accent)]">{errorMessage}</p>}

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setSelectedPath(null)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-[var(--brand-text-muted)] transition-colors hover:text-[var(--brand-primary)]"
                >
                  {tx("戻る", "Back")}
                </button>
                <button
                  onClick={joinNow}
                  disabled={!ready || !!errorMessage}
                  className="flex-1 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[var(--brand-text-muted)]"
                >
                  {tx("この設定で参加", "Join with this setup")}
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
