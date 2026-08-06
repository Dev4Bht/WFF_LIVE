import { prisma } from "@/lib/prisma";
import { broadcastSignal } from "@/lib/simulator/broadcast";
import { SignalType } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as SignalType | null;
  const chapterId = searchParams.get("chapterId");
  const limit = Number(searchParams.get("limit") ?? 100);

  const signals = await prisma.signal.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(chapterId ? { chapterId } : {}),
    },
    include: { chapter: true },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 300),
  });

  return Response.json(signals);
}

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { chapterId, type, title, description, severity } = body as Record<string, unknown>;

  if (typeof chapterId !== "string" || !chapterId) {
    return Response.json({ error: "chapterId is required" }, { status: 400 });
  }
  if (typeof type !== "string" || !(type in SignalType)) {
    return Response.json({ error: "Invalid signal type" }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return Response.json({ error: "description is required" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) {
    return Response.json({ error: "Chapter not found" }, { status: 404 });
  }

  const clampedSeverity = Math.min(
    5,
    Math.max(1, Number.isFinite(severity) ? Math.round(Number(severity)) : 2)
  );

  const signal = await prisma.signal.create({
    data: {
      chapterId,
      type: type as SignalType,
      title: title.trim().slice(0, MAX_TITLE_LENGTH),
      description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
      severity: clampedSeverity,
      lat: chapter.lat + (Math.random() - 0.5) * 0.4,
      lng: chapter.lng + (Math.random() - 0.5) * 0.4,
      metadata: { userSubmitted: true },
    },
    include: { chapter: true },
  });

  broadcastSignal(signal);

  return Response.json(signal, { status: 201 });
}
