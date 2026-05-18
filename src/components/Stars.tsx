"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const starCount = 4000

export function Stars() {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const { positions, sizes, colors, phases } = useMemo(() => {
    const pos = new Float32Array(starCount * 3)
    const siz = new Float32Array(starCount)
    const col = new Float32Array(starCount * 3)
    const pha = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const radius = 30 + Math.random() * 70
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i*3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = radius * Math.cos(phi)

      siz[i] = 0.3 + Math.random() * 1.2

      const t = Math.random()
      if (t < 0.6) {
        col[i*3] = 0.9 + Math.random() * 0.1
        col[i*3+1] = 0.9 + Math.random() * 0.1
        col[i*3+2] = 1.0
      } else if (t < 0.8) {
        col[i*3] = 1.0
        col[i*3+1] = 0.85 + Math.random() * 0.1
        col[i*3+2] = 0.7 + Math.random() * 0.1
      } else {
        col[i*3] = 1.0
        col[i*3+1] = 0.6 + Math.random() * 0.15
        col[i*3+2] = 0.4 + Math.random() * 0.15
      }

      pha[i] = Math.random() * Math.PI * 2
    }

    return { positions: pos, sizes: siz, colors: col, phases: pha }
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0008
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-phase"
          args={[phases, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`
          attribute float size;
          attribute vec3 color;
          attribute float phase;
          varying vec3 vColor;
          varying float vPhase;
          void main() {
            vColor = color;
            vPhase = phase;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (250.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform float time;
          varying vec3 vColor;
          varying float vPhase;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            float twinkle = 0.5 + 0.5 * sin(time * (1.2 + vPhase * 3.0) + vPhase * 6.283);
            twinkle = 0.6 + 0.4 * twinkle;
            gl_FragColor = vec4(vColor * twinkle, alpha * twinkle);
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
