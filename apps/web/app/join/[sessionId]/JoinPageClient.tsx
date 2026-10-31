"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MicrophoneIcon } from "@heroicons/react/24/solid";
import { SelectField } from "../../components/ui/Field";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getAjlInfo } from "../../lib/ajl";
import { HOST_TIME_ZONE, formatInTimeZone, sameWallClock, timeZoneLabel, useViewerTimeZone } from "../../lib/timezone";
import { useI18n } from "../../lib/i18n";
import { participationLabel } from "../../lib/labels";
import { getStreamSession } from "../../lib/streamSessions";
import { useUserSession } from "../../lib/userSession";
import { useRouteTransition } from "../../components/ui/RouteTransition";
import { TopNav } from "../../components/home/TopNav";
import { JoinHero, getStartState } from "./JoinHero";
import { SPEAKER_FEE_ENABLED } from "@/lib/speakerFee";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type AuthStatus = "loading" | "guest" | "logged-in";
type ReservationStatus = "loading" | "none" | "reserving" | "reserved" | "paid" | "error";

type SessionMeta = {
  id: string;
  vtuber: string;
  title: string;
  description: string;
  duration: string;
  durationMin: number;
  status?: string;
  hostUserId?: string;
  hostAvatarUrl?: string;
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
      {error && <p className="text-sm text-[var(--brand-accent-ink)]">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="ui-btn ui-btn-md ui-btn-primary w-full"
      >
        {loading ? "処理中..." : `₱${amountPhp} を支払う`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="ui-btn ui-btn-md ui-btn-ghost w-full"
      >
        キャンセル
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function JoinPageClient() {
  const router = useRouter();
  const { navigate } = useRouteTransition();
  const { tx } = useI18n();
  const viewerTimeZone = useViewerTimeZone();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "";
  const [dynamicSession, setDynamicSession] = useState<Awaited<ReturnType<typeof getStreamSession>>>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>("loading");
  const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);
  const [usableTicketCount, setUsableTicketCount] = useState(0);
  const [redeemingTicket, setRedeemingTicket] = useState(false);
  // 支払い済みの人が「マイクを確認する」を押したら "speaker"。マイクの許可はこのときに初めて求める
  const [selectedPath, setSelectedPath] = useState<"speaker" | null>(null);
  // 「あと何時間」を進めるための今の時刻。1分ごとに更新する
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Payment flow
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountPhp, setAmountPhp] = useState(200);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { isAuthenticated, hydrated, user, isAdmin } = useUserSession();
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
          usableTicketCount?: number;
        };
        setPaymentWindowOpen(data.paymentWindowOpen ?? false);
        setUsableTicketCount(data.usableTicketCount ?? 0);
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

  // チケットで参加（支払いスキップ）
  const handleRedeemTicket = async () => {
    setRedeemingTicket(true);
    setPaymentError(null);
    try {
      const res = await fetch(
        `/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations/redeem-ticket`,
        { method: "POST" },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setPaymentError(data.error ?? tx("チケットの使用に失敗しました。", "Failed to use the ticket."));
        return;
      }
      await checkReservation(); // paid に更新される
    } catch {
      setPaymentError(tx("通信エラーが発生しました。", "A network error occurred."));
    } finally {
      setRedeemingTicket(false);
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
    // 一覧ではなく別の文脈（配信ルーム）へ入るので、全画面で切り替える。
    navigate(`/room/${roomId}?${query}`);
  };

  const session = useMemo<SessionMeta>(() => {
    if (dynamicSession) {
      return {
        id: dynamicSession.sessionId,
        vtuber: dynamicSession.hostName,
        title: dynamicSession.title,
        description: dynamicSession.description,
        // 配信中かどうかはチケットの半券で出すので、ここは長さだけ
        duration: tx(`約${dynamicSession.plannedDurationMin ?? 60}分`, `About ${dynamicSession.plannedDurationMin ?? 60} min`),
        durationMin: dynamicSession.plannedDurationMin ?? 60,
        status: dynamicSession.status,
        hostUserId: dynamicSession.hostUserId,
        hostAvatarUrl: dynamicSession.hostAvatarUrl,
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
      durationMin: 60,
      startsAt: "",
      speakerSlotsLeft: 0,
      speakerSlotsTotal: 0,
      participationType: participationLabel("First-come", tx),
      thumbnail: "",
    };
  }, [dynamicSession, sessionId, tx]);

  const ajl = getAjlInfo(session.japaneseLevel);
  // 開始時刻は「あなたの時刻＋地域名」。VTuber（日本時間）とずれる人には日本時間も添える
  const startsAtLabel =
    session.startsAt && viewerTimeZone
      ? `${formatInTimeZone(session.startsAt, viewerTimeZone)} ${timeZoneLabel(viewerTimeZone)}`
      : null;
  const startsAtHostLabel =
    session.startsAt && viewerTimeZone && !sameWallClock(viewerTimeZone, HOST_TIME_ZONE)
      ? tx(
          `日本時間 ${formatInTimeZone(session.startsAt, HOST_TIME_ZONE, { hour: "2-digit", minute: "2-digit" })}`,
          `${formatInTimeZone(session.startsAt, HOST_TIME_ZONE, { hour: "2-digit", minute: "2-digit" })} in Japan (JST)`,
        )
      : null;

  const start = getStartState(session.startsAt, session.durationMin, session.status, now);
  const isEnded = start.kind === "ended";
  const isLive = start.kind === "live";
  // 管理者は予約なしで入れるので、印は付けない
  const hasReservation = authStatus === "logged-in" && !isAdmin && (reservationStatus === "reserved" || reservationStatus === "paid");
  // スマホの下に固定するボタンの文言。今の手続きの段階に合わせる（終了したら出さない）
  const mobileCtaLabel = isEnded || sessionLoading
    ? null
    : authStatus === "guest"
      ? tx("ログインして参加する", "Log in to join")
      : reservationStatus === "paid"
        ? isLive
          ? tx("今すぐ入る", "Join now")
          : tx("参加の準備へ", "Get ready to join")
        : reservationStatus === "reserved"
          ? tx("予約の状況を見る", "View my reservation")
          : tx("スピーカー枠を予約する", "Reserve a speaker spot");

  if (!sessionLoading && !dynamicSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg)] text-[var(--brand-text)]">
        <p className="text-lg font-semibold">{tx("配信枠が見つかりません", "Session not found")}</p>
        <p className="text-sm text-[var(--brand-text-muted)]">{tx("この枠はすでに終了しているか、存在しません。", "This session has ended or does not exist.")}</p>
        <button onClick={() => router.push("/")} className="ui-btn ui-btn-md ui-btn-primary">
          {tx("ホームに戻る", "Back to Home")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />

      {/* スマホでは、右の手続き欄が説明の下に回るので、画面の下に参加ボタンを固定して、手続き欄へ飛べるようにする。
          この帯が出る幅（lg 未満）では、いつも下固定のナビ（TopNav, 52px）があるので、その上に置く */}
      {mobileCtaLabel ? (
        <div className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom,0px))] z-30 border-t border-[var(--line)] bg-[var(--brand-surface)]/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => document.getElementById("join-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="ui-btn ui-btn-md ui-btn-primary w-full"
          >
            {mobileCtaLabel}
          </button>
        </div>
      ) : null}

      <main className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-5 px-4 pb-40 pt-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:pb-12">
        <section className="min-w-0">
          <JoinHero
            title={session.title}
            description={session.description}
            thumbnail={session.thumbnail}
            host={{
              name: session.vtuber,
              avatarUrl: session.hostAvatarUrl,
              onOpen: session.hostUserId ? () => navigate(`/channels/${encodeURIComponent(session.hostUserId!)}`) : undefined,
            }}
            ajl={ajl}
            start={start}
            startsAtLabel={startsAtLabel}
            startsAtHostLabel={startsAtHostLabel}
            durationLabel={session.duration}
            slotsLeft={session.speakerSlotsLeft}
            slotsTotal={session.speakerSlotsTotal}
            participationType={session.participationType}
            reserved={hasReservation}
            tx={tx}
          />
        </section>

        {/* 参加の手続きは、ここ1か所だけ。PC では画面に付いてくる */}
        <aside id="join-panel" className="ui-panel grid scroll-mt-24 gap-4 self-start p-5 lg:sticky lg:top-24">
          {isEnded ? (
            <div className="grid gap-3">
              <p className="text-lg font-black text-[var(--brand-text)]">{tx("この配信は終了しました", "This session has ended")}</p>
              <p className="text-sm leading-6 text-[var(--brand-text-muted)]">
                {tx("次の配信は、チャンネルのスケジュールから探せます。", "Find the next session on the channel schedule.")}
              </p>
              {session.hostUserId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/channels/${encodeURIComponent(session.hostUserId!)}/schedule`)}
                  className="ui-btn ui-btn-md ui-btn-primary w-full"
                >
                  {tx("チャンネルのスケジュールを見る", "See the channel schedule")}
                </button>
              ) : null}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-black text-[var(--brand-text)]">
                {isLive ? tx("いま配信中です", "Live now") : hasReservation ? tx("予約済みです", "You're booked") : tx("スピーカーとして参加", "Join as a speaker")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--brand-text-muted)]">
                {isLive && hasReservation
                  ? tx("マイクを確認したら、すぐに入れます。", "Check your microphone and jump right in.")
                  : hasReservation
                    ? tx("チケットに予約済みの印が付いています。始まる前にマイクを確かめておきましょう。", "Your ticket is stamped. Check your microphone before it starts.")
                    : tx("声で会話に参加します。見るだけの視聴は準備中です。", "Join the conversation by voice. Watch-only viewing is coming soon.")}
              </p>
            </div>
          )}

          {!isEnded && (authStatus === "loading" || reservationStatus === "loading") && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-[var(--brand-text-muted)]">{tx("確認中...", "Checking...")}</p>
            </div>
          )}

          {!isEnded && authStatus === "guest" && reservationStatus !== "loading" && (
            <div className="flex flex-col items-center gap-4 rounded-xl bg-[var(--brand-bg-900)] p-5 text-center">
              <p className="text-sm text-[var(--brand-text)]">
                {tx("スピーカーとして参加するにはアカウントが必要です。", "You need an account to join as a speaker.")}
              </p>
              <button
                onClick={() => router.push(`/auth?redirect=${encodeURIComponent(`/join/${sessionId}`)}`)}
                className="ui-btn ui-btn-md ui-btn-primary w-full"
              >
                {tx("ログイン / アカウント作成", "Log in / Sign up")}
              </button>
            </div>
          )}

          {/* 管理者: 予約・支払い・上限を無視して参加 */}
          {!isEnded && authStatus === "logged-in" && isAdmin && (
            <div className="flex flex-col gap-4 rounded-xl border border-[var(--brand-primary)]/40 bg-[var(--brand-bg-900)] p-5">
              <div>
                <p className="text-xs font-bold text-[var(--brand-primary-ink)]">{tx("管理者", "Admin")}</p>
                <h2 className="mt-2 text-base font-semibold text-[var(--brand-text)]">
                  {tx("管理者として参加", "Join as admin")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--brand-text-muted)]">
                  {tx(
                    "予約・支払い・枠の上限を無視して、スピーカーとして参加できます。",
                    "Join as a speaker, ignoring reservation, payment, and slot limits.",
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate(`/room/${encodeURIComponent(session.id)}?role=speaker&mic=1`)}
                className="ui-btn ui-btn-md ui-btn-primary w-full"
              >
                {tx("スピーカーとして入室", "Enter as speaker")}
              </button>
            </div>
          )}

          {/* 未予約 → 予約ボタン */}
          {!isEnded && authStatus === "logged-in" && !isAdmin && (reservationStatus === "none" || reservationStatus === "reserving") && (
            <div className="flex flex-col gap-4 rounded-xl bg-[var(--brand-bg-900)] p-5">
              <div>
                <p className="text-xs font-bold text-[var(--brand-text-muted)]">{tx("プロフィール確認", "Profile check")}</p>
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
                  {SPEAKER_FEE_ENABLED
                    ? tx("予約は無料です。配信24時間前になったら参加費の支払いが必要です。", "Reservation is free. Payment is required within 24h of the stream.")
                    : tx("参加費は現在無料です。予約するだけで参加できます。", "Participation is currently free. Just reserve a slot to join.")}
                </p>
              </div>
              {paymentError && <p className="text-xs text-[var(--brand-accent-ink)]">{paymentError}</p>}
              <button
                onClick={() => void handleReserve()}
                disabled={reservationStatus === "reserving" || (dynamicSession != null && dynamicSession.speakerSlotsLeft === 0)}
                className="ui-btn ui-btn-md ui-btn-primary w-full"
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
          {!isEnded && authStatus === "logged-in" && !isAdmin && reservationStatus === "reserved" && !clientSecret && (
            <div className="flex flex-col gap-4 rounded-xl bg-[var(--brand-bg-900)] p-5">
              <div>
                <p className="text-xs font-bold text-[var(--brand-primary-ink)]">{tx("予約完了", "Reserved")}</p>
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
              {paymentError && <p className="text-xs text-[var(--brand-accent-ink)]">{paymentError}</p>}
              {usableTicketCount > 0 && (
                <div className="rounded-lg border border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/10 p-3">
                  <p className="text-xs font-semibold text-[var(--brand-primary)]">
                    {tx(`参加チケットを ${usableTicketCount} 枚お持ちです`, `You have ${usableTicketCount} participation ticket(s)`)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--brand-text-muted)]">
                    {tx("チケットを使うと支払い不要で参加を確定できます。", "Use a ticket to confirm without payment.")}
                  </p>
                  <button
                    onClick={() => void handleRedeemTicket()}
                    disabled={redeemingTicket}
                    className="ui-btn ui-btn-md ui-btn-primary mt-2 w-full"
                  >
                    {redeemingTicket
                      ? tx("使用中...", "Using...")
                      : tx("チケットで参加（支払いスキップ）", "Join with a ticket (skip payment)")}
                  </button>
                </div>
              )}
              {paymentWindowOpen ? (
                <button
                  onClick={() => void handleStartPayment()}
                  disabled={paymentLoading}
                  className="ui-btn ui-btn-md ui-btn-primary w-full"
                >
                  {paymentLoading ? tx("準備中...", "Preparing...") : tx("今すぐ支払う →", "Pay now →")}
                </button>
              ) : (
                <div className="rounded-lg bg-[var(--brand-surface)] px-3 py-2.5 text-xs text-[var(--brand-text-muted)]">
                  {dynamicSession?.startsAt
                    ? tx(
                        `支払い開始: ${new Date(new Date(dynamicSession.startsAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString("ja-JP")}${viewerTimeZone ? ` ${timeZoneLabel(viewerTimeZone)}` : ""}`,
                        `Payment opens: ${new Date(new Date(dynamicSession.startsAt).getTime() - 24 * 60 * 60 * 1000).toLocaleString("en-US")}${viewerTimeZone ? ` ${timeZoneLabel(viewerTimeZone)}` : ""}`,
                      )
                    : tx("配信24時間前から支払い可能です", "Payment opens 24h before the stream")}
                </div>
              )}
            </div>
          )}

          {/* 支払い Stripe フォーム（インライン） */}
          {!isEnded && authStatus === "logged-in" && !isAdmin && reservationStatus === "reserved" && clientSecret && (
            <div className="rounded-xl bg-[var(--brand-bg-900)] p-5">
              <p className="text-xs font-bold text-[var(--brand-primary-ink)]">{tx("参加費のお支払い", "Speaker Fee")}</p>
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#6248F7", borderRadius: "12px" } } }}
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

          {/* 支払い済み → 「マイクを確認する」を押す → マイクチェック → 入室。マイクの許可は押したときに初めて求める */}
          {!isEnded && authStatus === "logged-in" && !isAdmin && reservationStatus === "paid" && selectedPath !== "speaker" && (
            // 説明は上の見出しとチケットのスタンプで足りるので、ここはボタンだけ。配信中は「入る」ことを前に出す
            <button onClick={() => setSelectedPath("speaker")} className="ui-btn ui-btn-md ui-btn-primary w-full">
              {isLive ? tx("マイクを確認して入る", "Check mic and join now") : tx("マイクを確認する", "Check my microphone")}
            </button>
          )}

          {!isEnded && authStatus === "logged-in" && !isAdmin && reservationStatus === "paid" && selectedPath === "speaker" && (
            // スマホでは外のパネル（p-5）の内側にさらに箱が入るので、余白を少し詰めて横幅を残す
            <div className="rounded-xl bg-[var(--brand-bg-900)] p-4 sm:p-5">
              {/* マイクの確認。オン・オフの大きなボタン、声に合わせて光るメーター、マイクの選択だけにする */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-black text-[var(--brand-text)]">{tx("マイクの確認", "Microphone check")}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    ready ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]" : "bg-[var(--brand-surface)] text-[var(--brand-text-muted)]"
                  }`}
                >
                  {ready ? tx("準備OK", "Ready") : tx("準備中…", "Preparing…")}
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-[var(--brand-surface)] p-3 sm:gap-4 sm:p-4">
                <button
                  type="button"
                  onClick={() => applyMic(!micOn)}
                  aria-pressed={micOn}
                  aria-label={micOn ? tx("マイクをオフにする", "Turn microphone off") : tx("マイクをオンにする", "Turn microphone on")}
                  className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full transition-colors ${
                    micOn ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)]"
                  }`}
                >
                  <MicrophoneIcon className="h-6 w-6" aria-hidden />
                  {/* オフのときの斜線。下の面の色で縁取って、アイコンの上にくっきり乗せる */}
                  {micOn ? null : (
                    <span
                      className="pointer-events-none absolute h-8 w-[3px] -rotate-45 rounded-full bg-[var(--brand-accent)]"
                      style={{ boxShadow: "0 0 0 2px var(--brand-bg-900)" }}
                      aria-hidden
                    />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  {/* 12本の棒が、声の大きさに合わせて左から光る */}
                  <div className="flex h-8 items-end gap-1" aria-hidden>
                    {Array.from({ length: 12 }, (_, index) => {
                      const lit = micOn && micLevel > (index / 12) * 100;
                      return (
                        <span
                          key={index}
                          className="flex-1 rounded-full transition-colors duration-100"
                          style={{ height: `${30 + index * 6}%`, background: lit ? "var(--brand-primary)" : "var(--track)" }}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs font-bold text-[var(--brand-text-muted)]">
                    {!micOn
                      ? tx("マイクはオフです", "Microphone is off")
                      : micLevel > 8
                        ? tx("聞こえています", "We can hear you")
                        : tx("声を出してみてください", "Say something to test")}
                  </p>
                </div>
              </div>

              {audioDevices.length > 1 ? (
                <label className="mt-3 grid gap-1.5">
                  <span className="text-xs font-bold text-[var(--brand-text-muted)]">{tx("使うマイク", "Microphone")}</span>
                  {/* 選択欄の地の色（--brand-bg-900）がこの箱と同じで、枠が見えなくなるので白い面にする。
                      .ui-select は @layer の外にあり Tailwind の bg では上書きできないため style で渡す */}
                  <SelectField
                    value={selectedAudioDeviceId}
                    onChange={(event) => setSelectedAudioDeviceId(event.target.value)}
                    className="truncate"
                    style={{ background: "var(--brand-surface)" }}
                  >
                    {audioDevices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${tx("マイク", "Microphone")} ${index + 1}`}
                      </option>
                    ))}
                  </SelectField>
                </label>
              ) : null}

              <p className="mt-3 text-xs text-[var(--brand-text-muted)]">
                {tx(`「${user?.name || "表示名未設定"}」として参加します。`, `You'll join as "${user?.name || "No display name"}".`)}
              </p>

              {errorMessage && <p className="mt-4 rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{errorMessage}</p>}

              {/* 「戻る」は文字の幅だけ、「参加」に残りを渡す。半々にすると、スマホで「この設定で参加」が2行に折れる */}
              <div className="mt-5 flex gap-2">
                <button onClick={() => setSelectedPath(null)} className="ui-btn ui-btn-md ui-btn-ghost shrink-0 px-4">
                  {tx("戻る", "Back")}
                </button>
                <button
                  onClick={joinNow}
                  disabled={!ready || !!errorMessage}
                  className="ui-btn ui-btn-md ui-btn-primary min-w-0 flex-1 whitespace-nowrap"
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
