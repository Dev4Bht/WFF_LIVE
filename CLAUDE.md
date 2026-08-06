@AGENTS.md

# Signal Map — World Food Forum

A real-time 3D globe experience where each WFF chapter is a glowing beacon,
each update is a "signal" (problem/solution/event/etc.), and chapter
collaborations are drawn as animated arcs. This is Phase 1: a working
full-stack foundation (data model, API, realtime layer) with a baseline
three-globe/React Three Fiber globe. A large aspirational spec was
deliberately trimmed to this vertical slice — most visual/gamification
features (day/night cycle, aurora, time-lapse, mission control,
achievements, etc.) are intentionally not built yet.

## Stack

- Next.js 16 (App Router) + TypeScript + React 19 — **note the AGENTS.md
  pointer above**: this Next.js version has breaking changes vs. older
  training data (e.g. route `params` is a `Promise`).
- Tailwind CSS v4 + shadcn/ui (shadcn here uses `@base-ui/react`, not Radix)
- `motion` (renamed `framer-motion`) for UI animation, imported from
  `motion/react`
- `three` + `@react-three/fiber` + `@react-three/drei` + `three-globe` for
  the globe
- Prisma 7 + PostgreSQL via Docker Compose. **Prisma 7 breaking change**:
  the datasource `url` no longer lives in `schema.prisma` — connection
  config is in `prisma.config.ts`, and `PrismaClient` requires a driver
  adapter (`@prisma/adapter-pg`) rather than reading `DATABASE_URL`
  directly. See `lib/prisma.ts` and `prisma/seed.ts`.
- Realtime: Server-Sent Events (`app/api/events/stream/route.ts`), not
  Socket.io/WebSockets — works natively in the App Router with no custom
  server.
- Zustand for client state (`lib/store/signal-map-store.ts`)
- Anthropic SDK for the AI assistant panel (stubbed with keyword-matched
  answers when `ANTHROPIC_API_KEY` is unset)

## Commands

```bash
docker compose up -d       # start Postgres (mapped to localhost:5434 — 5432/5433 were taken locally)
npx prisma migrate dev     # apply schema migrations
npm run db:seed            # seed ~28 mock chapters + signals + connections
npm run dev                # start Next dev server on the fixed port below
npm run build               # production build + typecheck
```

Dev/start are pinned to **port 4210** (`next dev -p 4210` / `next start -p
${PORT:-4210}` in package.json) so the URL is stable across sessions instead
of Next silently falling back to 3001/3002 whenever something else on the
machine holds 3000. `start` defers to `$PORT` when set — hosts like Render
assign the port and fail the deploy's health check ("no open ports
detected") if the app hardcodes its own.

`.env` holds `DATABASE_URL`, optional `ANTHROPIC_API_KEY`, and optional
`ADMIN_TOKEN` (see the story editor below). Copy from `.env.example` if
missing.

## Deploying (Render)

`render.yaml` is a Blueprint defining the web service + a free Postgres,
wiring `DATABASE_URL` from the database to the service. The build runs
`npm run render-build` = `prisma migrate deploy && tsx prisma/seed.ts
--if-empty && next build`. Two things matter here:

- **Migrations run at build**, not at boot — a fresh Render Postgres is
  empty, so without this every API route 500s on missing tables.
- **The seed is guarded by `--if-empty`.** Only `Chapter` is upserted;
  members/signals/connections are plain `create`s, so an unguarded seed
  would duplicate them on every redeploy. The flag makes it a no-op once
  chapters exist.

`prisma/seed.ts` only falls back to `process.loadEnvFile()` when
`DATABASE_URL` is unset, so the real env var Render injects always wins and
the seed works with no `.env` file present.

Note the SSE stream and `lib/simulator/broadcast.ts` keep state **in
process memory**, so live signal fan-out only reaches clients on the same
instance — correct on a single instance, but scaling past one requires an
external pub/sub.

## Directory structure

```
app/api/            REST routes (chapters, signals, connections) + SSE stream + assistant + spotlights (GET all, PUT /[chapterId] to author a story)
app/admin/stories/   Story editor UI — the only way to author spotlight content at runtime
components/globe/    three-globe + R3F scene: globeInstance (factory), GlobeScene, GlobeCanvas, Beacons
components/shell/    HUD, LoadingSequence, Sidebar, SignalCard, SignalFeed, SearchBar, AppBackdrop (page-level world-map/agri background), SpotlightCard (compact profile pill), SpotlightDetailPanel (full-height right panel), PingShockwave (background-hit animation)
components/ui/       shadcn/ui generated primitives — don't hand-edit, regenerate via `npx shadcn add`
lib/store/           Zustand store — single source of truth for chapters/signals/connections/selection
lib/story-content.ts Shared story field limits + parseMetrics (tolerant read of Signal.metadata)
lib/admin-auth.ts    Shared-secret guard for the story write API
lib/hooks/           useChapters (initial REST fetch), useSignalStream (EventSource subscription)
lib/simulator/       generateSignal() — writes a mock signal to Postgres and returns it; used by the SSE route on a jittered timer
mock-data/           seed chapters + signal title/description templates (used by both seed.ts and the live simulator)
prisma/              schema.prisma, seed.ts, migrations/
public/textures/     Earth day-map + topology (bump) textures sourced from three-globe's own CDN demo assets
public/data/          countries.geojson (Natural Earth boundaries) + world-silhouette.svg (Wikimedia Commons blank world map, tinted green/amber as the page-level AppBackdrop)
```

## Architecture notes

- **Globe/beacon coordinate system**: three-globe uses a globe radius of
  100 units. `globe.getCoords(lat, lng, altitude)` converts geo coords to
  that local space. Beacons are rendered as real R3F `<mesh>` children
  nested *inside* `<primitive object={globe}>` (not siblings) so they
  inherit the globe's slow idle `rotation.y` automatically — if you ever
  move beacon rendering out of that nesting, they'll drift off the
  rotating surface.
- **Idle rotation pauses on selection**: `GlobeScene` only auto-rotates the
  globe when `selectedChapterId` is null, because the camera fly-to target
  is computed once in the globe's local space at click time and would
  drift if the globe kept spinning underneath it.
- **Country polygon highlight**: `GlobeScene` fetches `public/data/countries.geojson`
  once and feeds all 177 country polygons into `globe.polygonsData()` on every
  focus change, coloring/raising only the focused chapter's country (matched
  by `ISO_A2_EH`, not `ISO_A2` — Natural Earth's `ISO_A2` is `"-99"` for a
  handful of countries including France, a known upstream bug). All other
  countries stay at a faint ambient outline.
- **Cinematic auto-spotlight tour** (`components/globe/TourController.tsx`):
  a headless component running a single imperative state machine (via
  `useSignalMapStore.subscribe`, not multiple React effects, to avoid
  timer-coordination races) that cycles the camera focus across chapters
  with curated content (~5s each, randomized) and immediately interrupts
  for genuine live SSE pings (~50-70s hold), pausing whenever the user
  manually selects a chapter. `GlobeScene` derives camera focus from
  `selectedChapterId ?? activeSpotlight.chapterId` — manual selection
  always wins. Curated per-chapter "ambassador" profile + real
  problem/solution content (`mock-data/chapter-stories.json`, grounded in
  WFF/FAO/gov research — not the generic simulator text) is seeded as
  `Signal` rows tagged `metadata.curated: true` and served via
  `/api/spotlights`. Rendering is split in two: `SpotlightCard.tsx` is a
  compact bottom-center pill with just the ambassador's avatar/name/role,
  while `SpotlightDetailPanel.tsx` is the full-height right-side panel with
  the complete Challenge/Initiative text — both read the same
  `activeSpotlight` store state and are mutually exclusive with the manual
  `Sidebar` (hidden whenever `selectedChapterId` is set).
- **Story authoring (`/admin/stories`)**: a curated story is not a row of its
  own — it's a chapter's `PROBLEM` + `SOLUTION` signal pair tagged
  `metadata.curated: true`, authored by a shared `Member` acting as the
  ambassador. `PUT /api/spotlights/[chapterId]` **updates those rows in
  place** rather than delete-and-recreate, so a story keeps its id and
  `createdAt` across edits, the tour doesn't read a re-save as new activity,
  and repeated saves can't accumulate duplicate members or curated pairs.
  Headline **metrics** live in the PROBLEM row's `metadata.metrics` — a
  story-level field on one of the pair's two rows, since the pair is merged
  into a single object by the GET handler anyway. Read it via
  `parseMetrics`, never by casting: `metadata` is untyped JSON, and a
  hand-edited row should degrade to "no metrics" rather than crash the panel.
  Note `mock-data/chapter-stories.json` seeds a *fresh* database only —
  because the deploy seed is `--if-empty`, editing that JSON will not update
  an already-populated environment. The editor is the runtime path.
- **Admin auth is a shared secret, not a user system**: `ADMIN_TOKEN` gates
  the story write API (`lib/admin-auth.ts`). Unset, it allows edits on
  localhost but **refuses them in production** — failing closed matters
  because an unset variable is precisely the mistake that would otherwise
  leave a public, world-writable endpoint on the deployed site.
- **Signal simulator**: `lib/simulator/generator.ts` is called both by
  `prisma/seed.ts` (initial seed) and `app/api/events/stream/route.ts` (an
  ongoing jittered ~3-8s loop) so simulated activity and REST reads never
  diverge — every simulated signal is a real row.
- **Beacon click target**: the visible beacon sphere is intentionally
  small; each `Beacon` also renders a much larger fully-transparent
  (opacity 0) sphere as the actual raycast hit target so it's clickable
  without hand-tuning pointer precision.
- **Page-level backdrop, not a card background**: `GlobeCanvas`'s WebGL
  context is transparent (`gl={{ alpha: true }}`, no `<color attach=
  "background">`) specifically so `AppBackdrop.tsx` — a fixed `z-0` layer
  behind everything — shows through as the actual scene background. Glass
  panels (Sidebar, SpotlightDetailPanel, Hud) intentionally stay plain
  `glass-panel`; they get the map/agri texture "for free" via
  `backdrop-blur` rather than each re-implementing it.
- **Ping shockwave**: when a genuine live SSE signal lands, `GlobeScene`
  projects that chapter's 3D position through the current camera
  (`Vector3.project`, using the globe's live `matrixWorld` so it accounts
  for idle rotation) into normalized screen space and writes it to
  `pingImpactPoint` in the store, snapshotted at the instant the ping
  arrives (not tracked continuously) so it reflects the current camera
  view rather than lagging behind a fly-to. `PingShockwave.tsx` renders a
  minimal expanding ring + soft radial flash at that exact point — a
  screen-space HTML overlay (`z-[5]`), distinct from and complementary to
  three-globe's own WebGL `ringsData` pulse on the globe surface.

## Deferred (not built in Phase 1)

Day/night cycle & night-lights compositing, aurora/bloom post-processing,
time-lapse mode, mission-control mode, story mode, achievement system, AI
health index, WebRTC live presence/cursors, sound design, PWA/offline,
i18n, full WCAG audit, authentication, admin/moderation tooling,
notifications, native mobile, production deploy config.
