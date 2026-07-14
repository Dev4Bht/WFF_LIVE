"use client";

import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";

export function Hud() {
  const chapters = useSignalMapStore((s) => s.chapters);
  const signals = useSignalMapStore((s) => s.signals);
  const liveEventCount = useSignalMapStore((s) => s.liveEventCount);
  const setSearchOpen = useSignalMapStore((s) => s.setSearchOpen);

  const activeSignals = signals.filter((s) => s.status === "ACTIVE").length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="pointer-events-none fixed top-6 left-6 z-20"
      >
        <div className="glass-panel pointer-events-auto rounded-2xl px-5 py-3">
          <h1 className="text-sm font-semibold tracking-[0.3em] text-primary text-glow uppercase">
            Signal Map
          </h1>
          <p className="mt-0.5 max-w-[260px] text-[11px] text-muted-foreground">
            Connecting Voices. Mapping Solutions. Transforming Food Systems.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="pointer-events-none fixed top-6 right-6 z-20 flex items-center gap-3"
      >
        <div className="glass-panel pointer-events-auto flex items-center gap-4 rounded-2xl px-4 py-3 text-xs">
          <Stat label="Chapters" value={chapters.length} />
          <Stat label="Active Signals" value={activeSignals} />
          <Stat label="Live Events" value={liveEventCount} />
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="glass-panel pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px]">/</kbd>
        </button>
      </motion.div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-[9px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}
