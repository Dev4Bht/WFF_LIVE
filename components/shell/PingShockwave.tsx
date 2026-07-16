"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META } from "@/lib/types";

interface Pulse {
  id: number;
  x: number;
  y: number;
  color: string;
}

/**
 * The moment a live ping arrives, it visually "hits" the whole scene, not
 * just the globe surface: a minimal ring + soft radial flash expand from
 * the ping's exact projected screen position (computed in GlobeScene) out
 * across the background.
 */
export function PingShockwave() {
  const pingImpactPoint = useSignalMapStore((s) => s.pingImpactPoint);
  const lastPing = useSignalMapStore((s) => s.lastPing);
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    if (!pingImpactPoint || !lastPing) return;
    const color = SIGNAL_TYPE_META[lastPing.type]?.color ?? "#60a5fa";
    // Mirroring an external zustand field into local animation state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPulse({ id: Date.now(), x: pingImpactPoint.x, y: pingImpactPoint.y, color });
    const timeout = setTimeout(() => setPulse(null), 1300);
    return () => clearTimeout(timeout);
  }, [pingImpactPoint, lastPing]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {pulse && (
          <div
            key={pulse.id}
            className="absolute"
            style={{ left: `${pulse.x * 100}%`, top: `${pulse.y * 100}%` }}
          >
            <motion.span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ borderColor: pulse.color }}
              initial={{ width: 6, height: 6, opacity: 0.9 }}
              animate={{ width: 420, height: 420, opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
            <motion.span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: `radial-gradient(circle, ${pulse.color}40 0%, transparent 70%)`,
              }}
              initial={{ width: 40, height: 40, opacity: 0 }}
              animate={{ width: 1200, height: 1200, opacity: [0, 0.55, 0] }}
              transition={{ duration: 1.3, ease: "easeOut" }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
