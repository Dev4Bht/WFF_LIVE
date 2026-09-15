import { Leaf, Sprout } from "lucide-react";

/**
 * Persistent page-level backdrop: a classical world map watermark with a
 * sleek agriculture tint and a minimal "youth-led" accent. Sits behind the
 * (now-transparent) globe canvas so it reads as part of the whole scene,
 * not a card background.
 */
export function AppBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05070d]">
      <div
        className="absolute inset-0 bg-[url(/data/world-silhouette.svg)] bg-center bg-cover opacity-[0.12] sepia-[0.65] hue-rotate-[55deg] saturate-150"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,36,31,0.72),rgba(5,7,13,0.18)_42%,rgba(48,35,10,0.45))]"
        aria-hidden
      />
      <div className="noise-overlay absolute inset-0 opacity-80" aria-hidden />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 34%, rgba(5,7,13,0.46) 68%, rgba(5,7,13,0.92) 100%)",
        }}
        aria-hidden
      />

      <Leaf
        className="absolute -bottom-6 -left-6 h-40 w-40 text-emerald-200/[0.035]"
        aria-hidden
      />
      <Sprout
        className="absolute -top-8 -right-8 h-44 w-44 text-amber-200/[0.03]"
        aria-hidden
      />

      <p
        className="absolute right-4 bottom-1/2 origin-bottom-right translate-y-1/2 rotate-90 text-[10px] font-medium tracking-[0.5em] text-white/[0.05] uppercase select-none"
        aria-hidden
      >
        Youth-Led Food Systems
      </p>
    </div>
  );
}
