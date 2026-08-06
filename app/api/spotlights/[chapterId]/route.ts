import { prisma } from "@/lib/prisma";
import { adminUnauthorizedResponse, isAuthorizedAdmin } from "@/lib/admin-auth";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_METRICS,
  MAX_TITLE_LENGTH,
  parseMetrics,
} from "@/lib/story-content";
import type { StoryMetric } from "@/lib/types";

type TextBlock = { title: string; description: string };

function readTextBlock(raw: unknown, field: string): TextBlock | { error: string } {
  if (!raw || typeof raw !== "object") return { error: `${field} is required` };
  const { title, description } = raw as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length === 0) {
    return { error: `${field}.title is required` };
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return { error: `${field}.description is required` };
  }

  return {
    title: title.trim().slice(0, MAX_TITLE_LENGTH),
    description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
  };
}

/**
 * Replaces a chapter's curated story: the PROBLEM/SOLUTION signal pair the
 * globe's spotlight tour reads, the ambassador persona behind them, and the
 * headline metrics.
 *
 * Curated rows are updated in place rather than deleted and recreated, so a
 * story keeps its id and createdAt across edits and the tour doesn't treat a
 * re-save as brand-new activity.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  if (!isAuthorizedAdmin(request)) return adminUnauthorizedResponse();

  const { chapterId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    ambassadorName,
    ambassadorRole,
    problem: rawProblem,
    solution: rawSolution,
    metrics: rawMetrics,
  } = body as Record<string, unknown>;

  const problem = readTextBlock(rawProblem, "problem");
  if ("error" in problem) {
    return Response.json({ error: problem.error }, { status: 400 });
  }
  const solution = readTextBlock(rawSolution, "solution");
  if ("error" in solution) {
    return Response.json({ error: solution.error }, { status: 400 });
  }

  if (rawMetrics !== undefined && !Array.isArray(rawMetrics)) {
    return Response.json({ error: "metrics must be an array" }, { status: 400 });
  }
  if (Array.isArray(rawMetrics) && rawMetrics.length > MAX_METRICS) {
    return Response.json(
      { error: `At most ${MAX_METRICS} metrics are allowed` },
      { status: 400 }
    );
  }
  // Reuse the read-path parser so a metric that would be dropped on display
  // is dropped on save too, rather than being silently stored and lost later.
  const metrics: StoryMetric[] = parseMetrics({ metrics: rawMetrics ?? [] });

  if (typeof ambassadorName !== "string" || ambassadorName.trim().length === 0) {
    return Response.json({ error: "ambassadorName is required" }, { status: 400 });
  }
  const name = ambassadorName.trim().slice(0, 80);
  const role =
    typeof ambassadorRole === "string" && ambassadorRole.trim().length > 0
      ? ambassadorRole.trim().slice(0, 80)
      : null;

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) {
    return Response.json({ error: "Chapter not found" }, { status: 404 });
  }

  const curated = await prisma.signal.findMany({
    where: { chapterId, metadata: { path: ["curated"], equals: true } },
  });
  const problemRow = curated.find((s) => s.type === "PROBLEM");
  const solutionRow = curated.find((s) => s.type === "SOLUTION");

  // Reuse whichever member already fronts this story so edits rename the
  // existing ambassador instead of accumulating a new member per save.
  const existingAmbassadorId = problemRow?.authorId ?? solutionRow?.authorId ?? null;
  const ambassador = existingAmbassadorId
    ? await prisma.member.update({
        where: { id: existingAmbassadorId },
        data: { name, role, isOnline: true },
      })
    : await prisma.member.create({
        data: { chapterId, name, role, isOnline: true },
      });

  const shared = {
    chapterId,
    authorId: ambassador.id,
    lat: chapter.lat,
    lng: chapter.lng,
  };

  const savedProblem = problemRow
    ? await prisma.signal.update({
        where: { id: problemRow.id },
        data: {
          title: problem.title,
          description: problem.description,
          authorId: ambassador.id,
          metadata: { curated: true, metrics },
        },
      })
    : await prisma.signal.create({
        data: {
          ...shared,
          type: "PROBLEM",
          title: problem.title,
          description: problem.description,
          severity: 3,
          metadata: { curated: true, metrics },
        },
      });

  const savedSolution = solutionRow
    ? await prisma.signal.update({
        where: { id: solutionRow.id },
        data: {
          title: solution.title,
          description: solution.description,
          authorId: ambassador.id,
          metadata: { curated: true },
        },
      })
    : await prisma.signal.create({
        data: {
          ...shared,
          type: "SOLUTION",
          title: solution.title,
          description: solution.description,
          severity: 1,
          metadata: { curated: true },
        },
      });

  return Response.json({
    chapterId,
    ambassador: { name: ambassador.name, role: ambassador.role },
    problem: { title: savedProblem.title, description: savedProblem.description },
    solution: { title: savedSolution.title, description: savedSolution.description },
    metrics,
  });
}
