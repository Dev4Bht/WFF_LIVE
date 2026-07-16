"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Leaf, Radio, Sparkles, Sprout, Wheat, X } from "lucide-react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META } from "@/lib/types";

const DECOR_ICONS = [Leaf, Wheat, Sprout, Leaf, Wheat];

/**
 * Full-height right-side panel showing the focused chapter's real
 * problem/solution detail against a world-map-and-agriculture themed
 * background. Companion to the compact profile pill in SpotlightCard.
 */
export function SpotlightDetailPanel() {
  const activeSpotlight = useSignalMapStore((s) => s.activeSpotlight);
  const selectedChapterId = useSignalMapStore((s) => s.selectedChapterId);
  const chapters = useSignalMapStore((s) => s.chapters);
  const spotlights = useSignalMapStore((s) => s.spotlights);
  const setActiveSpotlight = useSignalMapStore((s) => s.setActiveSpotlight);

  const visible = Boolean(activeSpotlight) && !selectedChapterId;
  const chapter = activeSpotlight
    ? chapters.find((c) => c.id === activeSpotlight.chapterId)
    : null;
  const content = activeSpotlight ? spotlights[activeSpotlight.chapterId] : null;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!activeSpotlight) return;
    const tick = () => {
      const elapsed = Date.now() - activeSpotlight.startedAt;
      setProgress(Math.min(1, elapsed / activeSpotlight.holdMs));
    };
    tick();
    const id = setInterval(tick, 150);
    return () => clearInterval(id);
  }, [activeSpotlight]);

  return (
    <AnimatePresence>
      {visible && chapter && (content?.problem || content?.solution) && (
        <motion.aside
          key={chapter.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          className="pointer-events-auto fixed inset-y-0 right-0 z-10 w-[min(94vw,460px)] overflow-hidden border-l border-white/10"
        >
          {/* World map + agriculture themed background */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-[url(/data/world-silhouette.svg)] bg-cover bg-center opacity-[0.16] mix-blend-luminosity"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-emerald-900/50 via-lime-900/25 to-amber-900/40 mix-blend-color"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#05070d]/95 via-[#05070d]/75 to-[#05070d]/95"
              aria-hidden
            />
            {DECOR_ICONS.map((Icon, i) => (
              <Icon
                key={i}
                className="absolute text-emerald-200/[0.07]"
                style={{
                  top: `${12 + i * 18}%`,
                  left: i % 2 === 0 ? "8%" : "auto",
                  right: i % 2 === 1 ? "10%" : "auto",
                  width: 64 + (i % 3) * 20,
                  height: 64 + (i % 3) * 20,
                }}
                aria-hidden
              />
            ))}
          </div>

          <div className="relative flex h-full flex-col overflow-y-auto px-6 pt-28 pb-8">
            <button
              onClick={() => setActiveSpotlight(null)}
              className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
              aria-label="Dismiss spotlight"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              {activeSpotlight?.trigger === "ping" ? (
                <>
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Live Ping</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Featured Chapter</span>
                </>
              )}
            </div>

            <div className="mb-6 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full text-glow"
                style={{ backgroundColor: chapter.color, color: chapter.color }}
              />
              <h2 className="text-2xl font-semibold">{chapter.countryName}</h2>
            </div>

            {activeSpotlight?.signal && (
              <div className="mb-6 flex items-center gap-2">
                <span
                  className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase"
                  style={{ color: SIGNAL_TYPE_META[activeSpotlight.signal.type]?.color }}
                >
                  {SIGNAL_TYPE_META[activeSpotlight.signal.type]?.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {activeSpotlight.signal.title}
                </span>
              </div>
            )}

            {content?.problem && (
              <div className="mb-8">
                <p className="text-xs font-semibold tracking-wide text-rose-400 uppercase">
                  Challenge
                </p>
                <p className="mt-2 text-lg font-medium">{content.problem.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {content.problem.description}
                </p>
              </div>
            )}

            {content?.solution && (
              <div>
                <p className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                  Initiative
                </p>
                <p className="mt-2 text-lg font-medium">{content.solution.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {content.solution.description}
                </p>
              </div>
            )}

            <div className="mt-auto pt-8">
              <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: chapter.color, width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
