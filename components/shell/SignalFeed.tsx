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
      className="pointer-events-none fixed bottom-6 left-6 z-20 flex max-h-[60vh] w-[300px] flex-col gap-2"
    >
      <p className="pointer-events-auto px-1 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
        Live Activity
      </p>
      <div className="pointer-events-auto flex flex-col gap-2 overflow-hidden">
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
