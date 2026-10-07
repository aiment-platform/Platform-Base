import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SessionUser, UserRole } from "../apiTypes";
import { getUserById } from "./aimentStore";
import { attachBillingState } from "./billingStore";
import { SESSION_MAX_AGE_SECONDS, signSessionToken, verifySessionToken } from "@/lib/sessionToken";

export const SESSION_COOKIE = "aiment_dev_session";

export async function resolveSessionUser() {
  const cookieStore = await cookies();
  const userId = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await getUserById(userId);
  return attachBillingState(user);
}

export async function requireSessionUser() {
  const user = await resolveSessionUser();
  if (!user) throw new Error("No session user is configured");
  return user;
}

export async function withSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, await signSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function assertRole(user: SessionUser, role: UserRole) {
  if (user.role !== role) {
    throw new Error(`${role} role is required`);
  }
}
