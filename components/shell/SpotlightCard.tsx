"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Radio, Sparkles } from "lucide-react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SpotlightCard() {
  const activeSpotlight = useSignalMapStore((s) => s.activeSpotlight);
  const selectedChapterId = useSignalMapStore((s) => s.selectedChapterId);
  const chapters = useSignalMapStore((s) => s.chapters);
  const spotlights = useSignalMapStore((s) => s.spotlights);
  const selectChapter = useSignalMapStore((s) => s.selectChapter);

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
      {visible && chapter && (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, y: 32, scale: 0.94, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.9 }}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2"
        >
          <button
            onClick={() => selectChapter(chapter.id)}
            className="glass-panel w-full rounded-2xl p-4 text-left"
            style={{ borderTop: `2px solid ${chapter.color}` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                {activeSpotlight?.trigger === "ping" ? (
                  <>
                    <Radio className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Live Ping</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Featured Chapter</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {chapter.countryName}
              </span>
            </div>

            {activeSpotlight?.signal && (
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase"
                  style={{ color: SIGNAL_TYPE_META[activeSpotlight.signal.type]?.color }}
                >
                  {SIGNAL_TYPE_META[activeSpotlight.signal.type]?.label}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeSpotlight.signal.title}
                </span>
              </div>
            )}

            {content?.ambassador && (
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-glow"
                  style={{
                    backgroundColor: `${chapter.color}33`,
                    color: chapter.color,
                    border: `1px solid ${chapter.color}66`,
                  }}
                >
                  {initials(content.ambassador.name)}
                </div>
                <div>
                  <p className="text-sm font-medium">{content.ambassador.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {content.ambassador.role}
                  </p>
                </div>
              </div>
            )}

            {content?.problem && (
              <div className="mb-3">
                <p className="text-[10px] font-medium tracking-wide text-rose-400 uppercase">
                  Challenge
                </p>
                <p className="mt-0.5 text-sm font-medium">{content.problem.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {content.problem.description}
                </p>
              </div>
            )}

            {content?.solution && (
              <div>
                <p className="text-[10px] font-medium tracking-wide text-emerald-400 uppercase">
                  Initiative
                </p>
                <p className="mt-0.5 text-sm font-medium">{content.solution.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {content.solution.description}
                </p>
              </div>
            )}

            <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: chapter.color, width: `${progress * 100}%` }}
              />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
