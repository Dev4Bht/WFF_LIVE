"use client";

import { useEffect, useState } from "react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";

export function useChapters() {
  const [isLoading, setIsLoading] = useState(true);
  const setChapters = useSignalMapStore((s) => s.setChapters);
  const setConnections = useSignalMapStore((s) => s.setConnections);
  const setInitialSignals = useSignalMapStore((s) => s.setInitialSignals);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [chaptersRes, connectionsRes, signalsRes] = await Promise.all([
        fetch("/api/chapters"),
        fetch("/api/connections"),
        fetch("/api/signals?limit=100"),
      ]);
      const [chapters, connections, signals] = await Promise.all([
        chaptersRes.json(),
        connectionsRes.json(),
        signalsRes.json(),
      ]);

      if (cancelled) return;
      setChapters(chapters);
      setConnections(connections);
      setInitialSignals(signals);
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setChapters, setConnections, setInitialSignals]);

  return { isLoading };
}
