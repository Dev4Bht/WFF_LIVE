"use client";

import { useEffect } from "react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import type { Signal } from "@/lib/types";

const IDLE_HOLD_MIN = 4000;
const IDLE_HOLD_MAX = 7000;
const IDLE_GAP_MIN = 2000;
const IDLE_GAP_MAX = 4000;
const PING_HOLD_MIN = 50_000;
const PING_HOLD_MAX = 70_000;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Headless cinematic tour: cycles the globe's camera focus across chapters
 * (~5s each) and interrupts immediately for real live signals (~1min hold),
 * pausing whenever the user manually selects a chapter. Runs as a single
 * imperative state machine over the zustand store rather than several
 * React effects, since coordinating shared timers across effects is more
 * error-prone than one subscribe-driven loop.
 */
export function TourController() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastIdleChapterId: string | null = null;
    let pingHoldActive = false;

    const clear = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const isPaused = () => useSignalMapStore.getState().selectedChapterId !== null;

    function goIdleGap() {
      clear();
      useSignalMapStore.getState().setActiveSpotlight(null);
      if (isPaused()) return;
      timer = setTimeout(pickIdleStop, randomBetween(IDLE_GAP_MIN, IDLE_GAP_MAX));
    }

    function pickIdleStop() {
      if (isPaused() || pingHoldActive) return;
      const { chapters, spotlights } = useSignalMapStore.getState();
      const candidates = chapters.filter(
        (c) => spotlights[c.id] && c.id !== lastIdleChapterId
      );
      const pool = candidates.length > 0 ? candidates : chapters;
      if (pool.length === 0) {
        timer = setTimeout(pickIdleStop, 3000);
        return;
      }
      const chapter = pool[Math.floor(Math.random() * pool.length)];
      lastIdleChapterId = chapter.id;
      const holdMs = randomBetween(IDLE_HOLD_MIN, IDLE_HOLD_MAX);
      useSignalMapStore.getState().setActiveSpotlight({
        chapterId: chapter.id,
        signal: null,
        holdMs,
        startedAt: Date.now(),
        trigger: "idle",
      });
      timer = setTimeout(goIdleGap, holdMs);
    }

    function startPingSpotlight(signal: Signal) {
      clear();
      pingHoldActive = true;
      const holdMs = randomBetween(PING_HOLD_MIN, PING_HOLD_MAX);
      useSignalMapStore.getState().setActiveSpotlight({
        chapterId: signal.chapterId,
        signal,
        holdMs,
        startedAt: Date.now(),
        trigger: "ping",
      });
      timer = setTimeout(() => {
        pingHoldActive = false;
        goIdleGap();
      }, holdMs);
    }

    // Let the globe spin a moment before the ambient tour kicks in.
    timer = setTimeout(pickIdleStop, randomBetween(3000, 5000));

    const unsubPing = useSignalMapStore.subscribe((state, prev) => {
      if (state.pingSeq !== prev.pingSeq && state.lastPing) {
        startPingSpotlight(state.lastPing);
      }
    });

    const unsubSelection = useSignalMapStore.subscribe((state, prev) => {
      if (state.selectedChapterId === prev.selectedChapterId) return;
      if (state.selectedChapterId) {
        clear();
        pingHoldActive = false;
        useSignalMapStore.getState().setActiveSpotlight(null);
      } else {
        clear();
        timer = setTimeout(pickIdleStop, randomBetween(2000, 3500));
      }
    });

    return () => {
      clear();
      unsubPing();
      unsubSelection();
    };
  }, []);

  return null;
}
