"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 100% Procedural Fine-Art Oil Painting Simulation (Pintura al Óleo Procedural):
 * - Custom GLSL Shader emulating:
 *   * Canvas cloth texture & weave micro-structure (grano de lino del lienzo)
 *   * Swirling circular impasto brush strokes (trazos concéntricos de pincel/espátula)
 *   * Subtle iridescent color-bleeding in halos (dispersión cromática tenue en óleo)
 *   * Upper vertical dry-brush streaks and misty oil glaze (veladura de óleo al carbón)
 *   * Wet oily reflective pool on the floor with subtle pigment pooling
 * - Hand-painted style window frame with soft-edged specular oil highlights
 * - Painterly living firefly orbs with diffused radial oil glaze and sparkling pigment cores
 */

const OilPaintingShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    // Fast PRNG & Value Noise
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

    // Fractal Brownian Motion for rich oil impasto smoke
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = vWorldPos.xy;
      
      // Oil Canvas Palette (The Curator / Leyland Kirby color profile)
      vec3 voidBlack     = vec3(0.012, 0.015, 0.024); // #030406
      vec3 slateDark      = vec3(0.065, 0.082, 0.125); // #111520
      vec3 lavenderSmoke  = vec3(0.185, 0.225, 0.345); // #2f3a58
      vec3 paleIndigo     = vec3(0.280, 0.340, 0.510); // #475782
      vec3 wetOilPool     = vec3(0.140, 0.210, 0.380); // #243661
      vec3 warmHighlights = vec3(0.380, 0.440, 0.620);

      // --- 1. SWIRLING CIRCULAR BRUSHSTROKES (Trazos de espátula concéntricos) ---
      vec2 leftCenter = vec2(-0.85, 0.45);
      vec2 rightCenter = vec2(0.95, 0.48);

      float rLeft = length(p - leftCenter);
      float rRight = length(p - rightCenter);

      // Concentric circular ripples simulating palette knife motion
      float knifeLeft = sin(rLeft * 14.0 - noise(p * 3.0) * 2.5) * 0.06;
      float knifeRight = sin(rRight * 12.0 - noise(p * 2.5) * 2.5) * 0.06;

      // Soft broad halos
      float leftAura = exp(-pow(rLeft - 1.25, 2.0) * 1.5) * 0.65;
      float rightAura = exp(-pow(rRight - 1.45, 2.0) * 1.2) * 0.82;
      
      // Core glow around window
      float windowGlow = exp(-length(p - vec2(0.0, 0.28)) * 0.55);

      // Combine painterly layers
      float totalHaze = (leftAura + knifeLeft) + (rightAura + knifeRight) + windowGlow * 0.35;
      totalHaze += (fbm(p * 1.2 + vec2(uTime * 0.008, 0.0)) - 0.5) * 0.15;

      vec3 col = mix(voidBlack, slateDark, clamp(totalHaze * 1.2, 0.0, 1.0));
      col = mix(col, lavenderSmoke, clamp(pow(totalHaze, 1.8), 0.0, 1.0));
      col = mix(col, paleIndigo, clamp(pow(totalHaze, 3.2), 0.0, 1.0));

      // --- 2. UPPER DRY-BRUSH VERTICAL STREAKS (Pinceladas secas superiores) ---
      if (p.y > 0.8) {
        float streakNoise = noise(vec2(p.x * 6.0, p.y * 1.5));
        float streakFade = smoothstep(0.8, 3.5, p.y);
        col = mix(col, voidBlack, streakFade * (0.6 + streakNoise * 0.35));
      }

      // --- 3. WET WATER / OIL POOL AT FLOOR (Suelo con reflejo de óleo espeso) ---
      if (p.y < -1.15) {
        float floorDepth = -p.y - 1.15;
        float poolCenter = exp(-pow(floorDepth - 0.75, 2.0) * 3.5);
        
        // Horizontal water drag brushstrokes
        float waterBrush = noise(vec2(p.x * 2.5, floorDepth * 18.0)) * 0.18;
        float poolIntensity = clamp((poolCenter * 0.85 + waterBrush), 0.0, 1.0);
        
        col = mix(col, wetOilPool, poolIntensity * 0.85);
        // Secondary softer blue highlight pool in middle
        float midPool = exp(-pow(length(vec2(p.x * 0.6, floorDepth - 0.65)), 2.0) * 4.0);
        col = mix(col, warmHighlights, midPool * 0.4);
      }

      // --- 4. REAL OIL CANVAS TEXTURE & WEAVE (Textura de lienzo de óleo) ---
      // Fine linen canvas grain (hilos entrelazados de lino)
      float weaveX = sin(vWorldPos.x * 450.0);
      float weaveY = sin(vWorldPos.y * 450.0);
      float canvasWeave = (weaveX * weaveY) * 0.025;
      
      // Organic pigment speckles
      float pigmentGrain = (hash(floor(vWorldPos.xy * 280.0)) - 0.5) * 0.045;
      col += canvasWeave + pigmentGrain;

      // Soft outer vignette
      float vignette = smoothstep(6.2, 1.4, length(p * vec2(0.75, 1.0)));
      col *= vignette;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

function OilCanvasEndlessBackdrop() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  return (
    <mesh position={[0, 0, -0.15]}>
      <planeGeometry args={[26, 18]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={OilPaintingShader.vertexShader}
        fragmentShader={OilPaintingShader.fragmentShader}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * 3D Window with Painted Oil Highlights, Soft Wood Edges and Canvas Drop Shadow
 */
function OilPaintedWindowFrame() {
  const windowWidth = 2.45;
  const windowHeight = 2.85;
  const frameThick = 0.082;
  const frameDepth = 0.12;

  const sillWidth = 2.95;
  const sillHeight = 0.165;
  const sillDepth = 0.28;

  // Hand-painted textured material matching the oil artwork
  const oilFrameMaterial = useMemo(() => {
    if (typeof document === "undefined") return new THREE.MeshStandardMaterial({ color: "#bcc6df" });
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#bcc6df";
      ctx.fillRect(0, 0, 256, 256);
      // Soft brush stroke noise
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(225, 235, 255, 0.08)" : "rgba(140, 155, 185, 0.08)";
        ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 20 + 5, 2);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      color: "#bcc6df",
      roughness: 0.65,
      metalness: 0.08,
      map: texture,
    });
  }, []);

  return (
    <group position={[0, 0.28, 0]}>
      {/* Outer Borders */}
      <mesh position={[0, windowHeight / 2 - frameThick / 2, 0]} material={oilFrameMaterial}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      <mesh position={[0, -windowHeight / 2 + frameThick / 2, 0]} material={oilFrameMaterial}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      <mesh position={[-windowWidth / 2 + frameThick / 2, 0, 0]} material={oilFrameMaterial}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>
      <mesh position={[windowWidth / 2 - frameThick / 2, 0, 0]} material={oilFrameMaterial}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>

      {/* Dividers (Mullions) */}
      <mesh position={[0, 0, 0.01]} material={oilFrameMaterial}>
        <boxGeometry args={[frameThick * 0.72, windowHeight - frameThick, frameDepth * 0.9]} />
      </mesh>
      <mesh position={[0, 0.08, 0.01]} material={oilFrameMaterial}>
        <boxGeometry args={[windowWidth - frameThick, frameThick * 0.72, frameDepth * 0.9]} />
      </mesh>

      {/* Painted Sill with soft oil highlight along top edge */}
      <mesh position={[0, -windowHeight / 2 - sillHeight / 2 + 0.02, 0.08]} material={oilFrameMaterial}>
        <boxGeometry args={[sillWidth, sillHeight, sillDepth]} />
      </mesh>
      <mesh position={[0, -windowHeight / 2 + 0.01, 0.16]}>
        <boxGeometry args={[sillWidth - 0.08, 0.02, 0.02]} />
        <meshBasicMaterial color="#eef4ff" opacity={0.65} transparent />
      </mesh>

      {/* Deep drop shadow under window sill with soft oil feathering */}
      <mesh position={[0, -windowHeight / 2 - 0.8, 0.01]}>
        <planeGeometry args={[sillWidth - 0.04, 1.45]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Pitch black oil glaze behind window panes */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[windowWidth - 0.09, windowHeight - 0.09]} />
        <meshBasicMaterial color="#010205" />
      </mesh>
    </group>
  );
}

/**
 * Living Firefly Orbs with authentic diffuse oil glaze halo and pigment core
 */
function OilGlazedFireflies() {
  const leftGroupRef = useRef<THREE.Group>(null);
  const rightGroupRef = useRef<THREE.Group>(null);
  const leftHaloRef = useRef<THREE.Mesh>(null);
  const rightHaloRef = useRef<THREE.Mesh>(null);

  // Painterly diffused glaze texture
  const oilAuraTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Soft uneven brush glaze gradient
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.12, "rgba(242, 248, 255, 0.92)");
      grad.addColorStop(0.35, "rgba(195, 218, 255, 0.5)");
      grad.addColorStop(0.65, "rgba(120, 155, 225, 0.18)");
      grad.addColorStop(0.88, "rgba(60, 90, 160, 0.05)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (leftGroupRef.current && leftHaloRef.current) {
      leftGroupRef.current.position.y = 0.72 + Math.sin(t * 1.3) * 0.016;
      leftGroupRef.current.position.x = -0.58 + Math.cos(t * 1.0) * 0.012;
      const s = 1.0 + Math.sin(t * 1.9) * 0.04;
      leftHaloRef.current.scale.set(s, s, 1);
    }

    if (rightGroupRef.current && rightHaloRef.current) {
      rightGroupRef.current.position.y = 0.74 + Math.cos(t * 1.1) * 0.018;
      rightGroupRef.current.position.x = 0.54 + Math.sin(t * 0.9) * 0.014;
      const s = 1.0 + Math.sin(t * 1.6 + 1.1) * 0.05;
      rightHaloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, 0, 0.03]}>
      {/* --- Left Firefly Entity --- */}
      <group ref={leftGroupRef} position={[-0.58, 0.72, 0]}>
        <pointLight color="#dbe7ff" intensity={0.9} distance={2.0} decay={2} />
        {/* Soft diffused glaze halo */}
        <mesh ref={leftHaloRef}>
          <planeGeometry args={[0.92, 0.92]} />
          <meshBasicMaterial
            map={oilAuraTexture || undefined}
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Concentrated white oil pigment dot */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.038, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Trailing tiny oil dab */}
        <mesh position={[0.0, -0.13, 0.01]}>
          <circleGeometry args={[0.018, 16]} />
          <meshBasicMaterial color="#ffffff" opacity={0.82} transparent />
        </mesh>
      </group>

      {/* --- Right Firefly Entity --- */}
      <group ref={rightGroupRef} position={[0.54, 0.74, 0]}>
        <pointLight color="#e2edff" intensity={1.4} distance={2.8} decay={2} />
        {/* Broad luminous glaze halo */}
        <mesh ref={rightHaloRef}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial
            map={oilAuraTexture || undefined}
            transparent
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Pure radiant oil core */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.052, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Secondary spark dab */}
        <mesh position={[0.09, -0.04, 0.01]}>
          <circleGeometry args={[0.02, 16]} />
          <meshBasicMaterial color="#ffffff" opacity={0.78} transparent />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Micro-particles of floating paint dust & glowing atmospheric motes
 */
function DriftingAtmosphereMotes({ count = 30 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      pha[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.3 + Math.random() * 0.6;
    }
    return [pos, pha, spd];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(t * speeds[i] + phases[i]) * 0.0012;
      pos[idx + 1] += Math.cos(t * speeds[i] * 0.8 + phases[i]) * 0.001;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#c0d4f5"
        transparent
        opacity={0.35}
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

      <ambientLight intensity={0.4} color="#182238" />
      <directionalLight position={[1.5, 2.5, 2.0]} intensity={0.65} color="#c8d6f0" />

      <OilCanvasEndlessBackdrop />
      <OilPaintedWindowFrame />
      <OilGlazedFireflies />
      <DriftingAtmosphereMotes count={32} />
    </>
  );
}
