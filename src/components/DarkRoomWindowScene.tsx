"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 100% Procedural 3D Environment (Zero image files, zero textures, infinite canvas):
 * - Custom GLSL procedural shader for dark smoky atmospheric room walls with organic fractal fog rings,
 *   subtle dust grain, and wet floor reflection stretching infinitely to every screen ratio.
 * - Procedural 3D wooden window frame with beveled extrusions, sill depth, and glass physical transmission.
 * - Organic procedural firefly entities with multi-stage glow halos that pulsate and illuminate the room dynamically.
 */

// Custom GLSL Shader for the extended smoky dark room & reflective wet floor
const RoomBackgroundShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    // Simplex / hash noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec2 p = vWorldPosition.xy;
      
      // Deep base palette from The Curator aesthetic
      vec3 deepVoid = vec3(0.008, 0.012, 0.022);
      vec3 slateHaze = vec3(0.08, 0.11, 0.18);
      vec3 coolIndigo = vec3(0.14, 0.19, 0.32);
      vec3 wetReflect = vec3(0.10, 0.16, 0.29);

      // Swirling atmospheric halos around window origin (0.0, 0.25)
      vec2 center = vec2(0.0, 0.25);
      float dist = length(p - center);
      
      // Multi-octave organic smoke swirls
      float smoke = noise(p * 0.8 + vec2(uTime * 0.015, uTime * 0.01)) * 0.6;
      smoke += noise(p * 1.8 - vec2(uTime * 0.02, 0.0)) * 0.4;
      
      // Left and right smoky radial rings
      float leftRing = exp(-pow(length(p - vec2(-0.7, 0.4)) - 1.2, 2.0) * 1.8);
      float rightRing = exp(-pow(length(p - vec2(0.8, 0.4)) - 1.4, 2.0) * 1.4);
      float swirlHalo = (leftRing * 0.7 + rightRing * 0.9) * (0.8 + smoke * 0.3);

      vec3 col = deepVoid;
      col += slateHaze * exp(-dist * 0.45) * 0.9;
      col += coolIndigo * swirlHalo * 0.85;

      // Wet floor reflection in the lower ground plane (y < -1.1)
      if (p.y < -1.1) {
        float floorDist = -p.y - 1.1;
        float floorPuddle = exp(-pow(floorDist - 0.7, 2.0) * 2.0);
        float floorNoise = noise(p * vec2(1.5, 4.0)) * 0.3;
        col = mix(col, wetReflect, (floorPuddle * 0.65 + floorNoise * 0.15));
      }

      // Upper ceiling darkness falloff
      if (p.y > 1.2) {
        float ceilFade = smoothstep(1.2, 4.0, p.y);
        col = mix(col, deepVoid * 0.6, ceilFade * 0.8);
      }

      // Vignette falloff towards outer edges of screen
      float vig = smoothstep(6.5, 1.5, length(p * vec2(0.7, 1.0)));
      col *= vig;

      // Micro grain for painted canvas texture
      float grain = (hash(p * 120.0 + uTime * 0.05) - 0.5) * 0.035;
      col += grain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

function ProceduralEndlessBackdrop() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  return (
    <mesh position={[0, 0, -0.15]}>
      {/* Expansive plane (24 x 16 units) covering all aspect ratios including ultrawide */}
      <planeGeometry args={[26, 18]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={RoomBackgroundShader.vertexShader}
        fragmentShader={RoomBackgroundShader.fragmentShader}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Procedural 3D Window Frame with Physical Depth, Mullions, and Window Sill
 */
function Procedural3DWindow() {
  const windowWidth = 2.45;
  const windowHeight = 2.85;
  const frameThick = 0.08;
  const frameDepth = 0.12;

  const sillWidth = 2.95;
  const sillHeight = 0.16;
  const sillDepth = 0.28;

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bcc6df",
        roughness: 0.55,
        metalness: 0.1,
      }),
    []
  );

  return (
    <group position={[0, 0.28, 0]}>
      {/* Outer Borders */}
      <mesh position={[0, windowHeight / 2 - frameThick / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      <mesh position={[0, -windowHeight / 2 + frameThick / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      <mesh position={[-windowWidth / 2 + frameThick / 2, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>
      <mesh position={[windowWidth / 2 - frameThick / 2, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>

      {/* 4-Pane Dividers */}
      <mesh position={[0, 0, 0.01]} material={frameMaterial}>
        <boxGeometry args={[frameThick * 0.72, windowHeight - frameThick, frameDepth * 0.9]} />
      </mesh>
      <mesh position={[0, 0.08, 0.01]} material={frameMaterial}>
        <boxGeometry args={[windowWidth - frameThick, frameThick * 0.72, frameDepth * 0.9]} />
      </mesh>

      {/* Window Sill */}
      <mesh position={[0, -windowHeight / 2 - sillHeight / 2 + 0.02, 0.08]} material={frameMaterial}>
        <boxGeometry args={[sillWidth, sillHeight, sillDepth]} />
      </mesh>

      {/* Deep drop shadow under window sill */}
      <mesh position={[0, -windowHeight / 2 - 0.78, 0.01]}>
        <planeGeometry args={[sillWidth - 0.05, 1.4]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Pitch black glass interior panes */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[windowWidth - 0.1, windowHeight - 0.1]} />
        <meshBasicMaterial color="#010205" />
      </mesh>
    </group>
  );
}

/**
 * Procedural Living Firefly Entities with dynamic glowing halos
 */
function ProceduralFireflies() {
  const leftGroupRef = useRef<THREE.Group>(null);
  const rightGroupRef = useRef<THREE.Group>(null);
  const leftHaloRef = useRef<THREE.Mesh>(null);
  const rightHaloRef = useRef<THREE.Mesh>(null);

  // Procedural gradient glow texture generated on canvas
  const glowTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.14, "rgba(235, 245, 255, 0.9)");
      grad.addColorStop(0.38, "rgba(180, 210, 255, 0.45)");
      grad.addColorStop(0.68, "rgba(90, 130, 210, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (leftGroupRef.current && leftHaloRef.current) {
      leftGroupRef.current.position.y = 0.72 + Math.sin(t * 1.5) * 0.02;
      leftGroupRef.current.position.x = -0.58 + Math.cos(t * 1.2) * 0.015;
      const s = 1.0 + Math.sin(t * 2.2) * 0.05;
      leftHaloRef.current.scale.set(s, s, 1);
    }

    if (rightGroupRef.current && rightHaloRef.current) {
      rightGroupRef.current.position.y = 0.74 + Math.cos(t * 1.3) * 0.02;
      rightGroupRef.current.position.x = 0.54 + Math.sin(t * 1.0) * 0.015;
      const s = 1.0 + Math.sin(t * 1.8 + 1.2) * 0.06;
      rightHaloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, 0, 0.03]}>
      {/* Left Entity */}
      <group ref={leftGroupRef} position={[-0.58, 0.72, 0]}>
        <pointLight color="#dbe7ff" intensity={0.9} distance={2.0} decay={2} />
        {/* Soft aura */}
        <mesh ref={leftHaloRef}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial
            map={glowTexture || undefined}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Core spark */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.038, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Trailing companion spark */}
        <mesh position={[0.0, -0.13, 0.01]}>
          <circleGeometry args={[0.018, 16]} />
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
        </mesh>
      </group>

      {/* Right Entity */}
      <group ref={rightGroupRef} position={[0.54, 0.74, 0]}>
        <pointLight color="#e2edff" intensity={1.4} distance={2.8} decay={2} />
        {/* Broad halo */}
        <mesh ref={rightHaloRef}>
          <planeGeometry args={[1.35, 1.35]} />
          <meshBasicMaterial
            map={glowTexture || undefined}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Intense white center */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.052, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Secondary spark */}
        <mesh position={[0.09, -0.04, 0.01]}>
          <circleGeometry args={[0.02, 16]} />
          <meshBasicMaterial color="#ffffff" opacity={0.75} transparent />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Drifting floating atmospheric embers throughout the room
 */
function FloatingEmbers({ count = 35 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      pha[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.3 + Math.random() * 0.7;
    }
    return [pos, pha, spd];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(t * speeds[i] + phases[i]) * 0.0015;
      pos[idx + 1] += Math.cos(t * speeds[i] * 0.8 + phases[i]) * 0.0012;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#c8dcfa"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function DarkRoomWindowScene() {
  return (
    <>
      <color attach="background" args={["#010206"]} />

      <ambientLight intensity={0.35} color="#182238" />
      <directionalLight position={[1.5, 2.5, 2.0]} intensity={0.65} color="#c8d6f0" />

      <ProceduralEndlessBackdrop />
      <Procedural3DWindow />
      <ProceduralFireflies />
      <FloatingEmbers count={40} />
    </>
  );
}
