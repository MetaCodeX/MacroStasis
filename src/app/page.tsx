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
      {/* Background 3D Canvas */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <Canvas
            camera={{ position: [0, 0, 2.8], fov: 60 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          >
            <Suspense fallback={null}>
              <DarkRoomWindowScene />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Atmospheric Vignette & Moody Lighting Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-radial-[circle_at_center,transparent_40%,rgba(2,3,6,0.85)_100%]" />

      {/* Header Info */}
      <header className="absolute top-6 left-6 z-20 pointer-events-none">
        <h1 className="text-sm font-light tracking-[0.3em] uppercase text-white/80">
          Macrostasis
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-0.5">
          Continuous Recurrence of Expressions
        </p>
      </header>

      {/* Navigation / Links */}
      <nav className="absolute top-6 right-6 z-20 flex items-center gap-4 text-xs font-light tracking-widest text-white/60">
        <a
          href="/download/"
          className="hover:text-white transition duration-200"
        >
          FILES
        </a>
        <a
          href="https://thecuratoreiadu.bandcamp.com/album/continuous-recurrence-of-expressions"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition duration-200"
        >
          BANDCAMP
        </a>
      </nav>

      {/* Broadcast HUD Player */}
      <CuratorBroadcastHUD />
    </main>
  );
}
