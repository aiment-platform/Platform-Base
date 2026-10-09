// SOLID: S（メール送信責務に専念。SendGrid への依存をここに集約）
import sgMail from "@sendgrid/mail";

function getSendGridClient(): typeof sgMail | null {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) return null;
  sgMail.setApiKey(apiKey);
  return sgMail;
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL?.trim() ?? "noreply@aiment.jp";

const OPS_NOTIFY_ADDRESSES = ["kmc2427@kamiyama.ac.jp", "kmc2408@kamiyama.ac.jp"];

export async function sendTroubleshootingReport(opts: {
  reporterName: string;
  reporterEmail: string;
  sessionId: string;
  sessionTitle: string;
  note: string;
  diagnostics: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const client = getSendGridClient();
  const { reporterName, reporterEmail, sessionId, sessionTitle, note, diagnostics } = opts;
  const rows = Object.entries(diagnostics)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");

  if (!client) {
    console.info(`[mailer] Troubleshooting report from ${reporterName} <${reporterEmail}> for "${sessionTitle}"\n${rows}`);
    return;
  }

  const diagHtml = Object.entries(diagnostics)
    .map(
      ([k, v]) =>
        `<tr><td style="color:#9090a0;padding:6px 0;border-bottom:1px solid #1a1a2e;">${k}</td><td style="padding:6px 0;border-bottom:1px solid #1a1a2e;">${String(v)}</td></tr>`,
    )
    .join("");

  await Promise.all(
    OPS_NOTIFY_ADDRESSES.map((to) =>
      client.send({
        to,
        from: { email: FROM_EMAIL, name: "Aiment" },
        subject: `【Aiment】配信トラブル報告「${sessionTitle}」`,
        text: `配信者からトラブル報告が届きました。\n\n配信者: ${reporterName} <${reporterEmail}>\n枠: ${sessionTitle} (${sessionId})\n\n内容:\n${note || "(記載なし)"}\n\n--- 診断 ---\n${rows}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e8e8f0;border-radius:16px;">
            <h2 style="color:#a78bfa;margin-bottom:4px;">Aiment</h2>
            <p style="color:#9090a0;margin:0 0 20px;font-size:13px;">配信トラブル報告</p>
            <div style="background:#1a1a2e;border-radius:12px;padding:16px;margin-bottom:16px;">
              <p style="margin:0 0 4px;font-size:13px;color:#9090a0;">配信者</p>
              <p style="margin:0 0 12px;font-weight:bold;">${reporterName} &lt;${reporterEmail}&gt;</p>
              <p style="margin:0 0 4px;font-size:13px;color:#9090a0;">枠</p>
              <p style="margin:0;font-weight:bold;">${sessionTitle}</p>
            </div>
            <p style="margin:0 0 4px;font-size:13px;color:#9090a0;">内容</p>
            <p style="margin:0 0 16px;white-space:pre-wrap;">${note || "(記載なし)"}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#9090a0;">診断</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">${diagHtml}</table>
          </div>
        `,
      }),
    ),
  );
}

export async function sendEarlyAccessNotification(opts: {
  participantName: string;
  participantEmail: string;
}): Promise<void> {
  const client = getSendGridClient();
  const { participantName, participantEmail } = opts;

  if (!client) {
    console.info(`[mailer] Early access payment received: ${participantName} <${participantEmail}>`);
    return;
  }

  const notifyAddresses = ["kmc2427@kamiyama.ac.jp", "kmc2408@kamiyama.ac.jp"];
  await Promise.all(
    notifyAddresses.map((to) =>
      client.send({
        to,
        from: { email: FROM_EMAIL, name: "Aiment" },
        subject: "【Aiment】アーリーアクセス参加者の支払い完了",
        text: `アーリーアクセスへの支払いが完了しました。\n\n参加者名: ${participantName}\nメールアドレス: ${participantEmail}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e8e8f0;border-radius:16px;">
            <h2 style="color:#a78bfa;margin-bottom:8px;">Aiment</h2>
            <h3 style="margin-top:0;">アーリーアクセス参加者の支払い完了</h3>
            <table style="width:100%;border-collapse:collapse;margin:24px 0;">
              <tr><td style="color:#9090a0;padding:8px 0;border-bottom:1px solid #1a1a2e;">参加者名</td><td style="padding:8px 0;border-bottom:1px solid #1a1a2e;">${participantName}</td></tr>
              <tr><td style="color:#9090a0;padding:8px 0;">メールアドレス</td><td style="padding:8px 0;">${participantEmail}</td></tr>
            </table>
          </div>
        `,
      })
    )
  );
}

export async function sendSpeakerPaymentNotification(opts: {
  participantName: string;
  participantEmail: string;
  sessionTitle: string;
  sessionId: string;
  startsAt: Date;
}): Promise<void> {
  const client = getSendGridClient();
  const { participantName, participantEmail, sessionTitle, sessionId, startsAt } = opts;
  const joinUrl = `https://aiment.jp/join/${encodeURIComponent(sessionId)}`;
  const startStr = startsAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });

  if (!client) {
    console.info(`[mailer] Speaker payment received: ${participantName} <${participantEmail}> for "${sessionTitle}"`);
    return;
  }

  // 参加者本人への参加確定メール
  await client.send({
    to: participantEmail,
    from: { email: FROM_EMAIL, name: "Aiment" },
    subject: `【Aiment】スピーカー参加が確定しました「${sessionTitle}」`,
    text: `${participantName} 様\n\nスピーカー参加費のお支払いが完了し、参加が確定しました。\n\n配信枠: ${sessionTitle}\n開始日時（JST）: ${startStr}\n参加リンク: ${joinUrl}\n\n配信開始時刻になりましたら、上記リンクからご参加ください。\n\n— Aiment Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e8e8f0;border-radius:16px;">
        <h2 style="color:#a78bfa;margin-bottom:4px;">Aiment</h2>
        <p style="color:#9090a0;margin:0 0 24px;font-size:13px;">スピーカー参加確定</p>
        <h3 style="margin:0 0 8px;font-size:18px;">参加が確定しました 🎉</h3>
        <p style="color:#9090a0;margin:0 0 20px;">${participantName} 様、お支払いありがとうございます。スピーカーとしての参加が確定しました。</p>
        <div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#9090a0;">配信枠</p>
          <p style="margin:0 0 16px;font-weight:bold;font-size:16px;">${sessionTitle}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#9090a0;">開始日時（JST）</p>
          <p style="margin:0;font-size:15px;">${startStr}</p>
        </div>
        <a href="${joinUrl}" style="display:block;text-align:center;background:#7c3aed;color:#fff;text-decoration:none;border-radius:12px;padding:14px;font-weight:bold;font-size:15px;">参加ページを開く →</a>
        <p style="color:#9090a0;font-size:12px;margin-top:24px;text-align:center;">— Aiment Team</p>
      </div>
    `,
  });

  // 管理者への支払い通知（アーリーアクセスと同様）
  const notifyAddresses = ["kmc2427@kamiyama.ac.jp", "kmc2408@kamiyama.ac.jp"];
  await Promise.all(
    notifyAddresses.map((to) =>
      client.send({
        to,
        from: { email: FROM_EMAIL, name: "Aiment" },
        subject: "【Aiment】スピーカー参加費の支払い完了",
        text: `スピーカー参加費の支払いが完了しました。\n\n参加者名: ${participantName}\nメールアドレス: ${participantEmail}\n配信枠: ${sessionTitle}\n開始日時（JST）: ${startStr}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e8e8f0;border-radius:16px;">
            <h2 style="color:#a78bfa;margin-bottom:8px;">Aiment</h2>
            <h3 style="margin-top:0;">スピーカー参加費の支払い完了</h3>
            <table style="width:100%;border-collapse:collapse;margin:24px 0;">
              <tr><td style="color:#9090a0;padding:8px 0;border-bottom:1px solid #1a1a2e;">参加者名</td><td style="padding:8px 0;border-bottom:1px solid #1a1a2e;">${participantName}</td></tr>
              <tr><td style="color:#9090a0;padding:8px 0;border-bottom:1px solid #1a1a2e;">メールアドレス</td><td style="padding:8px 0;border-bottom:1px solid #1a1a2e;">${participantEmail}</td></tr>
              <tr><td style="color:#9090a0;padding:8px 0;border-bottom:1px solid #1a1a2e;">配信枠</td><td style="padding:8px 0;border-bottom:1px solid #1a1a2e;">${sessionTitle}</td></tr>
              <tr><td style="color:#9090a0;padding:8px 0;">開始日時（JST）</td><td style="padding:8px 0;">${startStr}</td></tr>
            </table>
          </div>
        `,
      })
    )
  );
}

export async function sendStreamReminder(opts: {
  to: string;
  userName: string;
  sessionTitle: string;
  sessionId: string;
  startsAt: Date;
  isPaid: boolean;
}): Promise<void> {
  const { to, userName, sessionTitle, sessionId, startsAt, isPaid } = opts;
  const client = getSendGridClient();
  const joinUrl = `https://aiment.jp/join/${encodeURIComponent(sessionId)}`;
  const startStr = startsAt.toLocaleString("en-US", { timeZone: "Asia/Tokyo", hour12: false });

  const paymentWarning = isPaid
    ? ""
    : `\n\n⚠️ Payment required: Your speaker reservation is not yet paid. You will NOT be able to enter the session without completing payment. Please visit the link below and pay before the stream starts.\n${joinUrl}`;

  const paymentWarningHtml = isPaid
    ? ""
    : `
      <div style="background:#2a1a2e;border:1px solid #7c3aed;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="color:#f472b6;font-weight:bold;margin:0 0 8px;">⚠️ Payment Required</p>
        <p style="color:#e8e8f0;margin:0;font-size:14px;">Your speaker reservation is <strong>not yet paid</strong>. You will <strong>not be able to enter</strong> the session without completing payment. Please pay before the stream starts.</p>
        <a href="${joinUrl}" style="display:inline-block;margin-top:12px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;padding:10px 20px;font-weight:bold;">Pay now →</a>
      </div>`;

  if (!client) {
    console.info(`[mailer] Stream reminder for ${to}: "${sessionTitle}" starts at ${startStr}${paymentWarning}`);
    return;
  }

  await client.send({
    to,
    from: { email: FROM_EMAIL, name: "Aiment" },
    subject: `[Aiment] "${sessionTitle}" starts in 3 hours!`,
    text: `Hi ${userName},\n\nYour reserved session is starting in 3 hours!\n\nSession: ${sessionTitle}\nStarts: ${startStr} (JST)\nJoin: ${joinUrl}${paymentWarning}\n\n— Aiment Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e8e8f0;border-radius:16px;">
        <h2 style="color:#a78bfa;margin-bottom:4px;">Aiment</h2>
        <p style="color:#9090a0;margin:0 0 24px;font-size:13px;">Stream Reminder</p>
        <h3 style="margin:0 0 8px;font-size:18px;">Your session starts in 3 hours!</h3>
        <p style="color:#9090a0;margin:0 0 20px;">Hi ${userName}, get ready — the stream is almost here.</p>
        <div style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#9090a0;">Session</p>
          <p style="margin:0 0 16px;font-weight:bold;font-size:16px;">${sessionTitle}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#9090a0;">Starts at (JST)</p>
          <p style="margin:0;font-size:15px;">${startStr}</p>
        </div>
        ${paymentWarningHtml}
        <a href="${joinUrl}" style="display:block;text-align:center;background:#7c3aed;color:#fff;text-decoration:none;border-radius:12px;padding:14px;font-weight:bold;font-size:15px;">Join the session →</a>
        <p style="color:#9090a0;font-size:12px;margin-top:24px;text-align:center;">— Aiment Team</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const client = getSendGridClient();
  if (!client) {
    console.info(`[mailer] SENDGRID_API_KEY not set. Verification code for ${to}: ${code}`);
    return;
  }

  await client.send({
    to,
    from: { email: FROM_EMAIL, name: "Aiment" },
    subject: "【Aiment】メールアドレスの確認コード",
    text: `確認コード: ${code}\n\nこのコードは10分間有効です。\n身に覚えのない場合は無視してください。`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f14;color:#e8e8f0;border-radius:16px;">
        <h2 style="color:#a78bfa;margin-bottom:8px;">Aiment</h2>
        <h3 style="margin-top:0;">メールアドレスの確認</h3>
        <p style="color:#9090a0;">以下の確認コードを入力してください。</p>
        <div style="background:#1a1a2e;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#a78bfa;">${code}</span>
        </div>
        <p style="color:#9090a0;font-size:13px;">このコードは10分間有効です。<br>身に覚えのない場合は無視してください。</p>
      </div>
    `,
  });
}
