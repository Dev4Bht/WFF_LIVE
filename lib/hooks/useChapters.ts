"use client";

import { useEffect, useState } from "react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";

export function useChapters() {
  const [isLoading, setIsLoading] = useState(true);
  const setChapters = useSignalMapStore((s) => s.setChapters);
  const setConnections = useSignalMapStore((s) => s.setConnections);
  const setInitialSignals = useSignalMapStore((s) => s.setInitialSignals);
  const setSpotlights = useSignalMapStore((s) => s.setSpotlights);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [chaptersRes, connectionsRes, signalsRes, spotlightsRes] = await Promise.all([
        fetch("/api/chapters"),
        fetch("/api/connections"),
        fetch("/api/signals?limit=100"),
        fetch("/api/spotlights"),
      ]);
      const [chapters, connections, signals, spotlights] = await Promise.all([
        chaptersRes.json(),
        connectionsRes.json(),
        signalsRes.json(),
        spotlightsRes.json(),
      ]);

      if (cancelled) return;
      setChapters(chapters);
      setConnections(connections);
      setInitialSignals(signals);
      setSpotlights(spotlights);
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setChapters, setConnections, setInitialSignals, setSpotlights]);

  return { isLoading };
}
