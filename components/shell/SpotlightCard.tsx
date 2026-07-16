"use client";

import { AnimatePresence, motion } from "motion/react";
import { Radio, Sparkles } from "lucide-react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Compact "who's pinging" pill — just the ambassador's profile and a live
 * badge. Full problem/solution detail lives in SpotlightDetailPanel instead.
 */
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

  return (
    <AnimatePresence>
      {visible && chapter && content?.ambassador && (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
        >
          <button
            onClick={() => selectChapter(chapter.id)}
            className="glass-panel flex items-center gap-3 rounded-full py-2 pr-5 pl-2 text-left"
            style={{ borderLeft: `2px solid ${chapter.color}` }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-glow"
              style={{
                backgroundColor: `${chapter.color}33`,
                color: chapter.color,
                border: `1px solid ${chapter.color}66`,
              }}
            >
              {initials(content.ambassador.name)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{content.ambassador.name}</p>
                {activeSpotlight?.trigger === "ping" ? (
                  <Radio className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {content.ambassador.role} · {chapter.countryName}
              </p>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
