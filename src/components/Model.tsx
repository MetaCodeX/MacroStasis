"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

export function Model() {
  const { scene } = useGLTF("/model.gltf")
  const groupRef = useRef<THREE.Group>(null)

  const processed = useMemo(() => {
    const s = scene.clone(true)
    s.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xd4a000,
          metalness: 1.0,
          roughness: 0.2,
          envMapIntensity: 3.0,
          emissive: 0x553300,
          emissiveIntensity: 0.1,
        })
      }
    })
    return s
  }, [scene])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += 0.006
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15
  })

  return <group ref={groupRef} scale={0.033}>
    <primitive object={processed} />
  </group>
}
