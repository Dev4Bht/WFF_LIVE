import { prisma } from "@/lib/prisma";

export async function GET() {
  const connections = await prisma.connection.findMany({
    include: { fromChapter: true, toChapter: true },
  });
  return Response.json(connections);
}
