"use client";

// SOLID: S（チャンネルページでの決済UIをPaymentModalに委譲し、チケット購入の開始処理に専念）
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TicketType, UserRole } from "../../lib/apiTypes";
import { PaymentModal } from "../../components/billing/PaymentModal";
import { Ticket } from "../../components/ui/Ticket";
import { createTicketCheckout, listTicketPurchases } from "../../lib/billing";
import { useI18n } from "../../lib/i18n";
import { useUserSession } from "../../lib/userSession";

type ChannelTicketPanelProps = {
  targetUserId: string;
  channelName: string;
  targetRole: UserRole;
};

const TICKET_OPTIONS: Array<{
  ticketType: TicketType;
  labelJp: string;
  labelEn: string;
  minutes: number;
  price: string;
}> = [
  {
    ticketType: "1on1_10min",
    labelJp: "10分チケットを購入",
    labelEn: "Buy 10 min ticket",
    minutes: 10,
    price: "PHP 499",
  },
  {
    ticketType: "1on1_30min",
    labelJp: "30分チケットを購入",
    labelEn: "Buy 30 min ticket",
    minutes: 30,
    price: "PHP 1,399",
  },
];

export function ChannelTicketPanel({ targetUserId, channelName, targetRole }: ChannelTicketPanelProps) {
  const router = useRouter();
  const { tx } = useI18n();
  const { hydrated, isAuthenticated, user } = useUserSession();
  const [pendingTicketType, setPendingTicketType] = useState<TicketType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ clientSecret: string; title: string } | null>(null);

  if (targetRole !== "vtuber") return null;

  const isOwnChannel = user?.id === targetUserId;

  const isAimer = user?.plan === "aimer" && user?.subscriptionStatus === "active";

  const startCheckout = async (ticketType: TicketType) => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (isOwnChannel) return;
    if (!isAimer) {
      setError(tx(
        "1on1チケットはAimerプラン会員限定です。アカウントページからご加入ください。",
        "1on1 tickets are for Aimer plan members only. Please subscribe from your account page.",
      ));
      return;
    }

    setPendingTicketType(ticketType);
    setMessage(null);
    setError(null);
    try {
      const result = await createTicketCheckout({ ticketType, targetUserId });
      if (result.clientSecret) {
        const option = TICKET_OPTIONS.find((o) => o.ticketType === ticketType);
        setPaymentModal({
          clientSecret: result.clientSecret,
          title: option ? `${tx(option.labelJp, option.labelEn)} — ${option.price}` : tx("チケットを購入", "Buy ticket"),
        });
        return;
      }
      // モックモード
      setMessage(tx("1on1チケットを有効化しました。", "1on1 ticket activated."));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : tx("チケット購入に失敗しました。", "Failed to buy ticket."));
    } finally {
      setPendingTicketType(null);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentModal(null);
    setPendingTicketType(null);
    // 購入一覧を再取得してUIに反映する必要があれば親コンポーネントへのcallback追加を検討
    await listTicketPurchases();
    setMessage(tx("1on1チケットを購入しました。", "1on1 ticket purchased."));
  };

  return (
    <>
      {/* プロフィールのカードと同じ形（紫の見出しの帯＋白い面）。買えるチケットは、半券に時間を大きく出したチケットの形で縦に並べる */}
      <section
        className="overflow-hidden rounded-[20px] border-[1.5px] border-[var(--surface-edge,var(--line))] bg-[var(--brand-surface)]"
        style={{ boxShadow: "0 4px 0 0 var(--surface-edge, var(--line))" }}
      >
        <div className="flex items-center justify-between gap-3 bg-[var(--brand-primary)] px-5 py-3 text-white">
          <h2 className="text-xs font-black tracking-[0.25em]">1on1</h2>
          <span className="truncate text-xs font-bold text-white/75">{tx(`${channelName} と話す`, `Talk with ${channelName}`)}</span>
        </div>

        <div className="grid gap-3 p-4">
          {isOwnChannel ? (
            <p className="text-sm text-[var(--brand-text-muted)]">
              {tx("自分のチャンネル向けチケットは購入できません。", "You cannot buy a ticket for your own channel.")}
            </p>
          ) : null}
          {TICKET_OPTIONS.map((option) => {
            const pending = pendingTicketType === option.ticketType;
            return (
              <Ticket
                key={option.ticketType}
                stubWidth="76px"
                notch={16}
                stub={
                  <div className="grid py-3 text-center">
                    <p className="text-3xl font-black leading-none">{option.minutes}</p>
                    <p className="text-[11px] font-black opacity-90">{tx("分", "min")}</p>
                  </div>
                }
              >
                <div className="flex h-full items-center gap-3 px-4 py-3">
                  <p className="min-w-0 flex-1 text-base font-black text-[var(--brand-text)]">{option.price}</p>
                  <button
                    type="button"
                    onClick={() => void startCheckout(option.ticketType)}
                    disabled={!hydrated || pendingTicketType != null || isOwnChannel}
                    className="ui-btn ui-btn-sm ui-btn-primary shrink-0"
                    aria-label={`${tx(option.labelJp, option.labelEn)} — ${option.price}`}
                  >
                    {pending ? tx("処理中...", "Processing...") : tx("買う", "Buy")}
                  </button>
                </div>
              </Ticket>
            );
          })}
        {message ? <p className="text-sm text-[var(--brand-primary-ink)]">{message}</p> : null}
        {error ? (
          <p className="text-sm text-[var(--brand-accent-ink)]">
            {error}
            {!isAimer && isAuthenticated ? (
              <a href="/account" className="ml-1 underline">
                {tx("Aimerプランに登録する →", "Subscribe to Aimer →")}
              </a>
            ) : null}
          </p>
        ) : null}
        </div>
      </section>

      {paymentModal ? (
        <PaymentModal
          clientSecret={paymentModal.clientSecret}
          title={paymentModal.title}
          onSuccess={() => void handlePaymentSuccess()}
          onClose={() => {
            setPaymentModal(null);
            setPendingTicketType(null);
          }}
        />
      ) : null}
    </>
  );
}
