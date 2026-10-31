// SOLID: S（このページは現在無効。決済導線は廃止済み）
// アーリーアクセスの支払いは終了したため、このページは無効化している。
// 決済導線（フォーム / Stripe Elements / API 呼び出し）は意図的に削除済み。
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";

export default function EarlyAccessPaymentPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="ui-panel w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-surface-soft)]">
          <LockClosedIcon className="h-8 w-8 text-[var(--brand-text-muted)]" aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--brand-text)]">
          このページは現在ご利用いただけません
        </h1>
        <p className="mb-1 text-sm text-[var(--brand-text-muted)]">
          アーリーアクセスのお支払いは終了しました。
        </p>
        <p className="mb-6 text-sm text-[var(--brand-text-muted)]">
          Early access payment is no longer available.
        </p>
        <Link
          href="/"
          className="ui-btn ui-btn-md ui-btn-primary"
        >
          トップへ戻る / Back to home
        </Link>
      </div>
    </main>
  );
}
