import type { StoryMetric } from "@/lib/types";

export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_METRICS = 3;
export const MAX_METRIC_VALUE_LENGTH = 12;
export const MAX_METRIC_LABEL_LENGTH = 28;

/**
 * Story metrics are persisted inside the curated PROBLEM signal's `metadata`
 * JSON column, so they arrive from Prisma as `unknown`. Everything that reads
 * them goes through here rather than casting, so a hand-edited or legacy row
 * degrades to "no metrics" instead of crashing the spotlight panel.
 */
export function parseMetrics(raw: unknown): StoryMetric[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as { metrics?: unknown }).metrics;
  if (!Array.isArray(list)) return [];

  return list
    .filter(
      (m): m is StoryMetric =>
        Boolean(m) &&
        typeof m === "object" &&
        typeof (m as StoryMetric).value === "string" &&
        typeof (m as StoryMetric).label === "string" &&
        (m as StoryMetric).value.trim().length > 0 &&
        (m as StoryMetric).label.trim().length > 0
    )
    .slice(0, MAX_METRICS)
    .map((m) => ({
      value: m.value.trim().slice(0, MAX_METRIC_VALUE_LENGTH),
      label: m.label.trim().slice(0, MAX_METRIC_LABEL_LENGTH),
    }));
}
