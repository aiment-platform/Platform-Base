"use client";

import Link from "next/link";
import { useI18n } from "../../lib/i18n";

type ChannelMenuProps = {
  basePath: string;
  active: "overview" | "schedule";
};

export function ChannelMenu({ basePath, active }: ChannelMenuProps) {
  const { tx } = useI18n();

  const items = [
    { key: "overview", href: basePath, label: tx("概要", "Overview") },
    { key: "schedule", href: `${basePath}/schedule`, label: tx("スケジュール", "Schedule") },
  ] as const;

  // 下線のタブ。選択中だけ紫の線と濃い文字
  return (
    <nav className="mt-4 flex gap-6">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={`border-b-[3px] pb-3 pt-2 text-sm font-bold transition-colors ${
            active === item.key
              ? "border-[var(--brand-primary)] text-[var(--brand-text)]"
              : "border-transparent text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
