import { test, expect, request } from "@playwright/test";
import { signup, createSession } from "./helpers";

// Phase 4: ingress(回線)エンドポイントの権限ゲートを検証する。
// 実LiveKitはテスト環境に無いため、ホスト/ロール検証までを確認する
// （LiveKit作成段階に到達すると設定不足で400になる）。
test.describe("livekit ingress gating", () => {
  test("listener cannot create/swap ingress (VTuber only)", async ({ baseURL }) => {
    const vtuberApi = await request.newContext({ baseURL });
    await signup(vtuberApi, { role: "vtuber" });
    const session = await createSession(vtuberApi);
    await vtuberApi.dispose();

    const listenerApi = await request.newContext({ baseURL });
    await signup(listenerApi, { role: "listener" });
    const res = await listenerApi.post("/api/livekit/ingress", {
      data: { sessionId: session.sessionId, swap: true },
    });
    expect(res.status()).toBe(403);
    await listenerApi.dispose();
  });

  test("non-host vtuber cannot create ingress for another's session", async ({ baseURL }) => {
    const ownerApi = await request.newContext({ baseURL });
    await signup(ownerApi, { role: "vtuber" });
    const session = await createSession(ownerApi);
    await ownerApi.dispose();

    const otherApi = await request.newContext({ baseURL });
    await signup(otherApi, { role: "vtuber" });
    const res = await otherApi.post("/api/livekit/ingress", {
      data: { sessionId: session.sessionId },
    });
    expect(res.status()).toBe(403);
    await otherApi.dispose();
  });

  test("host passes gating and reaches the LiveKit step (400, not 403)", async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    await signup(api, { role: "vtuber" });
    const session = await createSession(api);
    const res = await api.post("/api/livekit/ingress", {
      data: { sessionId: session.sessionId, swap: true },
    });
    // ホスト/ロール検証は通過。LiveKit作成段階（ダミーURLへの接続）で失敗し 400。
    // 重要なのは権限エラー(403)ではないこと＝ゲートを通過していること。
    expect(res.status()).toBe(400);
    await api.dispose();
  });
});
