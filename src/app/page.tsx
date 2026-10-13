"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { CuratorAudioBridge } from "@/components/CuratorAudioBridge";

const DarkRoomWindowScene = dynamic(
  () =>
    import("@/components/DarkRoomWindowScene").then((m) => ({
      default: m.DarkRoomWindowScene,
    })),
  { ssr: false }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none cursor-default">
      {/* 3D Canvas rendering master artwork integration with volumetric 3D lighting */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <Canvas
            camera={{ position: [0, 0, 4.4], fov: 60 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              toneMapping: THREE.NoToneMapping,
            }}
          >
            <Suspense fallback={null}>
              <DarkRoomWindowScene />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Invisible Audio Synchronizer */}
      <CuratorAudioBridge />
    </main>
  );
}
