"use client";

import { AnimatePresence, motion } from "motion/react";
import { SignalCard } from "./SignalCard";
import { useSignalMapStore } from "@/lib/store/signal-map-store";

export function SignalFeed() {
  const signals = useSignalMapStore((s) => s.signals);
  const selectChapter = useSignalMapStore((s) => s.selectChapter);
  const recent = signals.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="pointer-events-none fixed bottom-6 left-6 z-20 hidden max-h-[60vh] w-[320px] flex-col gap-2 md:flex"
    >
      <div className="pointer-events-auto flex items-center justify-between px-1">
        <p className="text-[10px] font-medium tracking-[0.24em] text-muted-foreground uppercase">
          Live Activity
        </p>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-300/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
          Streaming
        </span>
      </div>
      <div className="pointer-events-auto flex flex-col gap-2.5 overflow-hidden">
        <AnimatePresence initial={false}>
          {recent.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onClick={() => selectChapter(signal.chapterId)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
