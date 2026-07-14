"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LoadingSequence } from "@/components/shell/LoadingSequence";
import { Hud } from "@/components/shell/Hud";
import { SignalFeed } from "@/components/shell/SignalFeed";
import { Sidebar } from "@/components/shell/Sidebar";
import { SearchBar } from "@/components/shell/SearchBar";
import { SpotlightCard } from "@/components/shell/SpotlightCard";
import { TourController } from "@/components/globe/TourController";
import { useChapters } from "@/lib/hooks/useChapters";
import { useSignalStream } from "@/lib/hooks/useSignalStream";

const GlobeCanvas = dynamic(() => import("@/components/globe/GlobeCanvas"), {
  ssr: false,
});

const MIN_LOADING_MS = 2800;

export default function Home() {
  const { isLoading } = useChapters();
  useSignalStream();

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPhraseIndex((i) => i + 1), 1200);
    const timeout = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const showLoading = isLoading || !minTimeElapsed;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#05070d]">
      <GlobeCanvas />
      <TourController />
      <Hud />
      <SignalFeed />
      <SpotlightCard />
      <Sidebar />
      <SearchBar />
      <LoadingSequence visible={showLoading} phraseIndex={phraseIndex} />

      <div className="glass-panel pointer-events-none fixed inset-x-4 bottom-4 z-30 rounded-xl px-4 py-2 text-center text-xs text-muted-foreground sm:hidden">
        Signal Map is built for larger screens. For the full experience, visit
        on a tablet or desktop.
      </div>
    </div>
  );
}
