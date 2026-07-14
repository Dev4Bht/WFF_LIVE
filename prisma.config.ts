import { defineConfig, env } from "prisma/config";

// prisma.config.ts is evaluated before Prisma's own env loading, so load
// .env manually here to make DATABASE_URL available to `env()` below.
try {
  process.loadEnvFile();
} catch {
  // no .env file present — fall back to real environment variables
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
