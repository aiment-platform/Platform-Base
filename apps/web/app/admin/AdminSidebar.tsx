"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/users", label: "ユーザー管理", icon: "👤" },
  { href: "/admin/sessions", label: "セッション管理", icon: "📡", soon: true },
  { href: "/admin/reservations", label: "予約確認", icon: "📋" },
  { href: "/admin/supporter-lottery", label: "サポーター抽選", icon: "🎲" },
  { href: "/admin/tickets", label: "チケット管理", icon: "🎟" },
  { href: "/admin/vtubers", label: "VTuber管理", icon: "🎭", soon: true },
  { href: "/admin/surveys", label: "アンケート", icon: "📝", soon: true },
  { href: "/admin/feedback", label: "フィードバック", icon: "💬", soon: true },
  { href: "/admin/logs", label: "操作ログ", icon: "🗒", soon: true },
  { href: "/admin/ingresses", label: "Ingress", icon: "⚡" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-black/[0.08] bg-[var(--brand-surface)] p-4">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-primary)]">Admin</p>
        <p className="text-[10px] text-[var(--brand-text-muted)]">Aiment Dashboard</p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon, soon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          if (soon) {
            return (
              <span
                key={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--brand-text-muted)]/70"
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
                <span className="ml-auto rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] text-[var(--brand-text-muted)]">
                  準備中
                </span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--brand-primary)]/15 font-semibold text-[var(--brand-primary)]"
                  : "text-[var(--brand-text-muted)] hover:bg-black/[0.04] hover:text-[var(--brand-text)]"
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
