import { test, expect, request } from "@playwright/test";
import { signup, createSession, reserve, startSession, requestToken } from "./helpers";
import { SPEAKER_FEE_ENABLED } from "../lib/speakerFee";

// アカウント作成 → 枠作成 → ラーナー予約 → 配信開始 → 入室 → 終了 の一連の流れ。
// 実際の映像・音声(LiveKit接続)はダミー設定のため対象外。入室トークンの発行までを検証する。
test.describe("broadcast flow", () => {
  test("vtuber creates a session, learner reserves and joins, vtuber ends it", async ({ baseURL }) => {
    const host = await request.newContext({ baseURL });
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    const sessionId = session.sessionId as string;

    const learner = await request.newContext({ baseURL });
    await signup(learner, { role: "listener" });
    expect((await reserve(learner, sessionId, "speaker")).status()).toBe(201);

    const status = await learner.get(`/api/stream-sessions/${encodeURIComponent(sessionId)}/reservations`);
    expect(status.ok()).toBeTruthy();
    const reservation = (await status.json()) as { hasSpeakerReservation: boolean; hasPaidSpeakerReservation: boolean };
    expect(reservation.hasSpeakerReservation).toBe(true);
    // 参加費が無料の間は、予約しただけで支払い済み扱いになり入室できる
    expect(reservation.hasPaidSpeakerReservation).toBe(!SPEAKER_FEE_ENABLED);

    // 配信開始前は入室できない
    expect((await requestToken(learner, sessionId, "speaker")).status()).toBe(403);

    expect((await startSession(host, sessionId)).ok()).toBeTruthy();
    const hostToken = await requestToken(host, sessionId, "vtuber");
    expect(hostToken.ok(), await hostToken.text()).toBeTruthy();

    const learnerToken = await requestToken(learner, sessionId, "speaker");
    expect(learnerToken.ok(), await learnerToken.text()).toBeTruthy();
    expect(((await learnerToken.json()) as { token?: string }).token).toBeTruthy();

    // 予約のない視聴者も無料枠なら視聴できる
    const viewer = await request.newContext({ baseURL });
    expect((await requestToken(viewer, sessionId, "listener")).ok()).toBeTruthy();

    const end = await host.post(`/api/stream-sessions/${encodeURIComponent(sessionId)}/end`);
    expect(end.ok(), await end.text()).toBeTruthy();
    expect((await requestToken(learner, sessionId, "speaker")).status()).toBe(403);

    await Promise.all([host.dispose(), learner.dispose(), viewer.dispose()]);
  });

  test("speaker fee checkout is closed while participation is free", async ({ baseURL }) => {
    test.skip(SPEAKER_FEE_ENABLED, "参加費が有料のときは決済フローを使う");
    const host = await request.newContext({ baseURL });
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);

    const learner = await request.newContext({ baseURL });
    await signup(learner, { role: "listener" });
    const res = await learner.post("/api/billing/speaker-session", { data: { sessionId: session.sessionId } });
    expect(res.status()).toBe(400);

    await Promise.all([host.dispose(), learner.dispose()]);
  });
});
