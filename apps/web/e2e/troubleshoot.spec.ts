import { test, expect, request } from "@playwright/test";
import { signup, createSession } from "./helpers";

// Phase 5: トラブル報告APIの認証ゲートと送信成功を検証する。
// メールは SENDGRID 未設定のため console フォールバック（送信自体は成功扱い）。
test.describe("troubleshooting report", () => {
  test("requires authentication", async ({ baseURL }) => {
    const anon = await request.newContext({ baseURL });
    const res = await anon.post("/api/monitoring/report", {
      data: { sessionId: "whatever", note: "x", diagnostics: {} },
    });
    expect(res.status()).toBe(401);
    await anon.dispose();
  });

  test("authenticated host can submit a diagnostics report", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    await signup(api, { role: "vtuber" });
    const session = await createSession(api);
    const res = await api.post("/api/monitoring/report", {
      data: {
        sessionId: session.sessionId,
        note: "音声が二重になる",
        diagnostics: { online: true, connectionStatus: "live", obsConnected: false, micPublishing: true },
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
    await api.dispose();
  });

  test("rejects missing sessionId", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    await signup(api, { role: "vtuber" });
    const res = await api.post("/api/monitoring/report", { data: { note: "x" } });
    expect(res.status()).toBe(400);
    await api.dispose();
  });
});
