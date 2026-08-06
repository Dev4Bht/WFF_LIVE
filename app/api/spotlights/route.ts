import { prisma } from "@/lib/prisma";
import { parseMetrics } from "@/lib/story-content";
import type { StoryMetric } from "@/lib/types";

export async function GET() {
  const curated = await prisma.signal.findMany({
    where: { metadata: { path: ["curated"], equals: true } },
    include: { author: true },
    orderBy: { type: "asc" },
  });

  const byChapter = new Map<
    string,
    {
      chapterId: string;
      ambassador: { name: string; role: string | null } | null;
      problem: { title: string; description: string } | null;
      solution: { title: string; description: string } | null;
      metrics: StoryMetric[];
    }
  >();

  for (const signal of curated) {
    const entry = byChapter.get(signal.chapterId) ?? {
      chapterId: signal.chapterId,
      ambassador: signal.author
        ? { name: signal.author.name, role: signal.author.role }
        : null,
      problem: null,
      solution: null,
      metrics: [],
    };

    if (signal.type === "PROBLEM") {
      entry.problem = { title: signal.title, description: signal.description };
      // Metrics describe the story as a whole but live on the PROBLEM row,
      // which is the anchor of a curated pair — see the PUT handler.
      entry.metrics = parseMetrics(signal.metadata);
    } else if (signal.type === "SOLUTION") {
      entry.solution = { title: signal.title, description: signal.description };
    }

    byChapter.set(signal.chapterId, entry);
  }

  return Response.json(Array.from(byChapter.values()));
}
