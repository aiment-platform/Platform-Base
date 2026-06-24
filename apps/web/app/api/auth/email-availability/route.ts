import { NextResponse } from "next/server";
import { getUserByEmail } from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    return NextResponse.json({ available: existing == null });
  } catch {
    return NextResponse.json({ error: "Failed to check email address" }, { status: 500 });
  }
}
