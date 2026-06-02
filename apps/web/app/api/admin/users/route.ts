import { NextResponse } from "next/server";
import { resolveSessionUser } from "@/app/lib/server/auth";
import { listAllUsers, adminUpdateUser } from "@/app/lib/server/aimentStore";
import type { UserRole } from "@/app/lib/apiTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function assertAdmin(userId: string) {
  if (!ADMIN_IDS.includes(userId)) {
    throw new Error("Admin access required");
  }
}

/** GET /api/admin/users — list all users */
export async function GET() {
  const actor = await resolveSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertAdmin(actor.id);
    const users = await listAllUsers(actor.id);
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message.includes("Admin") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** PATCH /api/admin/users — update a user's role or ban status */
export async function PATCH(req: Request) {
  const actor = await resolveSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    assertAdmin(actor.id);
    const body = (await req.json()) as {
      targetId: string;
      role?: UserRole;
      bannedAt?: string | null;
    };

    if (!body.targetId || typeof body.targetId !== "string") {
      return NextResponse.json({ error: "targetId required" }, { status: 400 });
    }
    if (body.role !== undefined && body.role !== "vtuber" && body.role !== "listener") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updates: { role?: UserRole; bannedAt?: string | null } = {};
    if (body.role !== undefined) updates.role = body.role;
    if ("bannedAt" in body) updates.bannedAt = body.bannedAt;

    const updated = await adminUpdateUser(actor.id, body.targetId, updates);
    return NextResponse.json({ user: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message.includes("Admin") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
