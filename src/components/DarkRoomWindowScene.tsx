"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Fast, lightweight 3D Scene:
 * - Dark room walls with subtle ambient vignette
 * - 4-panel window with glowing night sky exterior
 * - Subdued, flickering moonlight passing through glass
 * - Fireflies (luciérnagas) dancing organically with soft pulsation
 * - Window sill and gentle shadow occlusion
 */

function WindowFrame() {
  const outerWidth = 3.6;
  const outerHeight = 4.4;
  const frameThickness = 0.14;
  const frameDepth = 0.22;
  const sillDepth = 0.5;

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c8d0e7",
        roughness: 0.65,
        metalness: 0.1,
      }),
    []
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0a1226",
        transmission: 0.85,
        opacity: 0.95,
        transparent: true,
        roughness: 0.2,
        ior: 1.4,
      }),
    []
  );

  return (
    <group position={[0, 0.4, -2.5]}>
      {/* Window Sill */}
      <mesh position={[0, -outerHeight / 2 - 0.05, 0.1]} material={frameMaterial}>
        <boxGeometry args={[outerWidth + 0.6, 0.16, sillDepth]} />
      </mesh>

      {/* Top Border */}
      <mesh position={[0, outerHeight / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[outerWidth, frameThickness, frameDepth]} />
      </mesh>
      {/* Bottom Border */}
      <mesh position={[0, -outerHeight / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[outerWidth, frameThickness, frameDepth]} />
      </mesh>
      {/* Left Border */}
      <mesh position={[-outerWidth / 2, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThickness, outerHeight, frameDepth]} />
      </mesh>
      {/* Right Border */}
      <mesh position={[outerWidth / 2, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThickness, outerHeight, frameDepth]} />
      </mesh>

      {/* Center Vertical Divider (Mullion) */}
      <mesh position={[0, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThickness * 0.8, outerHeight, frameDepth * 0.9]} />
      </mesh>

      {/* Center Horizontal Divider (Transom) */}
      <mesh position={[0, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[outerWidth, frameThickness * 0.8, frameDepth * 0.9]} />
      </mesh>

      {/* 4 Glass Panes */}
      {/* Top-Left */}
      <mesh position={[-outerWidth / 4, outerHeight / 4, 0]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.1, outerHeight / 2 - 0.1]} />
      </mesh>
      {/* Top-Right */}
      <mesh position={[outerWidth / 4, outerHeight / 4, 0]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.1, outerHeight / 2 - 0.1]} />
      </mesh>
      {/* Bottom-Left */}
      <mesh position={[-outerWidth / 4, -outerHeight / 4, 0]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.1, outerHeight / 2 - 0.1]} />
      </mesh>
      {/* Bottom-Right */}
      <mesh position={[outerWidth / 4, -outerHeight / 4, 0]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.1, outerHeight / 2 - 0.1]} />
      </mesh>

      {/* Outside Sky / Distance Horizon Plane behind glass */}
      <mesh position={[0, 0, -0.6]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial color="#020511" />
      </mesh>

      {/* Subtle Moon glow through the window */}
      <mesh position={[0.6, 0.8, -0.5]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#b8c6e8" opacity={0.4} transparent />
      </mesh>
      <mesh position={[-0.8, 0.4, -0.55]}>
        <circleGeometry args={[0.35, 32]} />
        <meshBasicMaterial color="#7a8bb8" opacity={0.25} transparent />
      </mesh>
    </group>
  );
}

function Fireflies({ count = 28 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate firefly initial positions and random phases
  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Scatter in front of and around window
      pos[i * 3] = (Math.random() - 0.5) * 4.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5 + 0.2;
      pos[i * 3 + 2] = -2.2 + Math.random() * 2.5;

      pha[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.5 + Math.random() * 0.8;
    }
    return [pos, pha, spd];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Gentle floating sine motion
      array[idx] += Math.sin(time * speeds[i] + phases[i]) * 0.003;
      array[idx + 1] += Math.cos(time * speeds[i] * 0.8 + phases[i]) * 0.0025;
      array[idx + 2] += Math.sin(time * 0.5 + phases[i]) * 0.002;

      // Keep them within bounds
      if (array[idx] > 2.5) array[idx] = -2.5;
      if (array[idx] < -2.5) array[idx] = 2.5;
      if (array[idx + 1] > 2.8) array[idx + 1] = -1.5;
      if (array[idx + 1] < -1.5) array[idx + 1] = 2.8;
    }
    posAttr.needsUpdate = true;
  });

  // Circular firefly particle texture
  const fireflyTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 210, 1)");
      gradient.addColorStop(0.2, "rgba(220, 245, 170, 0.85)");
      gradient.addColorStop(0.6, "rgba(140, 210, 120, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        map={fireflyTexture || undefined}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function DarkRoomWalls() {
  return (
    <group>
      {/* Back Wall */}
      <mesh position={[0, 0.4, -2.55]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#0c0e17" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, -2.8, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#06080d" roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 14]} />
        <meshStandardMaterial color="#080912" roughness={0.9} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 14]} />
        <meshStandardMaterial color="#080912" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function DarkRoomWindowScene() {
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const fireflyLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Subtle pulsating moonlight & firefly illumination
    if (moonLightRef.current) {
      moonLightRef.current.intensity = 1.1 + Math.sin(time * 0.7) * 0.1;
    }
    if (fireflyLightRef.current) {
      fireflyLightRef.current.intensity = 0.8 + Math.sin(time * 2.3) * 0.3;
      fireflyLightRef.current.position.x = Math.sin(time * 0.5) * 1.5;
      fireflyLightRef.current.position.y = Math.cos(time * 0.7) * 0.8 + 0.2;
    }
  });

  return (
    <>
      <color attach="background" args={["#03050a"]} />

      {/* Ambient twilight light inside the room */}
      <ambientLight intensity={0.12} color="#18223c" />

      {/* Moonlight beaming into the room from outside the window */}
      <directionalLight
        ref={moonLightRef}
        position={[1.5, 3, -1.8]}
        target-position={[0, -1, 1]}
        intensity={1.2}
        color="#c0d2ff"
      />

      {/* Soft warm light following active fireflies */}
      <pointLight
        ref={fireflyLightRef}
        position={[0, 0.5, -1.5]}
        intensity={0.8}
        distance={4}
        color="#d4ff99"
      />

      <DarkRoomWalls />
      <WindowFrame />
      <Fireflies count={32} />
    </>
  );
}
