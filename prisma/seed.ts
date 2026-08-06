import { PrismaClient, SignalType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import chapters from "../mock-data/chapters.json";
import signalTemplates from "../mock-data/signal-templates.json";
import chapterStories from "../mock-data/chapter-stories.json";

// Deploy environments (Render) inject DATABASE_URL as a real env var and have
// no .env file; local runs rely on .env. Only fall back to the file so a real
// env var always wins.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file present — leave it to the connection error below
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — cannot seed the database.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SignalTemplateEntry = {
  weight: number;
  severity: [number, number];
  titles: string[];
  descriptions: string[];
};

type ChapterStory = {
  ambassadorRole: string;
  problem: { title: string; description: string };
  solution: { title: string; description: string };
  // Optional headline figures. Authored through /admin/stories at runtime,
  // so most entries have none until someone fills them in.
  metrics?: { value: string; label: string }[];
};

const templates = signalTemplates as unknown as Record<string, SignalTemplateEntry>;
const signalTypes = Object.keys(templates) as SignalType[];
const stories = chapterStories as unknown as Record<string, ChapterStory>;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST_NAMES = ["Amara", "Liam", "Sofia", "Kenji", "Fatima", "Diego", "Nadia", "Oliver", "Priya", "Lucas", "Zainab", "Noah"];
const LAST_NAMES = ["Okafor", "Silva", "Nakamura", "Haddad", "Rossi", "Petrov", "Kim", "Osei", "Kumar", "Muller"];
const ROLES = ["Chapter Lead", "Field Coordinator", "Youth Ambassador", "Research Lead", "Community Liaison", "Program Manager"];

async function main() {
  // Deploys run the seed on every build, but only chapters are upserted —
  // members/signals/connections are plain creates and would pile up on each
  // redeploy. `--if-empty` makes the seed a no-op once the DB is populated.
  if (process.argv.includes("--if-empty")) {
    const existing = await prisma.chapter.count();
    if (existing > 0) {
      console.log(`Database already has ${existing} chapters — skipping seed.`);
      return;
    }
  }

  console.log(`Seeding ${chapters.length} chapters...`);

  for (const chapterData of chapters) {
    const chapter = await prisma.chapter.upsert({
      where: { countryCode: chapterData.countryCode },
      update: chapterData,
      create: chapterData,
    });

    const memberCount = randomInt(3, 6);
    const members = await Promise.all(
      Array.from({ length: memberCount }).map(() =>
        prisma.member.create({
          data: {
            chapterId: chapter.id,
            name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
            role: pick(ROLES),
            isOnline: Math.random() < 0.35,
          },
        })
      )
    );

    const signalCount = randomInt(1, 3);
    for (let i = 0; i < signalCount; i++) {
      const type = pick(signalTypes);
      const template = templates[type];
      await prisma.signal.create({
        data: {
          chapterId: chapter.id,
          authorId: pick(members).id,
          type: type as SignalType,
          title: pick(template.titles),
          description: pick(template.descriptions),
          severity: randomInt(template.severity[0], template.severity[1]),
          lat: chapterData.lat + (Math.random() - 0.5) * 0.5,
          lng: chapterData.lng + (Math.random() - 0.5) * 0.5,
        },
      });
    }

    // Curated, research-grounded problem/solution pair used by the globe's
    // auto-spotlight tour. Tagged one member as the chapter's public-facing
    // "ambassador" persona and authored both signals from them.
    const story = stories[chapterData.countryCode];
    if (story) {
      const ambassador = await prisma.member.update({
        where: { id: pick(members).id },
        data: { role: story.ambassadorRole, isOnline: true },
      });

      await prisma.signal.create({
        data: {
          chapterId: chapter.id,
          authorId: ambassador.id,
          type: "PROBLEM",
          title: story.problem.title,
          description: story.problem.description,
          severity: 3,
          lat: chapterData.lat,
          lng: chapterData.lng,
          metadata: { curated: true, metrics: story.metrics ?? [] },
        },
      });

      await prisma.signal.create({
        data: {
          chapterId: chapter.id,
          authorId: ambassador.id,
          type: "SOLUTION",
          title: story.solution.title,
          description: story.solution.description,
          severity: 1,
          lat: chapterData.lat,
          lng: chapterData.lng,
          metadata: { curated: true },
        },
      });
    }
  }

  const allChapters = await prisma.chapter.findMany();
  const connectionCount = 18;
  for (let i = 0; i < connectionCount; i++) {
    const from = pick(allChapters);
    const to = pick(allChapters.filter((c) => c.id !== from.id));
    await prisma.connection
      .create({
        data: {
          fromChapterId: from.id,
          toChapterId: to.id,
          label: "Youth Innovation Exchange",
          strength: randomInt(1, 5),
        },
      })
      .catch(() => {
        // ignore accidental duplicate pair collisions
      });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
