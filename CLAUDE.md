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
npm run dev                # start Next dev server (Turbopack)
npm run build               # production build + typecheck
```

`.env` holds `DATABASE_URL` and optional `ANTHROPIC_API_KEY`. Copy from
`.env.example` if missing.

## Directory structure

```
app/api/            REST routes (chapters, signals, connections) + SSE stream + assistant
components/globe/    three-globe + R3F scene: globeInstance (factory), GlobeScene, GlobeCanvas, Beacons
components/shell/    HUD, LoadingSequence, Sidebar, SignalCard, SignalFeed, SearchBar
components/ui/       shadcn/ui generated primitives — don't hand-edit, regenerate via `npx shadcn add`
lib/store/           Zustand store — single source of truth for chapters/signals/connections/selection
lib/hooks/           useChapters (initial REST fetch), useSignalStream (EventSource subscription)
lib/simulator/       generateSignal() — writes a mock signal to Postgres and returns it; used by the SSE route on a jittered timer
mock-data/           seed chapters + signal title/description templates (used by both seed.ts and the live simulator)
prisma/              schema.prisma, seed.ts, migrations/
public/textures/     Earth day-map + topology (bump) textures sourced from three-globe's own CDN demo assets
public/data/          countries.geojson — Natural Earth 1:110m admin-0 country boundaries (nvkelso/natural-earth-vector), used for the focused-country polygon highlight
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
  `/api/spotlights`; rendered by `components/shell/SpotlightCard.tsx`.
- **Signal simulator**: `lib/simulator/generator.ts` is called both by
  `prisma/seed.ts` (initial seed) and `app/api/events/stream/route.ts` (an
  ongoing jittered ~3-8s loop) so simulated activity and REST reads never
  diverge — every simulated signal is a real row.
- **Beacon click target**: the visible beacon sphere is intentionally
  small; each `Beacon` also renders a much larger fully-transparent
  (opacity 0) sphere as the actual raycast hit target so it's clickable
  without hand-tuning pointer precision.

## Deferred (not built in Phase 1)

Day/night cycle & night-lights compositing, aurora/bloom post-processing,
time-lapse mode, mission-control mode, story mode, achievement system, AI
health index, WebRTC live presence/cursors, sound design, PWA/offline,
i18n, full WCAG audit, authentication, admin/moderation tooling,
notifications, native mobile, production deploy config.
