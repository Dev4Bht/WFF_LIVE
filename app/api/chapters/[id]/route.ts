import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      members: { orderBy: { isOnline: "desc" } },
      signals: { orderBy: { createdAt: "desc" }, take: 20 },
      connectionsA: { include: { toChapter: true } },
      connectionsB: { include: { fromChapter: true } },
    },
  });

  if (!chapter) {
    return Response.json({ error: "Chapter not found" }, { status: 404 });
  }

  return Response.json(chapter);
}
