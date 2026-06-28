import { NextResponse } from "next/server";
import type { SessionComment } from "@/app/lib/apiTypes";
import { resolveSessionUser } from "@/app/lib/server/auth";
import {
  createSessionComment,
  getStreamSessionById,
  listSessionComments,
  retractSessionComment,
} from "@/app/lib/server/aimentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

function validRole(value: unknown): SessionComment["senderRole"] {
  return value === "vtuber" || value === "speaker" || value === "listener" ? value : "listener";
}

function validLang(value: unknown, fallback: SessionComment["originalLang"]) {
  return value === "ja" || value === "en" ? value : fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const comments = await listSessionComments(sessionId);
  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const actor = await resolveSessionUser();
  const session = await getStreamSessionById(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  try {
    const body = (await request.json()) as {
      id?: unknown;
      senderRole?: unknown;
      senderName?: unknown;
      originalText?: unknown;
      originalLang?: unknown;
      translatedText?: unknown;
      translatedLang?: unknown;
      clientId?: unknown;
    };

    const text = typeof body.originalText === "string" ? body.originalText.trim() : "";
    if (!text) return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
    if (text.length > 500) return NextResponse.json({ error: "Comment is too long" }, { status: 400 });

    const senderRole = validRole(body.senderRole);
    const fallbackLang = senderRole === "vtuber" ? "ja" : "en";
    const senderId = actor?.id ?? (typeof body.clientId === "string" && body.clientId.trim() ? `guest:${body.clientId.trim()}` : "");
    if (!senderId) return NextResponse.json({ error: "Comment sender is required" }, { status: 401 });

    if (senderRole === "vtuber" && actor?.id !== session.hostUserId) {
      return NextResponse.json({ error: "Only the host can comment as VTuber" }, { status: 403 });
    }

    const comment = await createSessionComment({
      id: typeof body.id === "string" ? body.id : undefined,
      sessionId,
      senderId,
      senderRole,
      senderName:
        actor?.channelName ??
        actor?.name ??
        (typeof body.senderName === "string" && body.senderName.trim() ? body.senderName.trim() : senderRole),
      originalText: text,
      originalLang: validLang(body.originalLang, fallbackLang),
      translatedText: typeof body.translatedText === "string" ? body.translatedText : undefined,
      translatedLang: validLang(body.translatedLang, fallbackLang === "ja" ? "en" : "ja"),
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create comment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const actor = await resolveSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const commentId = new URL(request.url).searchParams.get("commentId")?.trim();
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });
    const comment = await retractSessionComment({ sessionId, commentId, actorId: actor.id });
    return NextResponse.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retract comment";
    return NextResponse.json({ error: message }, { status: message.includes("Cannot") ? 403 : 400 });
  }
}
