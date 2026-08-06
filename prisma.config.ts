import { defineConfig } from "prisma/config";

// prisma.config.ts is evaluated before Prisma's own env loading, so load .env
// manually here. Deploy hosts (Render) inject DATABASE_URL as a real env var
// and ship no .env file, so only fall back to the file — a real env var wins.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file present — fall back to real environment variables
  }
}

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  // `datasource` is optional and only consulted by migrate/introspect. It is
  // omitted rather than resolved via env() when DATABASE_URL is absent,
  // because env() throws eagerly at config load — which broke `prisma
  // generate` in the `npm ci` postinstall on a host with no .env file, even
  // though generate needs no database at all.
  ...(url ? { datasource: { url } } : {}),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
