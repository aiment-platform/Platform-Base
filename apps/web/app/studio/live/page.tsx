import Link from "next/link";

export default function StudioLiveIndexPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-16 text-[var(--brand-text)]">
      <div className="mx-auto max-w-xl rounded-2xl bg-[var(--brand-surface)] p-6 text-center">
        <h1 className="text-2xl font-bold">配信枠を選択してください</h1>
        <p className="mt-2 text-sm text-[var(--brand-text-muted)]">先に Pre-Live で枠を作成すると Live Studio に遷移できます。</p>
        <Link href="/studio/pre-live" className="ui-btn ui-btn-sm ui-btn-primary mt-4">
          枠を作成する
        </Link>
      </div>
    </main>
  );
}
