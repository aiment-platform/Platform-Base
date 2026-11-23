"use client";

import { XMarkIcon } from "@heroicons/react/24/solid";
import { ModalSession } from "./types";
import { useI18n } from "../../lib/i18n";
import { planLabel } from "../../lib/planAccess";
import { OptimizedImage } from "@/app/components/ui/OptimizedImage";

type SessionDetailModalProps = {
 session: ModalSession;
 onClose: () => void;
 onParticipate: (session: ModalSession) => void | Promise<void>;
};

export function SessionDetailModal({ session, onClose, onParticipate }: SessionDetailModalProps) {
 const { tx } = useI18n();
 const isPrelive = session.streamStatus === "prelive";
 const joinBlockedByPlan = session.requiredPlan != null && session.requiredPlan !== "free" && !session.isSubscribed;
 const joinBlockedByReservation = session.streamStatus === "live" && session.reservationRequired && !session.reserved;
 const primaryLabel = joinBlockedByPlan
   ? tx("プランが必要", "Plan Required", { tw: "需要方案", ko: "플랜 필요" })
   : isPrelive
   ? session.reserved
     ? tx("予約を取り消す", "Cancel Reservation", { tw: "取消預約", ko: "예약 취소" })
     : tx("予約する", "Reserve", { tw: "預約", ko: "예약하기" })
   : joinBlockedByReservation
     ? tx("予約が必要", "Reservation Required", { tw: "需要預約", ko: "예약 필요" })
     : tx("参加する", "Join", { tw: "加入", ko: "참여하기" });
 const availabilityTitle = joinBlockedByPlan
   ? tx("上位プランが必要です", "Paid plan required", { tw: "需要付費方案", ko: "유료 플랜이 필요해요" })
   : isPrelive
   ? tx("まだ開始前です", "Not live yet", { tw: "尚未開始", ko: "아직 시작 전이에요" })
   : joinBlockedByReservation
     ? tx("予約が必要です", "Reservation required", { tw: "需要預約", ko: "예약이 필요해요" })
     : tx("参加可能", "Available to Join", { tw: "可以加入", ko: "참여 가능" });
 const availabilityText = joinBlockedByPlan
   ? tx(`この配信は ${planLabel(session.requiredPlan)} プラン限定です。先にプランを有効化してください。`, `This stream requires the ${planLabel(session.requiredPlan)} plan.`, { tw: `此直播限 ${planLabel(session.requiredPlan)} 方案觀看，請先啟用方案。`, ko: `이 방송은 ${planLabel(session.requiredPlan)} 플랜 전용이에요. 먼저 플랜을 활성화해 주세요.` })
   : isPrelive
   ? tx("この枠はまだ配信前です。参加ではなく予約を行ってください。", "This stream has not started yet. Reserve instead of joining.", { tw: "此直播尚未開始，請先預約。", ko: "아직 시작 전인 방송이에요. 참여 대신 예약해 주세요." })
   : joinBlockedByReservation
     ? tx("このライブは予約必須の枠です。先に予約してから参加してください。", "This live session requires a reservation before joining.", { tw: "此直播需要預約，請先預約再加入。", ko: "예약이 필요한 라이브예요. 먼저 예약한 뒤 참여해 주세요." })
     : tx("現在は検証モードのため、サブスクなしで参加できます。", "Demo mode: join without subscription.", { tw: "目前為測試模式，不需訂閱即可加入。", ko: "현재 테스트 모드라 구독 없이 참여할 수 있어요." });
 const primaryDisabled = joinBlockedByReservation || joinBlockedByPlan;
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center ui-scrim p-4" onClick={onClose}>
 <div
 className="ui-modal flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="relative">
 <div className="aspect-video bg-[var(--brand-primary-soft)]">
 <OptimizedImage src={session.thumbnail} alt={session.vtuber} width={1280} height={720} sizes="(max-width: 672px) 100vw, 672px" className="h-full w-full object-cover" />
 </div>
 <button
 onClick={onClose}
 className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-bg-900)]"
 aria-label={tx("閉じる", "Close", { tw: "關閉", ko: "닫기" })}
 >
 <XMarkIcon className="h-5 w-5" aria-hidden />
 </button>
 <div className="absolute bottom-4 left-4 rounded-lg bg-[var(--brand-primary)] px-4 py-2">
 <p className="text-sm font-bold text-white">{session.startsIn}</p>
 </div>
 <div className="absolute bottom-4 right-4 rounded-lg bg-[var(--brand-accent)] px-4 py-2">
 <p className="text-sm font-bold text-white">{session.slotsLeft} {tx("枠残り", "spots left", { tw: "個名額剩餘", ko: "자리 남음" })}</p>
 </div>
 </div>

 <div className="overflow-y-auto p-8">
 <h2 className="mb-2 text-2xl font-bold text-[var(--brand-text)]">{session.title}</h2>
 <p className="mb-6 text-lg text-[var(--brand-primary)]">{session.vtuber}</p>

 <div className="mb-6">
 <h3 className="mb-2 text-sm font-bold text-[var(--brand-text)]">{tx("配信内容", "About this stream", { tw: "直播內容", ko: "방송 소개" })}</h3>
 <p className="text-sm leading-relaxed text-[var(--brand-text-muted)]">{session.description}</p>
 </div>

 <div className="mb-6 grid grid-cols-2 gap-4">
 <div className="rounded-lg bg-[var(--brand-surface)] p-4">
 <p className="mb-0.5 text-xs text-[var(--brand-text-muted)]">{tx("配信時間", "Duration", { tw: "直播時長", ko: "방송 시간" })}</p>
 <p className="text-sm font-bold text-[var(--brand-text)]">{session.duration}</p>
 </div>

 <div className="mb-6 rounded-lg bg-[var(--brand-surface)] p-4">
 <p className="mb-0.5 text-xs text-[var(--brand-text-muted)]">{tx("アクセスプラン", "Access Plan", { tw: "觀看方案", ko: "이용 플랜" })}</p>
 <p className="text-sm font-bold text-[var(--brand-text)]">{planLabel(session.requiredPlan)}</p>
 </div>
 <div className="rounded-lg bg-[var(--brand-surface)] p-4">
 <p className="mb-0.5 text-xs text-[var(--brand-text-muted)]">{tx("参加方式", "Entry Type", { tw: "參加方式", ko: "참여 방식" })}</p>
 <p className="text-sm font-bold text-[var(--brand-text)]">{session.participationType === "First-come" ? tx("先着順", "First-come", { tw: "先搶先贏", ko: "선착순" }) : tx("抽選制", "Lottery", { tw: "抽選制", ko: "추첨제" })}</p>
 </div>
 </div>

 {session.userHistory && (
 <div className="mb-6 rounded-lg bg-[var(--brand-surface)] p-4">
 <h3 className="mb-3 text-sm font-bold text-[var(--brand-text)]">{tx("あなたの参加履歴", "Your history", { tw: "你的參加紀錄", ko: "나의 참여 기록" })}</h3>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="mb-0.5 text-xs text-[var(--brand-text-muted)]">{tx("総参加回数", "Total joins", { tw: "總參加次數", ko: "총 참여 횟수" })}</p>
 <p className="text-lg font-bold text-[var(--brand-primary)]">{session.userHistory.totalParticipations}{tx("回", "", { tw: "次", ko: "회" })}</p>
 </div>
 <div>
 <p className="mb-0.5 text-xs text-[var(--brand-text-muted)]">{tx("最終参加日", "Last joined", { tw: "最後參加日", ko: "마지막 참여일" })}</p>
 <p className="text-sm font-medium text-[var(--brand-text)]">{session.userHistory.lastParticipation}</p>
 </div>
 </div>
 </div>
 )}

 <div className="mb-6 flex items-center gap-3 rounded-lg bg-[var(--brand-primary)]/15 p-4">
 <div className="text-[var(--brand-primary)]">OK</div>
 <div>
 <p className="text-sm font-bold text-[var(--brand-primary)]">{availabilityTitle}</p>
 <p className="text-xs text-[var(--brand-primary)]">{availabilityText}</p>
 </div>
 </div>
 </div>

 <div className="sticky bottom-0 z-10 bg-[var(--brand-bg-800)] p-6">
 <div className="flex gap-3">
 <button className="flex-1 rounded-lg px-6 py-4 font-bold text-[var(--brand-text)] transition-colors ">
 {tx("視聴のみ (無料)", "Watch only (Free)", { tw: "僅觀看（免費）", ko: "시청만 하기 (무료)" })}
 </button>
 <button
 className="ui-btn ui-btn-lg ui-btn-primary flex-1"
 disabled={primaryDisabled}
 onClick={() => onParticipate(session)}
 >
 {primaryLabel}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
