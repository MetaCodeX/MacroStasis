"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { Model } from "./Model"
import { Stars } from "./Stars"
import { Suspense, useEffect } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"

function RoomEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    scene.environment = envTexture
    return () => { scene.environment = null }
  }, [gl, scene])

  return null
}

export function Scene() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0.5, 12], fov: 30, near: 0.1, far: 200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
          <RoomEnv />
          <Model />
          <Stars />
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.4} intensity={0.15} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
