"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { GlobeScene } from "./GlobeScene";

export default function GlobeCanvas() {
  return (
    <Canvas
      camera={{ fov: 45, near: 1, far: 4000, position: [0, 0, 320] }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <GlobeScene />
      </Suspense>
    </Canvas>
  );
}
