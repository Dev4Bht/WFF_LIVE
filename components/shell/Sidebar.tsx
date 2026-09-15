"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { Badge } from "@/components/ui/badge";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META, type Chapter, type Signal } from "@/lib/types";

interface Member {
  id: string;
  name: string;
  role: string | null;
  isOnline: boolean;
}

interface DetailSignal {
  id: string;
  type: keyof typeof SIGNAL_TYPE_META;
  title: string;
  description: string;
  severity: number;
  status: string;
}

interface ChapterDetail {
  id: string;
  countryCode: string;
  countryName: string;
  city: string | null;
  description: string | null;
  memberCount: number;
  color: string;
  members: Member[];
  signals: DetailSignal[];
  connectionsA: { toChapter: { countryName: string } }[];
  connectionsB: { fromChapter: { countryName: string } }[];
}

interface CountryFeature {
  type: "Feature";
  properties: { ISO_A2_EH?: string; ISO_A2?: string; NAME?: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface StorySlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  color: string;
  meta: string;
}

const detailCache = new Map<string, ChapterDetail>();
let countryFeaturesCache: CountryFeature[] | null = null;
let countryFeaturesPromise: Promise<CountryFeature[]> | null = null;

export function Sidebar() {
  const selectedChapterId = useSignalMapStore((s) => s.selectedChapterId);
  const selectChapter = useSignalMapStore((s) => s.selectChapter);
  const chapters = useSignalMapStore((s) => s.chapters);
  const signals = useSignalMapStore((s) => s.signals);
  const spotlights = useSignalMapStore((s) => s.spotlights);
  const [detail, setDetail] = useState<ChapterDetail | null>(null);
  const [storyCursor, setStoryCursor] = useState<{ chapterId: string; index: number } | null>(
    null
  );

  useEffect(() => {
    if (!selectedChapterId) return;
    if (detailCache.has(selectedChapterId)) return;

    let cancelled = false;
    fetch(`/api/chapters/${selectedChapterId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Chapter detail failed");
        return res.json();
      })
      .then((data) => {
        detailCache.set(data.id, data);
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChapterId]);

  const fallbackDetail = useMemo(() => {
    const chapter = chapters.find((item) => item.id === selectedChapterId);
    if (!chapter) return null;
    return toFallbackDetail(chapter, signals);
  }, [chapters, selectedChapterId, signals]);

  const cachedDetail = selectedChapterId ? detailCache.get(selectedChapterId) ?? null : null;
  const currentDetail =
    detail?.id === selectedChapterId ? detail : cachedDetail ?? fallbackDetail;

  const open = selectedChapterId !== null;
  const storySlides = useMemo(() => {
    if (!currentDetail) return [];
    const spotlight = spotlights[currentDetail.id];
    const slides: StorySlide[] = [];

    if (spotlight?.problem) {
      slides.push({
        id: "spotlight-problem",
        eyebrow: "Chapter challenge",
        title: spotlight.problem.title,
        description: spotlight.problem.description,
        color: "#fb7185",
        meta: spotlight.ambassador?.name
          ? `${spotlight.ambassador.name} / ${spotlight.ambassador.role ?? "Youth Ambassador"}`
          : currentDetail.countryName,
      });
    }

    if (spotlight?.solution) {
      slides.push({
        id: "spotlight-solution",
        eyebrow: "Chapter initiative",
        title: spotlight.solution.title,
        description: spotlight.solution.description,
        color: "#34d399",
        meta: spotlight.ambassador?.name
          ? `${spotlight.ambassador.name} / ${spotlight.ambassador.role ?? "Youth Ambassador"}`
          : currentDetail.countryName,
      });
    }

    currentDetail.signals.forEach((signal) => {
      const meta = SIGNAL_TYPE_META[signal.type];
      slides.push({
        id: signal.id,
        eyebrow: meta.label,
        title: signal.title,
        description: signal.description,
        color: meta.color,
        meta: `${signal.status.toLowerCase()} / severity ${signal.severity}`,
      });
    });

    return slides;
  }, [currentDetail, spotlights]);
  const storyIndex =
    currentDetail && storyCursor?.chapterId === currentDetail.id
      ? Math.min(storyCursor.index, Math.max(storySlides.length - 1, 0))
      : 0;
  const activeStory = storySlides[storyIndex];
  const visibleStories = useMemo(() => {
    if (storySlides.length <= 4) {
      return storySlides.map((story, index) => ({ story, index, slot: index }));
    }

    return Array.from({ length: 4 }, (_, slot) => {
      const index = (storyIndex + slot) % storySlides.length;
      return { story: storySlides[index], index, slot };
    });
  }, [storyIndex, storySlides]);

  function goStory(delta: number) {
    if (!currentDetail || storySlides.length <= 1) return;
    setStoryCursor({
      chapterId: currentDetail.id,
      index: (storyIndex + delta + storySlides.length) % storySlides.length,
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="pointer-events-auto fixed inset-0 z-40 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(4,18,22,0.42),rgba(2,6,12,0.88)_72%)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <button
            type="button"
            onClick={() => selectChapter(null)}
            className="absolute top-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-muted-foreground backdrop-blur-xl transition hover:border-white/30 hover:text-foreground"
            aria-label="Close story"
          >
            <X className="h-5 w-5" />
          </button>

          {!currentDetail && (
            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="glass-panel panel-highlight flex items-center gap-3 rounded-2xl px-5 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Preparing nation story...
              </div>
            </div>
          )}

          {currentDetail && (
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-4 py-16 sm:gap-6 sm:px-8">
              <motion.div
                key={currentDetail.id}
                className="relative z-20 text-center"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ delay: 0.28, duration: 0.5 }}
              >
                <p className="text-[10px] font-medium tracking-[0.28em] text-primary uppercase">
                  Focused nation
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">
                  {currentDetail.countryName}
                </h2>
                {currentDetail.city && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentDetail.city}
                  </p>
                )}
              </motion.div>

              <div className="relative z-10 h-[68vh] min-h-[560px] w-full max-w-7xl overflow-visible">
                <CountryMap2D chapter={currentDetail} />

                {activeStory ? (
                  <StoryAnnotations
                    activeIndex={storyIndex}
                    currentChapterId={currentDetail.id}
                    setStoryCursor={setStoryCursor}
                    storySlides={storySlides}
                    visibleStories={visibleStories}
                  />
                ) : (
                  <motion.div
                    className="absolute bottom-8 left-1/2 z-20 w-[min(86vw,520px)] -translate-x-1/2 text-center"
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                  >
                    <h3 className="text-2xl font-semibold">No stories yet</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      This nation is selected, but no story
                      has been published for it yet.
                    </p>
                  </motion.div>
                )}

                {storySlides.length > 1 && (
                  <StoryNavigation
                    currentChapterId={currentDetail.id}
                    goStory={goStory}
                    setStoryCursor={setStoryCursor}
                    storyIndex={storyIndex}
                    storySlides={storySlides}
                  />
                )}
              </div>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function CountryMap2D({
  chapter,
}: {
  chapter: ChapterDetail;
}) {
  const [features, setFeatures] = useState<CountryFeature[]>(
    () => countryFeaturesCache ?? []
  );

  useEffect(() => {
    if (countryFeaturesCache) return;
    let cancelled = false;
    loadCountryFeatures()
      .then((loadedFeatures) => {
        if (!cancelled) setFeatures(loadedFeatures);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const feature = useMemo(
    () =>
      features.find((item) => {
        const code = item.properties.ISO_A2_EH ?? item.properties.ISO_A2;
        return code === chapter.countryCode;
      }) ?? null,
    [features, chapter.countryCode]
  );

  const map = useMemo(() => (feature ? buildCountrySvg(feature) : null), [feature]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[min(44vh,480px)] w-[min(58vw,760px)] -translate-x-1/2 -translate-y-1/2">
      <motion.div
        className="absolute -inset-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.13), transparent 34%), radial-gradient(circle at 50% 52%, rgba(255,255,255,0.055), transparent 58%)",
        }}
      />
      <div
        className="absolute -inset-20 opacity-18"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "radial-gradient(circle at center, black, transparent 74%)",
        }}
        aria-hidden
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 46px 20px rgba(255,255,255,0.26)",
        }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0], scale: [0.2, 1.5, 18] }}
        transition={{ duration: 0.72, ease: "easeOut" }}
        aria-hidden
      />

      {map && (
        <motion.svg
          key={chapter.id}
          viewBox={`0 0 ${map.width} ${map.height}`}
          className="absolute inset-0 h-full w-full opacity-90 drop-shadow-[0_36px_100px_rgba(0,0,0,0.62)]"
          role="img"
          aria-label={`${chapter.countryName} map`}
          initial={{ opacity: 0, scale: 0.18, rotate: -5, filter: "blur(10px)" }}
          animate={{ opacity: 0.92, scale: [0.18, 1.03, 1], rotate: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.82, times: [0, 0.72, 1], ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "50% 50%" }}
        >
          <defs>
            <filter id={`country-glow-${chapter.id}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.46 0"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {map.paths.map((path, index) => (
            <motion.path
              key={index}
              d={path}
              fill="rgba(255,255,255,0.025)"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="1.65"
              vectorEffect="non-scaling-stroke"
              filter={`url(#country-glow-${chapter.id})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.62, delay: 0.12 + index * 0.012, ease: "easeInOut" }}
            />
          ))}
        </motion.svg>
      )}

      <motion.p
        className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center text-[10px] font-medium tracking-[0.35em] text-white/28 uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.6 }}
      >
        {chapter.countryCode}
      </motion.p>
    </div>
  );
}

function toFallbackDetail(chapter: Chapter, signals: Signal[]): ChapterDetail {
  return {
    id: chapter.id,
    countryCode: chapter.countryCode,
    countryName: chapter.countryName,
    city: chapter.city,
    description: chapter.description,
    memberCount: chapter.memberCount,
    color: chapter.color,
    members: [],
    signals: signals
      .filter((signal) => signal.chapterId === chapter.id)
      .slice(0, 20)
      .map((signal) => ({
        id: signal.id,
        type: signal.type,
        title: signal.title,
        description: signal.description,
        severity: signal.severity,
        status: signal.status,
      })),
    connectionsA: [],
    connectionsB: [],
  };
}

function loadCountryFeatures() {
  if (countryFeaturesCache) return Promise.resolve(countryFeaturesCache);
  countryFeaturesPromise ??= fetch("/data/countries.geojson")
    .then((res) => {
      if (!res.ok) throw new Error("Country map failed");
      return res.json();
    })
    .then((geo: { features: CountryFeature[] }) => {
      countryFeaturesCache = geo.features;
      return geo.features;
    });
  return countryFeaturesPromise;
}

function StoryAnnotations({
  activeIndex,
  currentChapterId,
  setStoryCursor,
  storySlides,
  visibleStories,
}: {
  activeIndex: number;
  currentChapterId: string;
  setStoryCursor: (cursor: { chapterId: string; index: number }) => void;
  storySlides: StorySlide[];
  visibleStories: { story: StorySlide; index: number; slot: number }[];
}) {
  return (
    <>
      {visibleStories.map(({ story, index, slot }) => (
        <StoryAnnotation
          key={story.id}
          index={index}
          isActive={index === activeIndex}
          onSelect={() => setStoryCursor({ chapterId: currentChapterId, index })}
          placementIndex={slot}
          story={story}
          totalStories={storySlides.length}
        />
      ))}
    </>
  );
}

function StoryAnnotation({
  index,
  isActive,
  onSelect,
  placementIndex,
  story,
  totalStories,
}: {
  index: number;
  isActive: boolean;
  onSelect: () => void;
  placementIndex: number;
  story: StorySlide;
  totalStories: number;
}) {
  const placement = getAnnotationPlacement(placementIndex);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`absolute z-20 text-left transition ${placement.wrapper} ${
        isActive ? "w-[min(84vw,360px)]" : "w-[min(72vw,280px)]"
      }`}
      initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(10px)" }}
      animate={{
        opacity: isActive ? 1 : 0.72,
        y: 0,
        scale: isActive ? 1 : 0.92,
        filter: "blur(0px)",
      }}
      exit={{ opacity: 0, y: -18, scale: 0.98, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.68 + placementIndex * 0.08 }}
      whileHover={{ opacity: 1, scale: isActive ? 1.015 : 0.96 }}
    >
      <div
        className={`text-balance ${isActive ? "" : "opacity-85"}`}
        style={{
          textShadow: "0 18px 70px rgba(0,0,0,0.95), 0 2px 18px rgba(0,0,0,0.9)",
        }}
      >
        <div className={`mb-3 flex flex-wrap items-center gap-2 ${placement.header}`}>
          <Badge
            variant="outline"
            className="border-white/20 bg-black/10 text-[10px] tracking-wide uppercase backdrop-blur-sm"
            style={{ color: story.color }}
          >
            {story.eyebrow}
          </Badge>
          <span className="text-[10px] tracking-wide text-white/45 uppercase">
            {index + 1} / {totalStories}
          </span>
        </div>

        {isActive && (
          <div className={`mb-3 flex ${placement.header}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]">
              <BookOpen className="h-4 w-4 text-white/80" />
            </span>
          </div>
        )}

        <h3
          className={`font-semibold leading-tight text-white ${
            isActive ? "text-2xl sm:text-4xl" : "text-lg sm:text-2xl"
          }`}
        >
          {story.title}
        </h3>
        <p
          className={`mt-3 leading-6 text-white/68 ${
            isActive ? "text-sm sm:text-base" : "line-clamp-3 text-xs sm:text-sm"
          }`}
        >
          {story.description}
        </p>
        {isActive && (
          <p className="mt-5 text-[10px] font-medium tracking-[0.18em] text-white/42 uppercase">
            {story.meta}
          </p>
        )}
      </div>
    </motion.button>
  );
}

function StoryNavigation({
  currentChapterId,
  goStory,
  setStoryCursor,
  storyIndex,
  storySlides,
}: {
  currentChapterId: string;
  goStory: (delta: number) => void;
  setStoryCursor: (cursor: { chapterId: string; index: number }) => void;
  storyIndex: number;
  storySlides: StorySlide[];
}) {
  return (
    <motion.div
      className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/15 bg-black/20 px-4 py-3 text-white/70 shadow-[0_18px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ delay: 0.9, duration: 0.45 }}
    >
      <button
        type="button"
        onClick={() => goStory(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.035] transition hover:-translate-x-0.5 hover:border-white/35 hover:text-white"
        aria-label="Previous story"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex min-w-28 items-center justify-center gap-2">
        {storySlides.map((story, index) => (
          <button
            type="button"
            key={story.id}
            onClick={() => {
              setStoryCursor({
                chapterId: currentChapterId,
                index,
              });
            }}
            className={`h-2 rounded-full transition-all ${
              index === storyIndex ? "w-8 bg-white" : "w-2 bg-white/25"
            }`}
            aria-label={`Open story ${index + 1}`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => goStory(1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.035] transition hover:translate-x-0.5 hover:border-white/35 hover:text-white"
        aria-label="Next story"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

function getAnnotationPlacement(index: number) {
  const side = index % 4;
  if (side === 0) {
    return {
      wrapper:
        "bottom-0 left-1/2 -translate-x-1/2 text-center md:top-2 md:right-0 md:bottom-auto md:left-auto md:translate-x-0 md:text-left",
      header: "justify-center md:justify-start",
    };
  }
  if (side === 1) {
    return {
      wrapper:
        "bottom-0 left-1/2 -translate-x-1/2 text-center md:top-10 md:left-0 md:bottom-auto md:translate-x-0 md:text-right",
      header: "justify-center md:justify-end",
    };
  }
  if (side === 2) {
    return {
      wrapper:
        "bottom-0 left-1/2 -translate-x-1/2 text-center md:right-0 md:bottom-12 md:left-auto md:translate-x-0 md:text-left",
      header: "justify-center md:justify-start",
    };
  }
  return {
    wrapper:
      "bottom-0 left-1/2 -translate-x-1/2 text-center md:bottom-10 md:left-0 md:translate-x-0 md:text-right",
    header: "justify-center md:justify-end",
  };
}

function buildCountrySvg(feature: CountryFeature) {
  const width = 720;
  const height = 440;
  const projection = geoMercator().fitExtent(
    [
      [18, 18],
      [width - 18, height - 18],
    ],
    feature as GeoPermissibleObjects
  );
  const path = geoPath(projection)(feature as GeoPermissibleObjects);

  return {
    width,
    height,
    paths: path ? [path] : [],
  };
}
