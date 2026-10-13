"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { CuratorBroadcastHUD } from "@/components/CuratorBroadcastHUD";

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
    <main className="relative w-screen h-screen overflow-hidden bg-[#03050a] select-none">
      {/* Background 3D Canvas with camera pulled back */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <Canvas
            camera={{ position: [0, 0, 4.4], fov: 55 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          >
            <Suspense fallback={null}>
              <DarkRoomWindowScene />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Atmospheric Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-radial-[circle_at_center,transparent_45%,rgba(2,3,6,0.9)_100%]" />

      {/* Discreet HUD with only icons */}
      <CuratorBroadcastHUD />
    </main>
  );
}
