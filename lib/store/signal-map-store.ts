import { create } from "zustand";
import type { Chapter, Connection, Signal } from "@/lib/types";

interface SignalMapState {
  chapters: Chapter[];
  signals: Signal[];
  connections: Connection[];
  selectedChapterId: string | null;
  searchOpen: boolean;
  liveEventCount: number;
  hasEnteredExperience: boolean;

  setChapters: (chapters: Chapter[]) => void;
  setConnections: (connections: Connection[]) => void;
  setInitialSignals: (signals: Signal[]) => void;
  addSignal: (signal: Signal) => void;
  selectChapter: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  enterExperience: () => void;
}

export const useSignalMapStore = create<SignalMapState>((set) => ({
  chapters: [],
  signals: [],
  connections: [],
  selectedChapterId: null,
  searchOpen: false,
  liveEventCount: 0,
  hasEnteredExperience: false,

  setChapters: (chapters) => set({ chapters }),
  setConnections: (connections) => set({ connections }),
  setInitialSignals: (signals) => set({ signals }),
  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 200),
      liveEventCount: state.liveEventCount + 1,
    })),
  selectChapter: (id) => set({ selectedChapterId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  enterExperience: () => set({ hasEnteredExperience: true }),
}));
