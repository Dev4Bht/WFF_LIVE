import { prisma } from "@/lib/prisma";

export async function GET() {
  const chapters = await prisma.chapter.findMany({
    orderBy: { memberCount: "desc" },
  });
  return Response.json(chapters);
}
