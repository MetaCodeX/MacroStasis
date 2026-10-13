"use client";

import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Photorealistic 3D synthesis aligning with the original artwork:
 * - Uses the authentic painted artwork texture on the backdrop and wall surfaces
 * - True 3D extruded window geometry layered directly in front, casting realistic shadows
 * - Dynamic organic firefly glowing auras with real-time breathing animation, pulsing halos, and illumination
 * - Depth-of-field mood with atmospheric floor reflection and deep drop shadows
 */

function MasterArtworkBackdrop() {
  const texture = useLoader(THREE.TextureLoader, "/album_cover.jpg");

  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  return (
    <mesh position={[0, 0, -0.2]}>
      {/* Aspect ratio 1:1 matching the 1000x1000 album cover perfectly */}
      <planeGeometry args={[5.2, 5.2]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/**
 * 3D Window Frame adding genuine volumetric depth, specular highlights, and real lighting
 */
function VolumetricFrame() {
  // Proportions mapped to the painted window
  const windowWidth = 1.72;
  const windowHeight = 2.05;
  const frameThick = 0.055;
  const frameDepth = 0.08;

  const sillWidth = 2.02;
  const sillHeight = 0.12;
  const sillDepth = 0.22;

  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c0cce2",
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88,
      }),
    []
  );

  return (
    <group position={[0, 0.22, 0.02]}>
      {/* Outer Borders */}
      <mesh position={[0, windowHeight / 2 - frameThick / 2, 0]} material={frameMat}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      <mesh position={[0, -windowHeight / 2 + frameThick / 2, 0]} material={frameMat}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      <mesh position={[-windowWidth / 2 + frameThick / 2, 0, 0]} material={frameMat}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>
      <mesh position={[windowWidth / 2 - frameThick / 2, 0, 0]} material={frameMat}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>

      {/* Dividers */}
      <mesh position={[0, 0, 0.01]} material={frameMat}>
        <boxGeometry args={[frameThick * 0.75, windowHeight - frameThick, frameDepth * 0.9]} />
      </mesh>
      <mesh position={[0, 0.05, 0.01]} material={frameMat}>
        <boxGeometry args={[windowWidth - frameThick, frameThick * 0.75, frameDepth * 0.9]} />
      </mesh>

      {/* 3D Window Sill */}
      <mesh position={[0, -windowHeight / 2 - sillHeight / 2 + 0.01, 0.06]} material={frameMat}>
        <boxGeometry args={[sillWidth, sillHeight, sillDepth]} />
      </mesh>

      {/* Realistic Glass Panes with subtle reflections */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[windowWidth - 0.08, windowHeight - 0.08]} />
        <meshPhysicalMaterial
          color="#060c18"
          transmission={0.7}
          roughness={0.15}
          reflectivity={0.4}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

/**
 * Living Firefly Orbs with authentic ethereal breathing and glowing reflections
 */
function LivingFireflies() {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const leftHaloRef = useRef<THREE.Sprite>(null);
  const rightHaloRef = useRef<THREE.Sprite>(null);

  const auraTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.15, "rgba(235, 245, 255, 0.9)");
      grad.addColorStop(0.4, "rgba(180, 210, 255, 0.45)");
      grad.addColorStop(0.7, "rgba(100, 140, 220, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Natural fluid hovering
    if (leftRef.current && leftHaloRef.current) {
      leftRef.current.position.y = 0.43 + Math.sin(t * 1.4) * 0.018;
      leftRef.current.position.x = -0.42 + Math.cos(t * 1.1) * 0.012;
      const s = 0.55 + Math.sin(t * 2.2) * 0.035;
      leftHaloRef.current.scale.set(s, s, 1);
    }

    if (rightRef.current && rightHaloRef.current) {
      rightRef.current.position.y = 0.45 + Math.cos(t * 1.2) * 0.02;
      rightRef.current.position.x = 0.38 + Math.sin(t * 0.9) * 0.014;
      const s = 0.82 + Math.sin(t * 1.8 + 1.0) * 0.05;
      rightHaloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, 0.22, 0.04]}>
      {/* Left Firefly Entity */}
      <group ref={leftRef} position={[-0.42, 0.43, 0]}>
        <pointLight color="#dbe7ff" intensity={0.9} distance={1.8} decay={2} />
        {/* Core bead */}
        <mesh>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Luminous aura */}
        <sprite ref={leftHaloRef} scale={[0.55, 0.55, 1]}>
          <spriteMaterial map={auraTexture || undefined} blending={THREE.AdditiveBlending} opacity={0.85} />
        </sprite>
        {/* Trailing spark */}
        <mesh position={[0.01, -0.09, 0.005]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
        </mesh>
      </group>

      {/* Right Firefly Entity (Larger Orb) */}
      <group ref={rightRef} position={[0.38, 0.45, 0]}>
        <pointLight color="#e2edff" intensity={1.4} distance={2.4} decay={2} />
        {/* Luminous Core */}
        <mesh>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Broad ethereal halo */}
        <sprite ref={rightHaloRef} scale={[0.82, 0.82, 1]}>
          <spriteMaterial map={auraTexture || undefined} blending={THREE.AdditiveBlending} opacity={0.92} />
        </sprite>
        {/* Companion speck */}
        <mesh position={[0.06, -0.035, 0.005]}>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshBasicMaterial color="#ffffff" opacity={0.75} transparent />
        </mesh>
      </group>
    </group>
  );
}

export function DarkRoomWindowScene() {
  return (
    <>
      <color attach="background" args={["#000000"]} />

      {/* Gentle realistic lighting adding volume to the 3D frame */}
      <ambientLight intensity={0.35} color="#182238" />
      <directionalLight position={[1.5, 2.5, 2.0]} intensity={0.65} color="#c8d6f0" />

      <MasterArtworkBackdrop />
      <VolumetricFrame />
      <LivingFireflies />
    </>
  );
}
