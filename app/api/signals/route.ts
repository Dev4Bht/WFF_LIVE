import { prisma } from "@/lib/prisma";
import type { SignalType } from "@prisma/client";

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
