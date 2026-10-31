"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "../components/home/TopNav";
import { useI18n } from "../lib/i18n";
import { useUserSession } from "../lib/userSession";
import type { LoginInput } from "../lib/apiTypes";

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
      {/* 昔の暗いテーマの名残（英字の大文字＋字間）をやめ、ほかの入力欄の見出し（FieldLabel）とそろえる */}
      <span className="block text-xs font-bold text-[var(--brand-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      // 文字は 16px。これより小さいと、iPhone は入力欄に触れたときに画面を拡大してしまう
      className={`h-11 w-full rounded-lg border-0 bg-[var(--brand-bg-900)] px-3 text-base text-[var(--brand-text)] outline-none transition focus:ring-2 focus:ring-[var(--brand-primary)]/40 ${props.className ?? ""}`}
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

export default function AuthPage() {
  const router = useRouter();
  const { tx } = useI18n();
  const { isAuthenticated, refreshSession } = useUserSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) setError(decodeURIComponent(oauthError));
  }, []);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
        <TopNav />
        {/* 昔の暗いテーマの「Account Protocol / READY / ACCOUNT」の飾りをやめ、ふつうのパネルにする */}
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:px-10 md:pt-12 lg:pb-12">
          <section className="ui-panel grid gap-4 p-5 text-center sm:p-7">
            <h1 className="text-2xl font-black text-[var(--brand-text)]">{tx("ログインしています", "You're logged in")}</h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--brand-text-muted)]">
              {tx("すでにログインしています。アカウント管理からプロフィール、認証、配信権限を確認してください。", "You are already logged in. Check your profile, verification, and streaming permissions from account settings.")}
            </p>
            <Link href="/account" className="ui-btn ui-btn-md ui-btn-primary mx-auto w-full sm:w-auto">
              {tx("アカウント設定へ", "Account settings")}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: LoginInput = {
        email,
        password,
        provider: "password",
      };
      await postJson("/api/auth/login", payload);
      await refreshSession();
      router.push(redirectTo ?? "/account");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : tx("処理に失敗しました。", "The request failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = () => {
    setError(null);
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />

      {/* 下の余白は、スマホの下固定ナビに最後の行が隠れないように */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:px-10 md:pt-12 lg:pb-12">
        <section className="ui-panel p-5 sm:p-7">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-black">{tx("ログイン", "Log in")}</h1>
              <p className="mt-1 text-sm text-[var(--brand-text-muted)]">{tx("登録済みアカウントでログインします", "Log in with an existing account")}</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <InputLabel label={tx("メールアドレス", "Email")}>
                <TextInput type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </InputLabel>

              <InputLabel label={tx("パスワード", "Password")}>
                <TextInput type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </InputLabel>

              {error ? <p className="rounded-xl border border-[var(--brand-accent)]/50 bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{error}</p> : null}

              {/* 入力のすぐ下に、入力した内容で進むボタンを置く。Google は別の道なので下に（サインアップと同じ並び） */}
              <div className="grid gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn ui-btn-md ui-btn-primary"
                >
                  {submitting ? tx("ログイン中…", "Logging in…") : tx("ログイン", "Log in")}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGoogle}
                  className="ui-btn ui-btn-md ui-btn-ghost gap-2"
                >
                  <GoogleLogo />
                  {tx("Googleでログイン", "Continue with Google")}
                </button>
              </div>

              <p className="pt-1 text-sm text-[var(--brand-text-muted)]">
                {tx("アカウントを持っていませんか？", "Don't have an account?")}{" "}
                <Link href="/auth/signup" className="font-semibold text-[var(--brand-primary-ink)] underline-offset-2 hover:underline">
                  {tx("アカウントを新規作成", "Create an account")}
                </Link>
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
