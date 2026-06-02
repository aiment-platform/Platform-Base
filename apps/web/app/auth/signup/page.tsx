"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/home/TopNav";
import { useI18n } from "../../lib/i18n";
import { useUserSession } from "../../lib/userSession";
import type { SignupInput, UserRole } from "../../lib/apiTypes";

const ROLE_CARDS: { role: UserRole; label: string; description: string }[] = [
  { role: "listener", label: "Listener", description: "視聴・予約・通知向け" },
  { role: "vtuber", label: "VTuber", description: "配信作成・管理" },
  {
    role: "supporter",
    label: "日本人サポーター",
    description: "VTuber×Aimerセッションの通訳・盛り上げ役",
  },
];

async function postJson<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as T & { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed");
  }
  if (!payload) throw new Error("Empty response");
  return payload;
}

function InputLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--brand-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full border border-[var(--brand-text-muted)]/70 bg-transparent px-3 text-sm text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-secondary)] ${props.className ?? ""}`}
    />
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.21-2.27H12v4.3h6.45a5.51 5.51 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.57-5.16 3.57-8.65Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.86-3A7.17 7.17 0 0 1 12 19.3a7.26 7.26 0 0 1-6.82-5.02H1.2v3.1A11.99 11.99 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.18 14.28A7.2 7.2 0 0 1 4.78 12c0-.79.14-1.56.4-2.28V6.62H1.2A12 12 0 0 0 0 12c0 1.94.46 3.78 1.2 5.38l3.98-3.1Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.15 15.24 0 12 0 7.34 0 3.31 2.67 1.2 6.62l3.98 3.1A7.26 7.26 0 0 1 12 4.77Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { tx } = useI18n();
  const { isAuthenticated, refreshSession } = useUserSession();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<UserRole>("listener");
  const [supporterGuidelinesAccepted, setSupporterGuidelinesAccepted] = useState(false);
  const [supporterMotivation, setSupporterMotivation] = useState("");
  const [supporterFavoriteVtuber, setSupporterFavoriteVtuber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("redirect");
    if (!raw) return null;
    const decoded = decodeURIComponent(raw);
    return decoded.startsWith("/") ? decoded : null;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/account");
    }
  }, [isAuthenticated, router]);


  if (isAuthenticated) return null;

  const goStep2 = () => {
    setError(null);
    if (!email.trim()) {
      setError(tx("メールアドレスを入力してください。", "Please enter your email address."));
      return;
    }
    if (!password.trim()) {
      setError(tx("パスワードを入力してください。", "Please enter your password."));
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      setError(tx("利用規約とプライバシーポリシーへの同意が必要です。", "You need to accept the Terms and Privacy Policy."));
      return;
    }
    setStep(2);
  };

  const goStep3 = () => {
    setError(null);
    if (!role) {
      setError(tx("アカウント種別を選択してください。", "Please choose an account type."));
      return;
    }
    setStep(3);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      goStep2();
      return;
    }

    if (step === 2) {
      goStep3();
      return;
    }

    if (!displayName.trim()) {
      setError(tx("ディスプレイネームを入力してください。", "Please enter your display name."));
      return;
    }
    if (role === "supporter" && !supporterGuidelinesAccepted) {
      setError("サポーターガイドラインへの同意が必要です。");
      return;
    }

    setSubmitting(true);
    try {
      const payload: SignupInput = {
        role,
        name: displayName,
        email,
        password,
        provider: "password",
        termsAccepted,
        privacyAccepted,
        bio: role === "supporter" && supporterMotivation.trim() ? supporterMotivation.trim() : undefined,
      };
      await postJson("/api/auth/signup", payload);
      await refreshSession();
      router.push(redirectTo ?? "/");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : tx("処理に失敗しました。", "The request failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    setError(null);
    if (!termsAccepted || !privacyAccepted) {
      setError(tx("利用規約とプライバシーポリシーへの同意が必要です。", "You need to accept the Terms and Privacy Policy."));
      return;
    }
    window.location.href = `/api/auth/google?role=${role}`;
  };


  return (
    <div className="min-h-screen bg-[var(--brand-bg-900)] text-[var(--brand-text)]">
      <TopNav />
      <main className="mx-auto max-w-2xl px-5 py-8 md:px-10 md:py-12">
        <section className="rounded-[28px] border border-white/10 bg-[var(--brand-surface)] p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-[0.02em]">{tx("サインアップ", "Sign up")}</h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              {step === 1
                ? tx("STEP 1/3: 認証情報と同意", "STEP 1/3: Credentials and consent")
                : step === 2
                  ? tx("STEP 2/3: アカウント種別", "STEP 2/3: Account type")
                  : tx("STEP 3/3: プロフィール", "STEP 3/3: Profile")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {step === 1 ? (
              <>
                <InputLabel label="User ID / Email">
                  <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </InputLabel>

                <InputLabel label="Password">
                  <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </InputLabel>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.015] p-4">
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                    <span>
                      <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-secondary)] underline-offset-2 hover:underline">{tx("利用規約", "Terms")}</Link>
                      {tx("に同意します", " accepted")}
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} />
                    <span>
                      <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-secondary)] underline-offset-2 hover:underline">{tx("プライバシーポリシー", "Privacy Policy")}</Link>
                      {tx("に同意します", " accepted")}
                    </span>
                  </label>
                </div>
              </>
            ) : step === 2 ? (
              <div className="grid gap-3">
                {ROLE_CARDS.map(({ role: r, label, description }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                      role === r
                        ? "border-[var(--brand-secondary)] bg-[color-mix(in_srgb,var(--brand-secondary)_10%,transparent)]"
                        : "border-white/10 bg-white/[0.015]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--brand-text)]">{label}</p>
                      {r === "supporter" && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                          日本語話者向け
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--brand-text-muted)]">{description}</p>
                    {r === "supporter" && (
                      <p className="mt-1.5 text-[11px] text-[var(--brand-text-muted)]">
                        ガイドライン同意・電話番号認証が必要 /{" "}
                        <a
                          href="/supporter-guidelines"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-purple-400 underline-offset-2 hover:underline"
                        >
                          規約を確認する →
                        </a>
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <InputLabel label="Display Name">
                  <TextInput value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </InputLabel>
                <p className="text-xs text-[var(--brand-text-muted)]">{tx("この表示名は配信枠やチャットに表示されます。", "This display name appears in stream sessions and chat.")}</p>

                {role === "supporter" && (
                  <div className="space-y-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <p className="text-xs font-semibold text-purple-300">サポーター追加情報</p>

                    <InputLabel label="応援しているVTuber（任意）">
                      <TextInput
                        placeholder="例：〇〇ちゃん"
                        value={supporterFavoriteVtuber}
                        onChange={(e) => setSupporterFavoriteVtuber(e.target.value)}
                      />
                    </InputLabel>

                    <InputLabel label="参加動機（任意）">
                      <textarea
                        placeholder="例：フィリピン人との交流を通じて英語を練習したい"
                        value={supporterMotivation}
                        onChange={(e) => setSupporterMotivation(e.target.value)}
                        rows={3}
                        className="w-full resize-none border border-[var(--brand-text-muted)]/70 bg-transparent px-3 py-2.5 text-sm text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-secondary)]"
                      />
                    </InputLabel>

                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={supporterGuidelinesAccepted}
                        onChange={(e) => setSupporterGuidelinesAccepted(e.target.checked)}
                        className="mt-0.5 shrink-0"
                      />
                      <span>
                        <Link
                          href="/supporter-guidelines"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--brand-secondary)] underline-offset-2 hover:underline"
                        >
                          サポーターガイドライン
                        </Link>
                        を読み、すべての内容に同意します
                        <span className="ml-1 text-red-400">*</span>
                      </span>
                    </label>

                    <div className="rounded-xl bg-white/5 px-3 py-2.5 text-xs text-[var(--brand-text-muted)]">
                      アカウント作成後、設定ページから電話番号の認証を完了してください。
                      電話番号認証が完了するまでスピーカー予約はできません。
                    </div>
                  </div>
                )}
              </>
            )}

            {error ? <p className="rounded-xl border border-[var(--brand-accent)]/50 bg-[var(--brand-accent)]/8 px-4 py-3 text-sm text-[var(--brand-accent)]">{error}</p> : null}

            {step === 1 ? (
              <div className="grid gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 rounded-xl bg-[var(--brand-secondary)] px-5 text-sm font-bold tracking-[0.08em] text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? "WORKING..." : tx("次へ", "Next")}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGoogleSignup}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 text-sm font-semibold tracking-[0.02em] text-[#202124] transition hover:bg-[#f8f9fa] disabled:opacity-50"
                >
                  <GoogleLogo />
                  {tx("Googleでサインアップ", "Sign up with Google")}
                </button>
              </div>
            ) : step === 2 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-11 rounded-xl bg-[var(--brand-bg-900)] px-5 text-sm font-bold tracking-[0.08em] text-[var(--brand-text)] transition hover:brightness-110"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 rounded-xl bg-[var(--brand-secondary)] px-5 text-sm font-bold tracking-[0.08em] text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? "WORKING..." : tx("次へ", "Next")}
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-11 rounded-xl bg-[var(--brand-bg-900)] px-5 text-sm font-bold tracking-[0.08em] text-[var(--brand-text)] transition hover:brightness-110"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 rounded-xl bg-[var(--brand-secondary)] px-5 text-sm font-bold tracking-[0.08em] text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? "WORKING..." : tx("アカウント作成", "Create account")}
                </button>
              </div>
            )}

            <p className="pt-1 text-sm text-[var(--brand-text-muted)]">
              {tx("すでにアカウントをお持ちですか？", "Already have an account?")}{" "}
              <Link href="/auth" className="font-semibold text-[var(--brand-secondary)] underline-offset-2 hover:underline">
                {tx("ログインへ", "Go to login")}
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
