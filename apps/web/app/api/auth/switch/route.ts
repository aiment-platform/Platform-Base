import { NextResponse } from "next/server";
import { getUserById } from "@/app/lib/server/aimentStore";
import { withSessionCookie } from "@/app/lib/server/auth";
import { rejectInProduction } from "@/app/lib/server/devOnly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // パスワードなしで任意ユーザーにログインできるため開発専用。
  const rejected = rejectInProduction();
  if (rejected) return rejected;

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const userId = body?.userId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response = NextResponse.json({ user, isAuthenticated: true });
  return withSessionCookie(response, user.id);
}
