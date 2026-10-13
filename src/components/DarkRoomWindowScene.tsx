"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 100% Procedural Fine-Art Oil Painting Simulation:
 * Perfectly calibrated to match "Continuous recurrence of expressions" (vrashind by PhiSigma):
 * - Canvas Background Shader:
 *   * Soft, organic swirling mist surrounding the window
 *   * Rich charcoal & indigo tones: #020305 base, with misty blue swirls (#26334e, #364868)
 *   * Vertical atmospheric brush strokes in upper atmosphere
 *   * Lower floor with liquid oil puddle reflection and horizontal brush drag
 *   * Ultra-fine oil canvas weave micro-texture
 * - Window Frame:
 *   * Thinner outer and inner bars in pale lilac-white (#dce4f4)
 *   * Thin, elegant window sill with delicate highlight and soft, transparent drop shadow
 *   * Perfectly proportioned 4-pane layout
 * - The Two Firefly Entities:
 *   * Left entity: centered in upper-left pane, delicate diffuse misty aura with tiny trailing spark
 *   * Right entity: broader, denser luminous halo in upper-right pane with sparkling core and satellite mote
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

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = p * 2.1 + vec2(12.3, 34.5);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = vWorldPos.xy;

      // Authentic Color Palette from the Artwork
      vec3 voidDark    = vec3(0.015, 0.018, 0.026); // Background charcoal
      vec3 slateMist   = vec3(0.080, 0.105, 0.155); // Soft mid-tone smoke
      vec3 indigoAura  = vec3(0.160, 0.205, 0.295); // Atmospheric blue haze
      vec3 corePale    = vec3(0.240, 0.300, 0.420); // Highlights around window
      vec3 floorPuddle = vec3(0.130, 0.180, 0.290); // Wet reflective ground
      vec3 floorLight  = vec3(0.220, 0.290, 0.440); // Bright patch of reflection

      // --- Organic Swirling Smoke & Soft Halos ---
      vec2 leftSwirlCenter  = vec2(-0.75, 0.38);
      vec2 rightSwirlCenter = vec2(0.85, 0.40);

      float dLeft  = length(p - leftSwirlCenter);
      float dRight = length(p - rightSwirlCenter);

      // Smooth, natural brush diffusion (no sharp concentric circles)
      float leftAura  = exp(-pow(dLeft - 1.25, 2.0) * 1.2) * 0.75;
      float rightAura = exp(-pow(dRight - 1.45, 2.0) * 1.0) * 0.90;

      // Organic cloud turbulence
      float smokeTurb = fbm(p * 0.9 + vec2(uTime * 0.006, 0.0)) * 0.35;
      float windowGlow = exp(-length(p - vec2(0.0, 0.22)) * 0.45) * 0.45;

      float totalMist = (leftAura + rightAura + windowGlow) * (0.85 + smokeTurb);

      vec3 col = mix(voidDark, slateMist, clamp(totalMist * 1.1, 0.0, 1.0));
      col = mix(col, indigoAura, clamp(pow(totalMist, 1.6), 0.0, 1.0));
      col = mix(col, corePale, clamp(pow(totalMist, 2.8), 0.0, 1.0));

      // --- Upper Soft Vertical Streaks (Carbon Dry-Brush) ---
      if (p.y > 0.6) {
        float streaks = noise(vec2(p.x * 4.5, p.y * 1.2));
        float fade = smoothstep(0.6, 3.2, p.y);
        col = mix(col, voidDark, fade * (0.55 + streaks * 0.3));
      }

      // --- Lower Wet Reflective Floor Puddle ---
      if (p.y < -1.0) {
        float floorDist = -p.y - 1.0;
        float puddleShape = exp(-pow(floorDist - 0.70, 2.0) * 2.8);
        
        // Horizontal brush drag texture in the reflection
        float drag = noise(vec2(p.x * 2.2, floorDist * 16.0)) * 0.15;
        float puddleIntensity = clamp(puddleShape * 0.85 + drag, 0.0, 1.0);
        
        col = mix(col, floorPuddle, puddleIntensity * 0.85);

        // Lighter specular patch in center-left floor
        float lightSpot = exp(-pow(length(vec2(p.x * 0.8 + 0.3, floorDist - 0.65)), 2.0) * 3.5);
        col = mix(col, floorLight, lightSpot * 0.45);
      }

      // --- Micro Linen Canvas Weave & Pigment Grain ---
      float weave = (sin(vWorldPos.x * 400.0) * sin(vWorldPos.y * 400.0)) * 0.02;
      float grain = (hash(floor(vWorldPos.xy * 250.0)) - 0.5) * 0.035;
      col += weave + grain;

      // Soft vignette on far edges
      float vig = smoothstep(6.5, 1.6, length(p * vec2(0.72, 1.0)));
      col *= vig;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

function OilCanvasBackdrop() {
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
 * Hand-painted style Window Frame with slim authentic proportions
 */
function RefinedWindowFrame() {
  // Proportions carefully measured from vrashind cover artwork:
  const windowWidth = 2.05;
  const windowHeight = 2.45;
  const frameThick = 0.052;
  const frameDepth = 0.09;

  const sillWidth = 2.45;
  const sillHeight = 0.11;
  const sillDepth = 0.22;

  // Frame Material matching the delicate pale periwinkle paint
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d4ddf0",
        roughness: 0.5,
        metalness: 0.08,
      }),
    []
  );

  return (
    <group position={[0, 0.24, 0]}>
      {/* Outer Border: Top */}
      <mesh position={[0, windowHeight / 2 - frameThick / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      {/* Outer Border: Bottom */}
      <mesh position={[0, -windowHeight / 2 + frameThick / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[windowWidth, frameThick, frameDepth]} />
      </mesh>
      {/* Outer Border: Left */}
      <mesh position={[-windowWidth / 2 + frameThick / 2, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>
      {/* Outer Border: Right */}
      <mesh position={[windowWidth / 2 - frameThick / 2, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[frameThick, windowHeight, frameDepth]} />
      </mesh>

      {/* Center Vertical Divider (Mullion) */}
      <mesh position={[0, 0, 0.005]} material={frameMaterial}>
        <boxGeometry args={[frameThick * 0.8, windowHeight - frameThick, frameDepth * 0.9]} />
      </mesh>

      {/* Center Horizontal Divider (Transom) */}
      <mesh position={[0, 0.05, 0.005]} material={frameMaterial}>
        <boxGeometry args={[windowWidth - frameThick, frameThick * 0.8, frameDepth * 0.9]} />
      </mesh>

      {/* Window Sill with delicate thickness */}
      <mesh position={[0, -windowHeight / 2 - sillHeight / 2 + 0.015, 0.06]} material={frameMaterial}>
        <boxGeometry args={[sillWidth, sillHeight, sillDepth]} />
      </mesh>

      {/* Top Edge Highlight on the Sill */}
      <mesh position={[0, -windowHeight / 2 + 0.012, 0.14]}>
        <boxGeometry args={[sillWidth - 0.04, 0.015, 0.015]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      {/* Soft feather-blended drop shadow under the sill */}
      <mesh position={[0, -windowHeight / 2 - 0.38, 0.004]}>
        <planeGeometry args={[sillWidth - 0.08, 0.65]} />
        <meshBasicMaterial color="#050811" opacity={0.55} transparent />
      </mesh>
      <mesh position={[0, -windowHeight / 2 - 0.10, 0.008]}>
        <planeGeometry args={[sillWidth - 0.06, 0.16]} />
        <meshBasicMaterial color="#020306" opacity={0.7} transparent />
      </mesh>

      {/* Deep black interior panes */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[windowWidth - 0.06, windowHeight - 0.06]} />
        <meshBasicMaterial color="#010204" />
      </mesh>
    </group>
  );
}

/**
 * Living Firefly Entities matching vrashind painting
 */
function LivingArtworkFireflies() {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const leftHaloRef = useRef<THREE.Mesh>(null);
  const rightHaloRef = useRef<THREE.Mesh>(null);

  // Soft diffused oil halo gradient
  const haloTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.12, "rgba(240, 246, 255, 0.95)");
      grad.addColorStop(0.35, "rgba(190, 215, 255, 0.5)");
      grad.addColorStop(0.65, "rgba(110, 145, 215, 0.15)");
      grad.addColorStop(0.9, "rgba(50, 80, 140, 0.03)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (leftRef.current && leftHaloRef.current) {
      leftRef.current.position.y = 0.65 + Math.sin(t * 1.3) * 0.015;
      leftRef.current.position.x = -0.50 + Math.cos(t * 1.0) * 0.012;
      const s = 1.0 + Math.sin(t * 1.8) * 0.04;
      leftHaloRef.current.scale.set(s, s, 1);
    }

    if (rightRef.current && rightHaloRef.current) {
      rightRef.current.position.y = 0.67 + Math.cos(t * 1.1) * 0.016;
      rightRef.current.position.x = 0.46 + Math.sin(t * 0.9) * 0.014;
      const s = 1.0 + Math.sin(t * 1.5 + 1.0) * 0.05;
      rightHaloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, 0, 0.025]}>
      {/* --- Left Firefly Entity --- */}
      <group ref={leftRef} position={[-0.50, 0.65, 0]}>
        <pointLight color="#dbe7ff" intensity={0.8} distance={1.8} decay={2} />
        {/* Soft misty halo */}
        <mesh ref={leftHaloRef}>
          <planeGeometry args={[0.78, 0.78]} />
          <meshBasicMaterial
            map={haloTexture || undefined}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Core bead */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.032, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Subtle trailing drop */}
        <mesh position={[0.01, -0.10, 0.01]}>
          <circleGeometry args={[0.015, 16]} />
          <meshBasicMaterial color="#f0f5ff" opacity={0.8} transparent />
        </mesh>
      </group>

      {/* --- Right Firefly Entity --- */}
      <group ref={rightRef} position={[0.46, 0.67, 0]}>
        <pointLight color="#e2edff" intensity={1.3} distance={2.5} decay={2} />
        {/* Broader radiant halo */}
        <mesh ref={rightHaloRef}>
          <planeGeometry args={[1.15, 1.15]} />
          <meshBasicMaterial
            map={haloTexture || undefined}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Intense white center */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.044, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Satellite spark */}
        <mesh position={[0.07, -0.035, 0.01]}>
          <circleGeometry args={[0.018, 16]} />
          <meshBasicMaterial color="#f0f5ff" opacity={0.75} transparent />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Microscopic ambient floating motes
 */
function AmbientMotes({ count = 25 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      pha[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.3 + Math.random() * 0.5;
    }
    return [pos, pha, spd];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(t * speeds[i] + phases[i]) * 0.001;
      pos[idx + 1] += Math.cos(t * speeds[i] * 0.8 + phases[i]) * 0.0008;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#c5d8f7"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function DarkRoomWindowScene() {
  return (
    <>
      <color attach="background" args={["#010205"]} />

      <ambientLight intensity={0.4} color="#182238" />
      <directionalLight position={[1.5, 2.5, 2.0]} intensity={0.6} color="#c8d6f0" />

      <OilCanvasBackdrop />
      <RefinedWindowFrame />
      <LivingArtworkFireflies />
      <AmbientMotes count={25} />
    </>
  );
}
