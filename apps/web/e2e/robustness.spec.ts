import { test, expect, request } from "@playwright/test";
import { signup, createSession, reserve, startSession, requestToken } from "./helpers";

async function ctx(baseURL: string) {
  return request.newContext({ baseURL });
}

test.describe("reservation robustness", () => {
  test("speaker slots are capped and double-booking is prevented", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host, { speakerSlotsTotal: 1 });
    await host.dispose();

    // userA reserves the only speaker slot
    const a = await ctx(baseURL!);
    await signup(a, { role: "listener" });
    const r1 = await reserve(a, session.sessionId as string, "speaker");
    expect(r1.status()).toBe(201);

    // userA cannot double-book
    const r2 = await reserve(a, session.sessionId as string, "speaker");
    expect(r2.status()).toBe(403);
    expect((await r2.json()).error).toContain("already have");
    await a.dispose();

    // userB cannot reserve — no slots left
    const b = await ctx(baseURL!);
    await signup(b, { role: "listener" });
    const r3 = await reserve(b, session.sessionId as string, "speaker");
    expect(r3.status()).toBe(403);
    expect((await r3.json()).error).toContain("slots left");
    await b.dispose();
  });

  test("speaker reservations stop exactly at the slot cap", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host, { speakerSlotsTotal: 2 });
    await host.dispose();

    // 3人が順に予約 → 最初の2人は成功、3人目は満枠で403
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const u = await ctx(baseURL!);
      await signup(u, { role: "listener" });
      const r = await reserve(u, session.sessionId as string, "speaker");
      statuses.push(r.status());
      await u.dispose();
    }
    expect(statuses).toEqual([201, 201, 403]);
  });
});

test.describe("join gating (token)", () => {
  test("speaker without reservation is rejected on a live session", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    const hostUser = await signup(host, { role: "vtuber" });
    expect(hostUser.role).toBe("vtuber");
    const session = await createSession(host);
    const started = await startSession(host, session.sessionId as string);
    expect(started.ok()).toBeTruthy();
    await host.dispose();

    const u = await ctx(baseURL!);
    await signup(u, { role: "listener" });
    const res = await requestToken(u, session.sessionId as string, "speaker");
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toContain("reservation");
    await u.dispose();
  });

  test("non-live session cannot be joined by listeners", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host); // prelive
    await host.dispose();

    const u = await ctx(baseURL!);
    await signup(u, { role: "listener" });
    const res = await requestToken(u, session.sessionId as string, "listener");
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toContain("not live");
    await u.dispose();
  });

  test("listener can get a token on a live, free, no-reservation session", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host, { reservationRequired: false });
    await startSession(host, session.sessionId as string);
    await host.dispose();

    const u = await ctx(baseURL!);
    await signup(u, { role: "listener" });
    const res = await requestToken(u, session.sessionId as string, "listener");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { token?: string };
    expect(body.token).toBeTruthy();
    await u.dispose();
  });

  test("reserved speaker can get a token on a live session", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host, { speakerSlotsTotal: 2 });

    const u = await ctx(baseURL!);
    await signup(u, { role: "listener" });
    const r = await reserve(u, session.sessionId as string, "speaker");
    expect(r.status()).toBe(201);

    // ホストがライブ開始 → 予約済みuserがspeakerトークンを取得できる
    const started = await startSession(host, session.sessionId as string);
    expect(started.ok()).toBeTruthy();
    await host.dispose();

    const res = await requestToken(u, session.sessionId as string, "speaker");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { token?: string };
    expect(body.token).toBeTruthy();
    await u.dispose();
  });
});

test.describe("status transition robustness", () => {
  test("non-host cannot start another VTuber's session", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    await host.dispose();

    const other = await ctx(baseURL!);
    await signup(other, { role: "vtuber" });
    const res = await startSession(other, session.sessionId as string);
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("another VTuber");
    await other.dispose();
  });

  test("listener role cannot start a session", async ({ baseURL }) => {
    const host = await ctx(baseURL!);
    await signup(host, { role: "vtuber" });
    const session = await createSession(host);
    await host.dispose();

    const u = await ctx(baseURL!);
    await signup(u, { role: "listener" });
    const res = await startSession(u, session.sessionId as string);
    expect(res.status()).toBe(400);
    await u.dispose();
  });
});
