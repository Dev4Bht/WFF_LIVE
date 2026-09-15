"use client";

import { useEffect, useState } from "react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";

export function useChapters() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setChapters = useSignalMapStore((s) => s.setChapters);
  const setConnections = useSignalMapStore((s) => s.setConnections);
  const setInitialSignals = useSignalMapStore((s) => s.setInitialSignals);
  const setSpotlights = useSignalMapStore((s) => s.setSpotlights);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [chaptersRes, connectionsRes, signalsRes, spotlightsRes] = await Promise.all([
          fetch("/api/chapters"),
          fetch("/api/connections"),
          fetch("/api/signals?limit=100"),
          fetch("/api/spotlights"),
        ]);

        if (!chaptersRes.ok || !connectionsRes.ok || !signalsRes.ok || !spotlightsRes.ok) {
          throw new Error("Could not load live chapter data.");
        }

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
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setChapters([]);
          setConnections([]);
          setInitialSignals([]);
          setSpotlights([]);
          setError(err instanceof Error ? err.message : "Could not load live chapter data.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setChapters, setConnections, setInitialSignals, setSpotlights]);

  return { isLoading, error };
}
