"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"

function measureTextWidth(text: string) {
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.font = "400 128px Raleway, sans-serif"
  return ctx.measureText(text).width
}

function makeMetallicSprite(
  text: string,
  height: number,
  dpr: number,
  color1: string,
  color2: string,
  highlight: string,
  speed: number,
) {
  const fontSize = 128
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  ctx.font = `400 ${fontSize}px Raleway, sans-serif`
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const pad = fontSize * 0.4
  const cw = Math.ceil(tw + pad * 2)
  const ch = Math.ceil(fontSize * 1.4)

  canvas.width = cw * dpr
  canvas.height = ch * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, cw, ch)
  ctx.font = `400 ${fontSize}px Raleway, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  ctx.shadowColor = "rgba(0,0,0,0.7)"
  ctx.shadowBlur = fontSize * 0.25
  ctx.fillStyle = "#ffffff"
  ctx.fillText(text, cw / 2, ch / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
  })

  mat.onBeforeCompile = (shader) => {
    sprite.userData.shaderTime = shader.uniforms.uTime = { value: 0 }

    shader.uniforms.uColor1 = { value: new THREE.Color(color1) }
    shader.uniforms.uColor2 = { value: new THREE.Color(color2) }
    shader.uniforms.uHighlight = { value: new THREE.Color(highlight) }
    shader.uniforms.uSpeed = { value: speed }

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `
        #include <common>
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uHighlight;
        uniform float uSpeed;
      `)
      .replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", `
        float grad = vUv.x;
        vec3 base = mix(uColor1, uColor2, grad);
        float shine = sin((vUv.x + vUv.y) * 6.0 + uTime * uSpeed) * 0.5 + 0.5;
        shine = pow(shine, 3.0);
        vec3 finalColor = mix(base, uHighlight, shine * 0.6);
        outgoingLight = finalColor;
        gl_FragColor = vec4( outgoingLight, diffuseColor.a );
      `)
  }

  const sprite = new THREE.Sprite(mat)
  const aspect = cw / ch
  const w = height * aspect
  sprite.scale.set(w, height, 1)
  sprite.userData.visualLeftBias = 0.5 - pad / cw
  return sprite
}

function makeCanvasSprite(
  text: string,
  height: number,
  dpr: number,
  stops: Array<{ pos: number; color: string }>,
) {
  const fontSize = 128
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  ctx.font = `400 ${fontSize}px Raleway, sans-serif`
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const pad = fontSize * 0.4
  const cw = Math.ceil(tw + pad * 2)
  const ch = Math.ceil(fontSize * 1.4)

  canvas.width = cw * dpr
  canvas.height = ch * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, cw, ch)
  ctx.font = `400 ${fontSize}px Raleway, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  ctx.shadowColor = "rgba(0,0,0,0.7)"
  ctx.shadowBlur = fontSize * 0.25

  const grad = ctx.createLinearGradient(0, 0, cw * 0.8, 0)
  for (const s of stops) {
    grad.addColorStop(s.pos, s.color)
  }
  ctx.fillStyle = grad
  ctx.fillText(text, cw / 2, ch / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
  })

  const sprite = new THREE.Sprite(mat)
  const aspect = cw / ch
  const w = height * aspect
  sprite.scale.set(w, height, 1)
  sprite.userData.visualLeftBias = 0.5 - pad / cw
  return sprite
}

function placeLeft(sprite: THREE.Sprite, anchorX: number, anchorY: number, z = 0) {
  const bias = sprite.userData.visualLeftBias as number
  sprite.position.set(anchorX + sprite.scale.x * bias, anchorY, z)
}

function placeRight(sprite: THREE.Sprite, anchorX: number, anchorY: number, z = 0) {
  const bias = sprite.userData.visualLeftBias as number
  sprite.position.set(anchorX - sprite.scale.x * bias, anchorY, z)
}

function clearSprites(sprites: THREE.Sprite[], scene: THREE.Scene) {
  for (const s of sprites) {
    scene.remove(s)
    s.material.dispose()
    if (s.material.map) s.material.map.dispose()
  }
}

const platinum = { c1: "#999999", c2: "#e8e8e8", hl: "#ffffff", sp: 1.8 }
const brightGold = { c1: "#805500", c2: "#ffd700", hl: "#fff8d6", sp: 1.5 }
const silver = { c1: "#888899", c2: "#d0d0e0", hl: "#ffffff", sp: 1.6 }

const goldGradient = [
  { pos: 0, color: "#805500" },
  { pos: 0.3, color: "#cc9900" },
  { pos: 0.6, color: "#ffd700" },
  { pos: 1, color: "#fff8d6" },
]

export function OriginalScene({
  onEdgesReady,
  onLoaded,
}: {
  onEdgesReady?: (edges: { leftEdgePx: number; rightEdgePx: number }) => void
  onLoaded?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mode = useRef<"desktop" | "mobile">("desktop")

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const mql = window.matchMedia("(orientation: portrait) and (max-width: 1023px)")
    mode.current = mql.matches ? "mobile" : "desktop"

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03050a)

    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 200)
    camera.position.set(0, 0.5, 12)
    camera.lookAt(0, 0, 0)

    function applyCameraMode(mobile: boolean) {
      if (mobile) {
        camera.fov = 35
        camera.position.set(0, 0, 18)
      } else {
        camera.fov = 30
        camera.position.set(0, 0.5, 12)
      }
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
    applyCameraMode(mode.current === "mobile")

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloomStrength = mode.current === "mobile" ? 0.10 : 0.15
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomStrength, 0.4, 0.85))
    composer.addPass(new OutputPass())

    const starCount = mode.current === "mobile" ? 2000 : 4000
    const starGeo = new THREE.BufferGeometry()
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
        col[i*3] = 0.9 + Math.random() * 0.1; col[i*3+1] = 0.9 + Math.random() * 0.1; col[i*3+2] = 1.0
      } else if (t < 0.8) {
        col[i*3] = 1.0; col[i*3+1] = 0.85 + Math.random() * 0.1; col[i*3+2] = 0.7 + Math.random() * 0.1
      } else {
        col[i*3] = 1.0; col[i*3+1] = 0.6 + Math.random() * 0.15; col[i*3+2] = 0.4 + Math.random() * 0.15
      }
      pha[i] = Math.random() * Math.PI * 2
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    starGeo.setAttribute("size", new THREE.BufferAttribute(siz, 1))
    starGeo.setAttribute("color", new THREE.BufferAttribute(col, 3))
    starGeo.setAttribute("phase", new THREE.BufferAttribute(pha, 1))

    const starMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size; attribute vec3 color; attribute float phase;
        varying vec3 vColor; varying float vPhase;
        void main() {
          vColor = color; vPhase = phase;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (250.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float time; varying vec3 vColor; varying float vPhase;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          float tw = 0.5 + 0.5 * sin(time * (1.2 + vPhase * 3.0) + vPhase * 6.283);
          tw = 0.6 + 0.4 * tw;
          gl_FragColor = vec4(vColor * tw, a * tw);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })

    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    const dpr = Math.min(window.devicePixelRatio, 2)
    let model: any = null
    let allSprites: THREE.Sprite[] = []
    let loaded = false

    function computeEdges() {
      const meta = allSprites.find((s) => (s.material as THREE.SpriteMaterial).map?.name === "" || s.userData.shaderTime)
      const codex = allSprites.find((s) => s !== meta && s.userData.shaderTime)

      if (!meta || !codex) return

      const metaLeft = meta.position.x - meta.scale.x * (meta.userData.visualLeftBias as number)
      const codexRight = codex.position.x + codex.scale.x * (codex.userData.visualLeftBias as number)

      const leftVec = new THREE.Vector3(metaLeft, 0, 0).project(camera)
      const rightVec = new THREE.Vector3(codexRight, 0, 0).project(camera)

      const leftPx = (leftVec.x + 1) / 2 * window.innerWidth
      const rightPx = (rightVec.x + 1) / 2 * window.innerWidth

      onEdgesReady?.({ leftEdgePx: leftPx, rightEdgePx: rightPx })
    }

    function fireLoaded() {
      if (loaded) return
      loaded = true
      setTimeout(() => onLoaded?.(), 300)
    }

    function renderDesktop(gltf: any): THREE.Sprite[] {
      const obj = gltf.scene
      obj.traverse((c: THREE.Object3D) => {
        const mesh = c as THREE.Mesh
        if (mesh.isMesh) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xd4a000, metalness: 1.0, roughness: 0.2,
            envMap: scene.environment, envMapIntensity: 3.0,
            emissive: 0x553300, emissiveIntensity: 0.1,
          })
        }
      })
      obj.scale.set(0.033, 0.033, 0.033)
      const shiftX = -0.35
      obj.position.x = shiftX
      scene.add(obj)

      const box = new THREE.Box3().setFromObject(obj)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)
      const hw = size.x / 2
      const my = center.y
      const textH = size.y * 0.55

      const meta = makeMetallicSprite("META", textH, dpr, platinum.c1, platinum.c2, platinum.hl, platinum.sp)
      const codex = makeMetallicSprite("CODEX", textH, dpr, brightGold.c1, brightGold.c2, brightGold.hl, brightGold.sp)

      const metaW = meta.scale.x
      const metaH = meta.scale.y
      const codexW = codex.scale.x
      meta.position.set(shiftX - hw - metaW / 2, my, 0)
      codex.position.set(shiftX + hw + codexW / 2, my, 0)
      scene.add(meta)
      scene.add(codex)

      const sprites: THREE.Sprite[] = [meta, codex]

      const metaLeftEdge = meta.position.x - metaW * meta.userData.visualLeftBias + metaW * 0.02
      const metaTopEdge = my + metaH / 2
      const codexBottom = my - metaH / 2
      const codexRightEdge = codex.position.x + codexW * codex.userData.visualLeftBias
      const padY = -metaH * 0.02
      const ch = 128 * 1.4

      const twName = measureTextWidth("CARLOS EDUARDO JUAREZ RICARDO")
      const maxNameH = metaW * 0.60 * ch / twName
      const nameH = Math.min(textH * 0.24, maxNameH)

      const twTitle = measureTextWidth("MID-LEVEL FULL STACK ENGINEER | AI & AUTOMATION ARCHITECT")
      const maxTitleH = metaW * 0.90 * ch / twTitle
      const titleH = Math.min(textH * 0.35, maxTitleH)

      const name = makeMetallicSprite("CARLOS EDUARDO JUAREZ RICARDO", nameH, dpr, silver.c1, silver.c2, silver.hl, silver.sp)
      const title = makeMetallicSprite("MID-LEVEL FULL STACK ENGINEER | AI & AUTOMATION ARCHITECT", titleH, dpr, brightGold.c1, brightGold.c2, brightGold.hl, brightGold.sp)

      placeLeft(name, metaLeftEdge, metaTopEdge + nameH / 2 + padY)
      placeRight(title, codexRightEdge, codexBottom - titleH / 2 - padY)
      scene.add(name)
      scene.add(title)
      sprites.push(name, title)

      return sprites
    }

    function renderMobile(gltf: any): THREE.Sprite[] {
      const obj = gltf.scene
      obj.traverse((c: THREE.Object3D) => {
        const mesh = c as THREE.Mesh
        if (mesh.isMesh) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xd4a000, metalness: 1.0, roughness: 0.2,
            envMap: scene.environment, envMapIntensity: 3.0,
            emissive: 0x553300, emissiveIntensity: 0.1,
          })
        }
      })
      obj.scale.set(0.020, 0.020, 0.020)
      obj.position.set(0, 0, 0)
      scene.add(obj)

      const fov = camera.fov * Math.PI / 180
      const dist = camera.position.length()
      const vh = dist * Math.tan(fov / 2)
      const vw = vh * camera.aspect
      const sprites: THREE.Sprite[] = []
      const textH = vh * 0.13
      const gapY = vh * 0.025
      const gapX = vw * 0.04
      const metaMargin = vh * 0.90
      const codexMargin = vh * 0.30

      const metaLetters = ["M", "E", "T", "A"]
      const metaSprites = metaLetters.map(l =>
        makeMetallicSprite(l, textH, dpr, platinum.c1, platinum.c2, platinum.hl, platinum.sp)
      )
      const metaH = metaSprites[0].scale.y
      let yPos = metaMargin - metaH / 2
      for (const s of metaSprites) {
        s.position.set(0, yPos, 0)
        scene.add(s)
        sprites.push(s)
        yPos -= metaH + gapY
      }

      const codexLetters = ["C", "O", "D", "E", "X"]
      const codexSprites = codexLetters.map(l =>
        makeMetallicSprite(l, textH, dpr, brightGold.c1, brightGold.c2, brightGold.hl, brightGold.sp)
      )
      const codexH = codexSprites[0].scale.y
      yPos = -codexMargin + codexH / 2
      for (const s of codexSprites) {
        s.position.set(0, yPos, 0)
        scene.add(s)
        sprites.push(s)
        yPos -= codexH + gapY
      }

      const nameGroup = new THREE.Group()
      const nameWords = ["CARLOS", "EDUARDO", "JUAREZ", "RICARDO"]
      const nameWordH = textH * 0.50
      const nameGapY = gapY * 0.8
      const nameSprites = nameWords.map(w =>
        makeMetallicSprite(w, nameWordH, dpr, silver.c1, silver.c2, silver.hl, silver.sp)
      )

      let nY = 0
      for (const s of nameSprites) {
        placeRight(s, 0, nY)
        nameGroup.add(s)
        sprites.push(s)
        nY -= nameWordH + nameGapY
      }

      const portfolioH = textH * 0.70
      const portfolio = makeCanvasSprite("PORTAFOLIO", portfolioH, dpr, goldGradient)
      placeRight(portfolio, 0, nY - gapY * 0.5)
      nameGroup.add(portfolio)
      sprites.push(portfolio)

      const nameBox = new THREE.Box3().setFromObject(nameGroup)
      const nameCenter = new THREE.Vector3()
      nameBox.getCenter(nameCenter)
      nameGroup.position.set(-nameCenter.x, -nameCenter.y, 0)
      nameGroup.position.x = -gapX * 4
      nameGroup.position.y = vh * 0.60
      scene.add(nameGroup)

      const titleGroup = new THREE.Group()
      const titleLines = [
        "MID LEVEL",
        "FULL STACK ENGINEER",
        "| AI & AUTOMATION",
        "ARCHITECT",
      ]
      const titleLineH = textH * 0.40
      const titleGapY = gapY * 0.4
      const titleSprites = titleLines.map(l =>
        makeMetallicSprite(l, titleLineH, dpr, brightGold.c1, brightGold.c2, brightGold.hl, brightGold.sp)
      )

      let tY = 0
      for (const s of titleSprites) {
        placeLeft(s, 0, tY)
        titleGroup.add(s)
        sprites.push(s)
        tY -= titleLineH + titleGapY
      }

      const titleBox = new THREE.Box3().setFromObject(titleGroup)
      const titleCenter = new THREE.Vector3()
      titleBox.getCenter(titleCenter)
      titleGroup.position.set(-titleCenter.x, -titleCenter.y, 0)
      titleGroup.position.x = gapX * 4
      titleGroup.position.y = -vh * 0.60
      scene.add(titleGroup)

      return sprites
    }

    function buildSprites(gltf: any) {
      if (mode.current === "mobile") {
        allSprites = renderMobile(gltf)
      } else {
        allSprites = renderDesktop(gltf)
      }
      computeEdges()
      fireLoaded()
    }

    const loader = new GLTFLoader()
    loader.load("/model.gltf", (gltf) => {
      model = gltf.scene
      document.fonts.ready.then(() => buildSprites(gltf)).catch(() => buildSprites(gltf))
    })

    function switchMode(mobile: boolean) {
      mode.current = mobile ? "mobile" : "desktop"
      applyCameraMode(mobile)
      if (model) {
        clearSprites(allSprites, scene)
        buildSprites(model)
      }
      composer.passes.length = 0
      composer.addPass(new RenderPass(scene, camera))
      const strength = mobile ? 0.10 : 0.15
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), strength, 0.4, 0.85))
      composer.addPass(new OutputPass())
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }

    function onResize() {
      const mobile = mql.matches
      if (mobile !== (mode.current === "mobile")) {
        switchMode(mobile)
      }
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }

    mql.addEventListener("change", onResize)
    window.addEventListener("resize", onResize)

    let running = true
    const clock = new THREE.Clock()

    function animate() {
      if (!running) return
      requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
      if (model) {
        model.rotation.y += delta * 0.5
        model.position.y = Math.sin(elapsed * 0.8) * 0.15 + 0.3
      }
      for (const s of allSprites) {
        const st = s.userData.shaderTime
        if (st) st.value = elapsed
      }
      starMat.uniforms.time.value = elapsed
      stars.rotation.y += 0.0008
      composer.render()
    }
    animate()

    function onVisibilityChange() {
      if (document.hidden) {
        running = false
      } else {
        running = true
        clock.getDelta()
        animate()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      running = false
      mql.removeEventListener("change", onResize)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      renderer.dispose()
      composer.dispose()
      container.innerHTML = ""
    }
  }, [])

  return <div ref={ref} className="fixed inset-0 -z-10" />
}
