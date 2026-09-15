"use client";

import { Activity, Globe2, Search, Sparkles } from "lucide-react";
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
        className="pointer-events-none fixed top-5 left-5 z-20 sm:top-6 sm:left-6"
      >
        <div className="glass-panel panel-highlight pointer-events-auto rounded-2xl px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/12 text-primary shadow-[0_0_28px_rgba(42,220,176,0.16)]">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-[0.26em] text-primary text-glow uppercase">
                Signal Map
              </h1>
              <p className="mt-0.5 max-w-[300px] text-[11px] leading-4 text-muted-foreground">
                Connecting voices, mapping solutions, transforming food systems.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="pointer-events-none fixed top-5 right-5 z-20 flex items-center gap-3 sm:top-6 sm:right-6"
      >
        <div className="glass-panel panel-highlight pointer-events-auto hidden items-center gap-1 rounded-2xl px-2 py-2 text-xs sm:flex">
          <Stat label="Chapters" value={chapters.length} />
          <Stat label="Active Signals" value={activeSignals} />
          <Stat label="Live Events" value={liveEventCount} />
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="glass-panel panel-highlight pointer-events-auto flex h-12 items-center gap-2 rounded-2xl px-3 text-xs text-muted-foreground transition hover:border-primary/30 hover:bg-white/[0.08] hover:text-foreground sm:px-4"
          aria-label="Search signal map"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded-md border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] sm:inline">
            /
          </kbd>
        </button>
      </motion.div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const Icon = label === "Live Events" ? Activity : label === "Active Signals" ? Sparkles : Globe2;

  return (
    <div className="flex min-w-24 items-center gap-2 rounded-xl px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-primary/85" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none text-foreground">{value}</span>
        <span className="mt-1 text-[9px] tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
