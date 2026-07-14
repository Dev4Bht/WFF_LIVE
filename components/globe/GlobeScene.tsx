"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Stars } from "@react-three/drei";
import { createGlobe } from "./globeInstance";
import { Beacons } from "./Beacons";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META, type Chapter, type Signal } from "@/lib/types";

const GLOBE_RADIUS = 100;

interface RingDatum {
  lat: number;
  lng: number;
  color: string;
  maxR: number;
}

export function GlobeScene() {
  const globe = useMemo(() => createGlobe(), []);
  const cameraControlsRef = useRef<CameraControls>(null);
  const { camera } = useThree();

  const chapters = useSignalMapStore((s) => s.chapters);
  const connections = useSignalMapStore((s) => s.connections);
  const signals = useSignalMapStore((s) => s.signals);
  const selectedChapterId = useSignalMapStore((s) => s.selectedChapterId);
  const selectChapter = useSignalMapStore((s) => s.selectChapter);

  useEffect(() => {
    camera.position.set(0, 0, 320);
  }, [camera]);

  useEffect(() => {
    const chapterById = new Map(chapters.map((ch) => [ch.id, ch]));
    const arcs = connections
      .map((c) => {
        const from = chapterById.get(c.fromChapterId);
        const to = chapterById.get(c.toChapterId);
        if (!from || !to) return null;
        return {
          startLat: from.lat,
          startLng: from.lng,
          endLat: to.lat,
          endLng: to.lng,
          color: "#38bdf8",
          strength: c.strength,
        };
      })
      .filter((arc): arc is NonNullable<typeof arc> => arc !== null);

    globe
      .arcsData(arcs)
      .arcColor("color")
      .arcStroke((d: unknown) => 0.2 + ((d as { strength: number }).strength ?? 1) * 0.15);
  }, [globe, connections, chapters]);

  const recentSignals = useMemo<Signal[]>(() => signals.slice(0, 30), [signals]);

  useEffect(() => {
    const rings: RingDatum[] = recentSignals.map((s) => ({
      lat: s.lat,
      lng: s.lng,
      color: SIGNAL_TYPE_META[s.type]?.color ?? "#60a5fa",
      maxR: 2 + s.severity * 0.8,
    }));

    globe
      .ringsData(rings)
      .ringColor((d: unknown) => (d as RingDatum).color)
      .ringMaxRadius((d: unknown) => (d as RingDatum).maxR);
  }, [globe, recentSignals]);

  useEffect(() => {
    if (!selectedChapterId) {
      cameraControlsRef.current?.setLookAt(0, 0, 320, 0, 0, 0, true);
    }
  }, [selectedChapterId]);

  function handleSelect(chapter: Chapter) {
    selectChapter(chapter.id);
    const { x, y, z } = globe.getCoords(chapter.lat, chapter.lng, 1.6);
    const dist = 1.9;
    cameraControlsRef.current?.setLookAt(
      x * dist,
      y * dist,
      z * dist,
      x,
      y,
      z,
      true
    );
  }

  useFrame(() => {
    // Pause idle rotation while a chapter is focused so the fly-to camera
    // target (computed once, in the globe's local space) doesn't drift.
    if (!selectedChapterId) {
      // useFrame runs outside React's render/commit cycle, so mutating the
      // Three.js object graph here is the standard R3F animation pattern.
      // eslint-disable-next-line react-hooks/immutability
      globe.rotation.y += 0.0006;
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[300, 150, 200]} intensity={1.4} color="#fff6e0" />
      <Stars radius={280} depth={60} count={6000} factor={3.5} fade speed={0.6} />
      <primitive object={globe}>
        <Beacons
          chapters={chapters}
          globe={globe}
          selectedChapterId={selectedChapterId}
          onSelect={handleSelect}
        />
      </primitive>
      <CameraControls
        ref={cameraControlsRef}
        minDistance={140}
        maxDistance={500}
        dollyToCursor={false}
        smoothTime={0.6}
      />
    </>
  );
}

export { GLOBE_RADIUS };
