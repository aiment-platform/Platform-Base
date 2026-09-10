import Link from "next/link";

const CARDS = [
  {
    href: "/admin/reservations",
    icon: "📋",
    title: "予約者一覧",
    desc: "セッションIDで予約者を検索。スピーカー・リスナー・キャンセル済みを確認できます。",
  },
  {
    href: "/admin/supporter-lottery",
    icon: "🎲",
    title: "サポーター抽選",
    desc: "申請者の視聴時間を加味した重み付き抽選を実行。当選者・落選者を確定します。",
  },
  {
    href: "/admin/ingresses",
    icon: "📡",
    title: "Ingress 管理",
    desc: "LiveKit Ingress（OBSなどの配信キー）の一覧と削除。",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold">ダッシュボード</h1>
      <p className="mb-8 text-sm text-[var(--brand-text-muted)]">管理者メニュー</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-black/[0.03] p-5 transition-colors hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/10"
          >
            <span className="text-2xl leading-none">{icon}</span>
            <div>
              <p className="font-semibold group-hover:text-[var(--brand-primary)]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--brand-text-muted)]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
