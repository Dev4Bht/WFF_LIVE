"use client";

import { useEffect, useState } from "react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import type { Signal } from "@/lib/types";

export function useSignalStream() {
  const addSignal = useSignalMapStore((s) => s.addSignal);
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/events/stream");

    source.addEventListener("signal", (event) => {
      const signal = JSON.parse((event as MessageEvent).data) as Signal;
      addSignal(signal);
      setLatestSignal(signal);
    });

    source.onerror = () => {
      // EventSource retries automatically; nothing to do here.
    };

    return () => source.close();
  }, [addSignal]);

  return { latestSignal };
}
