"use client";

// SOLID: S（メール認証UIに専念）
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

const CODE_LENGTH = 6;

type Props = {
  email: string;
  onSuccess: () => void;
  onClose: () => void;
  isDev?: boolean;
};

export function EmailVerifyModal({ email, onSuccess, onClose, isDev }: Props) {
  const [sent, setSent] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (sent) inputRefs.current[0]?.focus();
  }, [sent]);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/verify/email/request", { method: "POST" });
      const payload = (await res.json().catch(() => null)) as { devCode?: string; error?: string } | null;
      if (!res.ok) throw new Error(payload?.error ?? "送信に失敗しました。");
      if (isDev && payload?.devCode) setDevCode(payload.devCode);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (pasted.length === CODE_LENGTH) {
      setDigits(pasted.split(""));
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("6桁のコードを入力してください。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/verify/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(payload?.error ?? "認証に失敗しました。");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    // 画面が低い（横向き・キーボード表示中）ときは中身をスクロールできるように max-h を付ける
    <div className="fixed inset-0 z-50 flex items-center justify-center ui-scrim p-4">
      <div className="ui-modal max-h-full w-full max-w-sm overflow-y-auto p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-[var(--brand-text)]">メールアドレスの認証</h2>
        <p className="mb-5 text-xs text-[var(--brand-text-muted)]">
          {email} に確認コードを送信します。
        </p>

        {!sent ? (
          <>
            {error ? <p className="mb-3 text-sm text-[var(--brand-accent-ink)]">{error}</p> : null}
            <div className="flex justify-between gap-2">
              <button type="button" onClick={onClose} className="ui-btn ui-btn-md ui-btn-ghost">
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={loading}
                className="ui-btn ui-btn-md ui-btn-primary"
              >
                {loading ? "送信中..." : "コードを送信"}
              </button>
            </div>
          </>
        ) : (
          <>
            {isDev && devCode ? (
              <p className="mb-3 rounded-lg bg-[var(--brand-warning-soft)] px-3 py-2 text-xs text-[var(--brand-warning-ink)]">
                開発用コード: <strong>{devCode}</strong>
              </p>
            ) : null}

            <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`${i + 1}桁目`}
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="h-12 w-0 max-w-11 flex-1 rounded-xl bg-[var(--brand-bg-900)] text-center text-lg font-bold text-[var(--brand-text)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              ))}
            </div>

            {error ? <p className="mt-3 text-center text-sm text-[var(--brand-accent-ink)]">{error}</p> : null}

            <div className="mt-6 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => { setSent(false); setDigits(Array(CODE_LENGTH).fill("")); setError(null); }}
                className="ui-btn ui-btn-md ui-btn-ghost"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={loading || digits.join("").length < CODE_LENGTH}
                className="ui-btn ui-btn-md ui-btn-primary"
              >
                {loading ? "確認中..." : "認証する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
