"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/home/TopNav";
import { useI18n, type TxMore } from "../../lib/i18n";
import { useUserSession } from "../../lib/userSession";
import type { SignupInput, UserRole } from "../../lib/apiTypes";

// 英語を選んでいる人にも読めるよう、日英の両方を持たせる
const ROLE_CARDS: { role: UserRole; label: [string, string, TxMore]; description: [string, string, TxMore] }[] = [
  { role: "listener", label: ["リスナー", "Listener", { tw: "聽眾", ko: "리스너" }], description: ["視聴・予約・通知向け", "Watch, reserve, and get notified", { tw: "觀看直播、預約、接收通知", ko: "시청·예약·알림용" }] },
  { role: "vtuber", label: ["VTuber", "VTuber", { tw: "VTuber", ko: "VTuber" }], description: ["配信作成・管理", "Create and manage streams", { tw: "建立與管理直播", ko: "방송 생성·관리" }] },
  {
    role: "supporter",
    label: ["日本人メイト", "Japanese Mate", { tw: "日本夥伴", ko: "일본인 메이트" }],
    description: ["VTuber×Aimerセッションの通訳・盛り上げ役", "Help VTuber × Aimer sessions as an interpreter and hype person", { tw: "在 VTuber × Aimer 場次中擔任口譯與炒熱氣氛的角色", ko: "VTuber × Aimer 세션의 통역 및 분위기 메이커" }],
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

async function checkEmailAvailability(email: string) {
  return postJson<{ available: boolean }>("/api/auth/email-availability", { email });
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

  const goStep2 = async () => {
    setError(null);
    if (!email.trim()) {
      setError(tx("メールアドレスを入力してください。", "Please enter your email address.", { tw: "請輸入電子郵件。", ko: "이메일을 입력해 주세요." }));
      return;
    }
    if (!password.trim()) {
      setError(tx("パスワードを入力してください。", "Please enter your password.", { tw: "請輸入密碼。", ko: "비밀번호를 입력해 주세요." }));
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      setError(tx("利用規約とプライバシーポリシーへの同意が必要です。", "You need to accept the Terms and Privacy Policy.", { tw: "請同意服務條款與隱私權政策。", ko: "이용약관과 개인정보 처리방침에 동의해 주세요." }));
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkEmailAvailability(email.trim());
      if (!result.available) {
        setError(tx("このメールアドレスはすでに使われています。", "This email address is already in use.", { tw: "這個電子郵件已被使用。", ko: "이미 사용 중인 이메일이에요." }));
        return;
      }
      setStep(2);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : tx("メールアドレスの確認に失敗しました。", "Failed to check this email address.", { tw: "無法確認電子郵件，請再試一次。", ko: "이메일을 확인하지 못했어요." }));
    } finally {
      setSubmitting(false);
    }
  };

  const goStep3 = () => {
    setError(null);
    if (!role) {
      setError(tx("アカウント種別を選択してください。", "Please choose an account type.", { tw: "請選擇帳號類型。", ko: "계정 유형을 선택해 주세요." }));
      return;
    }
    setStep(3);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      void goStep2();
      return;
    }

    if (step === 2) {
      goStep3();
      return;
    }

    if (!displayName.trim()) {
      setError(tx("ディスプレイネームを入力してください。", "Please enter your display name.", { tw: "請輸入顯示名稱。", ko: "표시 이름을 입력해 주세요." }));
      return;
    }
    if (role === "supporter" && !supporterGuidelinesAccepted) {
      setError("メイトガイドラインへの同意が必要です。");
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
      setError(caughtError instanceof Error ? caughtError.message : tx("処理に失敗しました。", "The request failed.", { tw: "處理失敗，請再試一次。", ko: "요청을 처리하지 못했어요." }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    setError(null);
    if (!termsAccepted || !privacyAccepted) {
      setError(tx("利用規約とプライバシーポリシーへの同意が必要です。", "You need to accept the Terms and Privacy Policy.", { tw: "請同意服務條款與隱私權政策。", ko: "이용약관과 개인정보 처리방침에 동의해 주세요." }));
      return;
    }
    window.location.href = `/api/auth/google?role=${role}`;
  };


  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav />
      {/* 下の余白は、スマホの下固定ナビに最後の行が隠れないように */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:px-10 md:pt-12 lg:pb-12">
        <section className="ui-panel p-5 sm:p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-black">{tx("サインアップ", "Sign up", { tw: "註冊", ko: "회원가입" })}</h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              {step === 1
                ? tx("STEP 1/3: 認証情報と同意", "STEP 1/3: Credentials and consent", { tw: "STEP 1/3：登入資訊與同意事項", ko: "STEP 1/3: 로그인 정보 및 동의" })
                : step === 2
                  ? tx("STEP 2/3: アカウント種別", "STEP 2/3: Account type", { tw: "STEP 2/3：帳號類型", ko: "STEP 2/3: 계정 유형" })
                  : tx("STEP 3/3: プロフィール", "STEP 3/3: Profile", { tw: "STEP 3/3：個人資料", ko: "STEP 3/3: 프로필" })}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {step === 1 ? (
              <>
                <InputLabel label={tx("メールアドレス", "Email", { tw: "電子郵件", ko: "이메일" })}>
                  <TextInput type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </InputLabel>

                <InputLabel label={tx("パスワード", "Password", { tw: "密碼", ko: "비밀번호" })}>
                  <TextInput type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </InputLabel>

                {/* 同意の行は、指で押しやすいよう行全体を高さ 40px 以上の押せる範囲にし、チェック欄も大きめにする */}
                <div className="grid gap-1">
                  <label className="flex min-h-10 items-center gap-3 text-sm">
                    <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--brand-primary)]" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                    <span>
                      <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary-ink)] underline-offset-2 hover:underline">{tx("利用規約", "Terms", { tw: "服務條款", ko: "이용약관" })}</Link>
                      {tx("に同意します", " accepted", { tw: "，我同意", ko: "에 동의합니다" })}
                    </span>
                  </label>
                  <label className="flex min-h-10 items-center gap-3 text-sm">
                    <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--brand-primary)]" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} />
                    <span>
                      <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary-ink)] underline-offset-2 hover:underline">{tx("プライバシーポリシー", "Privacy Policy", { tw: "隱私權政策", ko: "개인정보 처리방침" })}</Link>
                      {tx("に同意します", " accepted", { tw: "，我同意", ko: "에 동의합니다" })}
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
                    aria-pressed={role === r}
                    // 選んでいないカードも、薄紫の縁で「押せる面」と分かるようにする（前は白地に白でほぼ見えなかった）
                    className={`rounded-2xl border-2 px-4 py-3.5 text-left transition ${
                      role === r
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                        : "border-[var(--line)] bg-[var(--brand-surface)] hover:border-[var(--brand-primary)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--brand-text)]">{tx(label[0], label[1], label[2])}</p>
                      {r === "supporter" && (
                        <span className="rounded-full bg-[var(--brand-primary-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-primary-ink)]">
                          {tx("日本語話者向け", "For Japanese speakers", { tw: "適合日語母語者", ko: "일본어 사용자용" })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--brand-text-muted)]">{tx(description[0], description[1], description[2])}</p>
                    {r === "supporter" && (
                      <p className="mt-1.5 text-[11px] text-[var(--brand-text-muted)]">
                        {tx("ガイドライン同意・電話番号認証が必要", "Requires accepting the guidelines and phone verification", { tw: "需同意規範並完成手機號碼驗證", ko: "가이드라인 동의 및 휴대폰 인증 필요" })} /{" "}
                        <a
                          href="/supporter-guidelines"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[var(--brand-primary-ink)] underline-offset-2 hover:underline"
                        >
                          {tx("規約を確認する →", "Read the guidelines →", { tw: "查看規範 →", ko: "가이드라인 보기 →" })}
                        </a>
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <InputLabel label={tx("表示名", "Display name", { tw: "顯示名稱", ko: "표시 이름" })}>
                  <TextInput autoComplete="nickname" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </InputLabel>
                <p className="text-xs text-[var(--brand-text-muted)]">{tx("この表示名は配信枠やチャットに表示されます。", "This display name appears in stream sessions and chat.", { tw: "這個名稱會顯示在直播場次和聊天室中。", ko: "이 이름은 방송 세션과 채팅에 표시돼요." })}</p>

                {role === "supporter" && (
                  <div className="space-y-4 rounded-2xl border border-transparent bg-[var(--brand-primary-soft)] p-4">
                    <p className="text-xs font-semibold text-[var(--brand-primary-ink)]">メイト追加情報</p>

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
                        className="w-full resize-none rounded-lg border-0 bg-[var(--brand-bg-900)] px-3 py-2.5 text-base text-[var(--brand-text)] outline-none transition focus:ring-2 focus:ring-[var(--brand-primary)]/40"
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
                          className="text-[var(--brand-primary-ink)] underline-offset-2 hover:underline"
                        >
                          メイトガイドライン
                        </Link>
                        を読み、すべての内容に同意します
                        <span className="ml-1 text-[var(--brand-accent-ink)]">*</span>
                      </span>
                    </label>

                    <div className="rounded-xl bg-[var(--brand-surface)] px-3 py-2.5 text-xs text-[var(--brand-text-muted)]">
                      アカウント作成後、設定ページから電話番号の認証を完了してください。
                      電話番号認証が完了するまでスピーカー予約はできません。
                    </div>
                  </div>
                )}
              </>
            )}

            {error ? <p className="rounded-xl border border-[var(--brand-accent)]/50 bg-[var(--brand-accent-soft)] px-4 py-3 text-sm text-[var(--brand-accent-ink)]">{error}</p> : null}

            {step === 1 ? (
              <div className="grid gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn ui-btn-md ui-btn-primary"
                >
                  {submitting ? tx("確認中…", "Checking…", { tw: "確認中…", ko: "확인 중…" }) : tx("次へ", "Next", { tw: "下一步", ko: "다음" })}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGoogleSignup}
                  className="ui-btn ui-btn-md ui-btn-ghost gap-2"
                >
                  <GoogleLogo />
                  {tx("Googleでサインアップ", "Sign up with Google", { tw: "使用 Google 註冊", ko: "Google로 가입하기" })}
                </button>
              </div>
            ) : step === 2 ? (
              // 「戻る」は小さく左、「次へ」を広く右に。スマホでも縦に積まず1行に並べる（進むボタンが先に目に入るように）
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ui-btn ui-btn-md ui-btn-ghost px-5"
                >
                  {tx("戻る", "Back", { tw: "返回", ko: "뒤로" })}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn ui-btn-md ui-btn-primary"
                >
                  {submitting ? tx("確認中…", "Checking…", { tw: "確認中…", ko: "확인 중…" }) : tx("次へ", "Next", { tw: "下一步", ko: "다음" })}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="ui-btn ui-btn-md ui-btn-ghost px-5"
                >
                  {tx("戻る", "Back", { tw: "返回", ko: "뒤로" })}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn ui-btn-md ui-btn-primary"
                >
                  {submitting ? tx("作成中…", "Creating…", { tw: "建立中…", ko: "생성 중…" }) : tx("アカウント作成", "Create account", { tw: "建立帳號", ko: "계정 만들기" })}
                </button>
              </div>
            )}

            <p className="pt-1 text-sm text-[var(--brand-text-muted)]">
              {tx("すでにアカウントをお持ちですか？", "Already have an account?", { tw: "已經有帳號了嗎？", ko: "이미 계정이 있으신가요?" })}{" "}
              <Link href="/auth" className="font-semibold text-[var(--brand-primary-ink)] underline-offset-2 hover:underline">
                {tx("ログインへ", "Go to login", { tw: "前往登入", ko: "로그인하기" })}
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
