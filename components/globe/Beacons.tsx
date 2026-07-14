"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Chapter } from "@/lib/types";
import type { Globe } from "./globeInstance";

function hashToPhase(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000 * Math.PI * 2;
}

interface BeaconProps {
  chapter: Chapter;
  globe: Globe;
  isSelected: boolean;
  onSelect: (chapter: Chapter) => void;
}

function Beacon({ chapter, globe, isSelected, onSelect }: BeaconProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  // Derived (not random) so pulse phase is stable across re-renders/recompiles
  // while still varying per beacon.
  const phase = useMemo(() => hashToPhase(chapter.id), [chapter.id]);

  const position = useMemo(() => {
    const { x, y, z } = globe.getCoords(chapter.lat, chapter.lng, 0.02);
    return new THREE.Vector3(x, y, z);
  }, [globe, chapter.lat, chapter.lng]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 1.6 + phase;
    const pulse = 0.75 + Math.sin(t) * 0.25;
    if (coreRef.current) {
      const scale = isSelected ? 1.6 : 1;
      coreRef.current.scale.setScalar(scale * (0.9 + pulse * 0.2));
    }
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.25 + pulse * 0.25;
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(chapter);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* Fully transparent but still raycastable — enlarges the click/hover target
          well beyond the small visible beacon so it's easy to hit with a real pointer. */}
      <mesh>
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.9, 12, 12]} />
        <meshBasicMaterial color={chapter.color} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.2, 12, 12]} />
        <meshBasicMaterial
          color={chapter.color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

interface BeaconsProps {
  chapters: Chapter[];
  globe: Globe;
  selectedChapterId: string | null;
  onSelect: (chapter: Chapter) => void;
}

export function Beacons({ chapters, globe, selectedChapterId, onSelect }: BeaconsProps) {
  return (
    <>
      {chapters.map((chapter) => (
        <Beacon
          key={chapter.id}
          chapter={chapter}
          globe={globe}
          isSelected={chapter.id === selectedChapterId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
