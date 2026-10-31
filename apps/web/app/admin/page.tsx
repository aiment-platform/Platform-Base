import Link from "next/link";
import { ClipboardDocumentListIcon, GiftIcon, SignalIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

const CARDS = [
  {
    href: "/admin/sessions",
    icon: VideoCameraIcon,
    title: "セッション管理",
    desc: "全VTuberの配信枠を一覧。終了し忘れた配信の強制終了や、不要な枠の削除ができます。",
  },
  {
    href: "/admin/reservations",
    icon: ClipboardDocumentListIcon,
    title: "予約者一覧",
    desc: "セッションIDで予約者を検索。スピーカー・リスナー・キャンセル済みを確認できます。",
  },
  {
    href: "/admin/supporter-lottery",
    icon: GiftIcon,
    title: "サポーター抽選",
    desc: "申請者の視聴時間を加味した重み付き抽選を実行。当選者・落選者を確定します。",
  },
  {
    href: "/admin/ingresses",
    icon: SignalIcon,
    title: "Ingress 管理",
    desc: "LiveKit Ingress（OBSなどの配信キー）の一覧と削除。",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="px-4 py-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-bold">ダッシュボード</h1>
      <p className="mb-8 text-sm text-[var(--brand-text-muted)]">管理者メニュー</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="ui-panel group flex flex-col gap-3 p-5 transition-colors hover:bg-[var(--brand-primary-soft)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold group-hover:text-[var(--brand-primary-ink)]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--brand-text-muted)]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
