import { create } from "zustand";
import type { Chapter, Connection, Signal, Spotlight } from "@/lib/types";

export type SpotlightTrigger = "ping" | "idle";

interface ActiveSpotlight {
  chapterId: string;
  signal: Signal | null;
  holdMs: number;
  startedAt: number;
  trigger: SpotlightTrigger;
}

interface SignalMapState {
  chapters: Chapter[];
  signals: Signal[];
  connections: Connection[];
  spotlights: Record<string, Spotlight>;
  selectedChapterId: string | null;
  searchOpen: boolean;
  liveEventCount: number;
  hasEnteredExperience: boolean;

  pingSeq: number;
  lastPing: Signal | null;
  activeSpotlight: ActiveSpotlight | null;
  pingImpactPoint: { x: number; y: number } | null;

  setChapters: (chapters: Chapter[]) => void;
  setConnections: (connections: Connection[]) => void;
  setInitialSignals: (signals: Signal[]) => void;
  setSpotlights: (spotlights: Spotlight[]) => void;
  addSignal: (signal: Signal) => void;
  recordPing: (signal: Signal) => void;
  selectChapter: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  enterExperience: () => void;
  setActiveSpotlight: (spotlight: ActiveSpotlight | null) => void;
  setPingImpactPoint: (point: { x: number; y: number } | null) => void;
}

export const useSignalMapStore = create<SignalMapState>((set) => ({
  chapters: [],
  signals: [],
  connections: [],
  spotlights: {},
  selectedChapterId: null,
  searchOpen: false,
  liveEventCount: 0,
  hasEnteredExperience: false,

  pingSeq: 0,
  lastPing: null,
  activeSpotlight: null,
  pingImpactPoint: null,

  setChapters: (chapters) => set({ chapters }),
  setConnections: (connections) => set({ connections }),
  setInitialSignals: (signals) => set({ signals }),
  setSpotlights: (spotlights) =>
    set({
      spotlights: Object.fromEntries(spotlights.map((s) => [s.chapterId, s])),
    }),
  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 200),
      liveEventCount: state.liveEventCount + 1,
    })),
  recordPing: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 200),
      liveEventCount: state.liveEventCount + 1,
      lastPing: signal,
      pingSeq: state.pingSeq + 1,
    })),
  selectChapter: (id) => set({ selectedChapterId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  enterExperience: () => set({ hasEnteredExperience: true }),
  setActiveSpotlight: (spotlight) => set({ activeSpotlight: spotlight }),
  setPingImpactPoint: (point) => set({ pingImpactPoint: point }),
}));
