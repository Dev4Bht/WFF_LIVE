"use client";

import { AnimatePresence, motion } from "motion/react";

const PHRASES = [
  "Listening for global signals...",
  "Connecting chapters across the world...",
  "Mapping solutions in real time...",
];

interface LoadingSequenceProps {
  visible: boolean;
  phraseIndex: number;
}

export function LoadingSequence({ visible, phraseIndex }: LoadingSequenceProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070d]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <div className="relative flex h-40 w-40 items-center justify-center">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full border border-primary/40"
              animate={{ scale: [0.4, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inline-flex h-2/3 w-2/3 rounded-full border border-primary/60"
              animate={{ scale: [0.4, 1.4], opacity: [0.7, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
            />
            <span className="h-3 w-3 rounded-full bg-primary text-glow" />
          </div>

          <div className="mt-10 h-6 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIndex}
                className="text-sm font-light tracking-[0.2em] text-muted-foreground uppercase"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
              >
                {PHRASES[phraseIndex % PHRASES.length]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
