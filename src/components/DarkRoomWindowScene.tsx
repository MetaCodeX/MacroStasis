"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Fast, lightweight 3D Scene:
 * - Solitary wall containing the 4-panel window
 * - Floor ground plane extending under the room
 * - Night exterior with glowing sky, soft moon, and fireflies outside behind the window
 * - No side walls or ceiling
 */

function WindowWall() {
  const outerWidth = 3.6;
  const outerHeight = 4.4;
  const frameThickness = 0.14;
  const frameDepth = 0.22;
  const sillDepth = 0.45;

  const wallWidth = 14;
  const wallHeight = 10;
  const wallDepth = 0.2;

  // Window cutout shape in the wall
  const wallGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Outer wall boundaries
    const hw = wallWidth / 2;
    const hh = wallHeight / 2;
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.lineTo(-hw, -hh);

    // Inner window opening (hole)
    const hole = new THREE.Path();
    const wHole = outerWidth / 2;
    const hHole = outerHeight / 2;
    hole.moveTo(-wHole, -hHole);
    hole.lineTo(-wHole, hHole);
    hole.lineTo(wHole, hHole);
    hole.lineTo(wHole, -hHole);
    hole.lineTo(-wHole, -hHole);

    shape.holes.push(hole);

    const extrudeSettings = {
      depth: wallDepth,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [wallWidth, wallHeight, outerWidth, outerHeight, wallDepth]);

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a0c14",
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  );

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
        transmission: 0.9,
        opacity: 0.9,
        transparent: true,
        roughness: 0.15,
        ior: 1.4,
      }),
    []
  );

  return (
    <group position={[0, 0.4, -2.5]}>
      {/* Wall with Window Opening */}
      <mesh
        geometry={wallGeometry}
        material={wallMaterial}
        position={[0, 0, -wallDepth / 2]}
      />

      {/* Window Sill */}
      <mesh position={[0, -outerHeight / 2 - 0.05, 0.12]} material={frameMaterial}>
        <boxGeometry args={[outerWidth + 0.5, 0.16, sillDepth]} />
      </mesh>

      {/* Frame Outer Borders */}
      <mesh position={[0, outerHeight / 2, 0.05]} material={frameMaterial}>
        <boxGeometry args={[outerWidth + 0.1, frameThickness, frameDepth]} />
      </mesh>
      <mesh position={[0, -outerHeight / 2, 0.05]} material={frameMaterial}>
        <boxGeometry args={[outerWidth + 0.1, frameThickness, frameDepth]} />
      </mesh>
      <mesh position={[-outerWidth / 2, 0, 0.05]} material={frameMaterial}>
        <boxGeometry args={[frameThickness, outerHeight, frameDepth]} />
      </mesh>
      <mesh position={[outerWidth / 2, 0, 0.05]} material={frameMaterial}>
        <boxGeometry args={[frameThickness, outerHeight, frameDepth]} />
      </mesh>

      {/* 4-Pane Dividers */}
      <mesh position={[0, 0, 0.05]} material={frameMaterial}>
        <boxGeometry args={[frameThickness * 0.75, outerHeight, frameDepth * 0.85]} />
      </mesh>
      <mesh position={[0, 0, 0.05]} material={frameMaterial}>
        <boxGeometry args={[outerWidth, frameThickness * 0.75, frameDepth * 0.85]} />
      </mesh>

      {/* 4 Glass Panes */}
      <mesh position={[-outerWidth / 4, outerHeight / 4, 0.05]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.08, outerHeight / 2 - 0.08]} />
      </mesh>
      <mesh position={[outerWidth / 4, outerHeight / 4, 0.05]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.08, outerHeight / 2 - 0.08]} />
      </mesh>
      <mesh position={[-outerWidth / 4, -outerHeight / 4, 0.05]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.08, outerHeight / 2 - 0.08]} />
      </mesh>
      <mesh position={[outerWidth / 4, -outerHeight / 4, 0.05]} material={glassMaterial}>
        <planeGeometry args={[outerWidth / 2 - 0.08, outerHeight / 2 - 0.08]} />
      </mesh>

      {/* Night Sky Horizon Plane behind the wall & window */}
      <mesh position={[0, 0, -2.5]}>
        <planeGeometry args={[20, 16]} />
        <meshBasicMaterial color="#01040d" />
      </mesh>

      {/* Soft Moon glow through the window */}
      <mesh position={[0.65, 0.85, -2.4]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="#b8c8ed" opacity={0.4} transparent />
      </mesh>
      <mesh position={[-0.8, 0.4, -2.45]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#7a8bb8" opacity={0.25} transparent />
      </mesh>
    </group>
  );
}

/**
 * Fireflies dancing outside behind the window
 */
function FirefliesOutside({ count = 35 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Positioned outside: z between -3.2 and -4.5 (behind window at z = -2.5)
      pos[i * 3] = (Math.random() - 0.5) * 4.8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.0 + 0.3;
      pos[i * 3 + 2] = -3.0 - Math.random() * 1.5;

      pha[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.4 + Math.random() * 0.7;
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
      array[idx] += Math.sin(time * speeds[i] + phases[i]) * 0.003;
      array[idx + 1] += Math.cos(time * speeds[i] * 0.8 + phases[i]) * 0.0025;
      array[idx + 2] += Math.sin(time * 0.4 + phases[i]) * 0.002;

      // Keep within outside visible frame
      if (array[idx] > 2.8) array[idx] = -2.8;
      if (array[idx] < -2.8) array[idx] = 2.8;
      if (array[idx + 1] > 2.6) array[idx + 1] = -1.8;
      if (array[idx + 1] < -1.8) array[idx + 1] = 2.6;
    }
    posAttr.needsUpdate = true;
  });

  const fireflyTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 220, 1)");
      gradient.addColorStop(0.25, "rgba(230, 255, 170, 0.85)");
      gradient.addColorStop(0.6, "rgba(140, 210, 120, 0.25)");
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
        size={0.18}
        map={fireflyTexture || undefined}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Floor() {
  return (
    <mesh position={[0, -2.8, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 12]} />
      <meshStandardMaterial color="#06080d" roughness={0.85} />
    </mesh>
  );
}

export function DarkRoomWindowScene() {
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const fireflyLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (moonLightRef.current) {
      moonLightRef.current.intensity = 1.1 + Math.sin(time * 0.7) * 0.1;
    }
    if (fireflyLightRef.current) {
      fireflyLightRef.current.intensity = 0.9 + Math.sin(time * 2.2) * 0.3;
      fireflyLightRef.current.position.x = Math.sin(time * 0.5) * 1.5;
      fireflyLightRef.current.position.y = Math.cos(time * 0.7) * 0.8 + 0.3;
    }
  });

  return (
    <>
      <color attach="background" args={["#020409"]} />

      <ambientLight intensity={0.12} color="#18223c" />

      {/* Moonlight streaming in through the window from outside */}
      <directionalLight
        ref={moonLightRef}
        position={[1.5, 3, -4]}
        target-position={[0, -0.5, 0]}
        intensity={1.2}
        color="#c0d2ff"
      />

      {/* Point light outside with fireflies */}
      <pointLight
        ref={fireflyLightRef}
        position={[0, 0.4, -3.2]}
        intensity={0.9}
        distance={4.5}
        color="#d4ff99"
      />

      <WindowWall />
      <Floor />
      <FirefliesOutside count={36} />
    </>
  );
}
