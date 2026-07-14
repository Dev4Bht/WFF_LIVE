import { prisma } from "@/lib/prisma";
import signalTemplates from "@/mock-data/signal-templates.json";
import type { SignalType } from "@prisma/client";

type TemplateEntry = {
  weight: number;
  severity: [number, number];
  titles: string[];
  descriptions: string[];
};

const templates = signalTemplates as unknown as Record<string, TemplateEntry>;
const weightedTypes: SignalType[] = Object.entries(templates).flatMap(
  ([type, entry]) => Array(entry.weight).fill(type as SignalType)
);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function generateSignal() {
  const chapters = await prisma.chapter.findMany();
  if (chapters.length === 0) return null;

  const chapter = pick(chapters);
  const type = pick(weightedTypes);
  const template = templates[type];

  const signal = await prisma.signal.create({
    data: {
      chapterId: chapter.id,
      type,
      title: pick(template.titles),
      description: pick(template.descriptions),
      severity: randomInt(template.severity[0], template.severity[1]),
      lat: chapter.lat + (Math.random() - 0.5) * 0.6,
      lng: chapter.lng + (Math.random() - 0.5) * 0.6,
    },
    include: { chapter: true },
  });

  return signal;
}
