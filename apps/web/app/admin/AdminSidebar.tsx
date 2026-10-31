"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoltIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  GiftIcon,
  PencilSquareIcon,
  SignalIcon,
  TicketIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const NAV_ITEMS = [
  { href: "/admin/users", label: "ユーザー管理", icon: UsersIcon },
  { href: "/admin/sessions", label: "セッション管理", icon: SignalIcon },
  { href: "/admin/reservations", label: "予約確認", icon: ClipboardDocumentListIcon },
  { href: "/admin/supporter-lottery", label: "サポーター抽選", icon: GiftIcon },
  { href: "/admin/tickets", label: "チケット管理", icon: TicketIcon },
  { href: "/admin/vtubers", label: "VTuber管理", icon: UserCircleIcon, soon: true },
  { href: "/admin/surveys", label: "アンケート", icon: PencilSquareIcon, soon: true },
  { href: "/admin/feedback", label: "フィードバック", icon: ChatBubbleLeftEllipsisIcon, soon: true },
  { href: "/admin/logs", label: "操作ログ", icon: DocumentTextIcon, soon: true },
  { href: "/admin/ingresses", label: "Ingress", icon: BoltIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-b border-[var(--line)] bg-[var(--brand-surface)] px-4 pb-2 pt-3 md:w-52 md:border-b-0 md:border-r md:p-4">
      <div className="mb-2 md:mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-primary-ink)]">Admin</p>
        <p className="text-[11px] text-[var(--brand-text-muted)]">Aiment Dashboard</p>
      </div>

      {/* スマホでは横スクロールのタブ列。端まで流せるよう左右の余白を打ち消す */}
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          // 準備中の項目は押せないので、幅の限られたスマホのタブ列には出さない
          if (soon) {
            return (
              <span
                key={href}
                className="hidden items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--brand-text-muted)] opacity-60 md:flex"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
                <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-[var(--brand-bg-900)] px-1.5 py-0.5 text-[11px] text-[var(--brand-text-muted)]">
                  準備中
                </span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors md:py-2 ${
                active
                  ? "bg-[var(--brand-primary-soft)] font-bold text-[var(--brand-primary-ink)]"
                  : "text-[var(--brand-text-muted)] hover:bg-[var(--brand-bg-900)] hover:text-[var(--brand-text)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
