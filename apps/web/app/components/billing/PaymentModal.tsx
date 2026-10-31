"use client";

// SOLID: S（決済UIの表示責任をAccountページから分離し、単一コンポーネントに集約）

export type PaymentModalProps = {
  clientSecret: string;
  title: string;
  onSuccess: () => void;
  onClose: () => void;
};

export function PaymentModal({ clientSecret, title, onSuccess, onClose }: PaymentModalProps) {
  const isMockPayment = clientSecret.startsWith("mock_");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ui-scrim p-4">
      <div className="ui-modal max-h-full w-full max-w-md overflow-y-auto p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-semibold text-[var(--brand-text)]">{title}</h2>
        {isMockPayment ? (
          <>
            <p className="rounded-xl bg-[var(--brand-bg-900)] px-4 py-3 text-sm leading-relaxed text-[var(--brand-text-muted)]">
              開発用のモック決済です。下のボタンで購入完了として進めます。
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onSuccess}
                className="ui-btn ui-btn-md ui-btn-primary flex-1"
              >
                完了にする
              </button>
              <button
                type="button"
                onClick={onClose}
                className="ui-btn ui-btn-md ui-btn-ghost"
              >
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="rounded-xl bg-[var(--brand-accent-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--brand-accent-ink)]">
              Stripe決済フォームを表示するには、ローカル依存関係の復元が必要です。
              <span className="mt-2 block break-all font-semibold text-[var(--brand-text)]">
                CI=true pnpm install --frozen-lockfile
              </span>
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="ui-btn ui-btn-md ui-btn-ghost"
              >
                閉じる
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
