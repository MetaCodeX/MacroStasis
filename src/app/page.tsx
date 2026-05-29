"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
import { LoadingSplash } from "@/components/LoadingSplash"
import { Hero } from "@/components/Hero"
import { ScrollSections } from "@/components/ScrollSections"
import { RadioManager } from "@/lib/RadioManager"

const OriginalScene = dynamic(
  () => import("@/components/OriginalScene").then((m) => ({ default: m.OriginalScene })),
  { ssr: false },
)

const RadioHUD = dynamic(
  () => import("@/components/RadioHUD").then((m) => ({ default: m.RadioHUD })),
  { ssr: false }
)

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const [peeking, setPeeking] = useState(false)
  const [done, setDone] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const interacted = useRef(false)
  const audioAttempted = useRef(false)

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

  // Start the peeking loop after initial load
  useEffect(() => {
    if (!loaded || interacted.current) return

    const t1 = setTimeout(() => {
      if (!interacted.current) setPeeking(true)
      setTimeout(() => {
        if (!interacted.current) setPeeking(false)
      }, 1500)
    }, 4500)

    const t2 = setInterval(() => {
      if (interacted.current) return
      setPeeking(true)
      setTimeout(() => {
        if (!interacted.current) setPeeking(false)
      }, 1500)
    }, 5000)

    return () => {
      clearTimeout(t1)
      clearInterval(t2)
    }
  }, [loaded])

  // AUDIO UNLOCK LOGIC - Strictly bound to valid user gestures
  useEffect(() => {
    const unlockAudio = () => {
       if (!audioAttempted.current) {
          try {
              RadioManager.getInstance().start()

              // Verify context is running before considering it unlocked
              const ctx = RadioManager.getInstance().audioContext
              if (ctx && ctx.state === 'running') {
                  audioAttempted.current = true
                  setAudioUnlocked(true)
              } else if (ctx) {
                  ctx.resume().then(() => {
                      audioAttempted.current = true
                      setAudioUnlocked(true)
                  }).catch(() => {})
              }
          } catch (e) {
              // Ignore
          }
       }
    }

    window.addEventListener("mousedown", unlockAudio, { passive: true })
    window.addEventListener("touchstart", unlockAudio, { passive: true })
    window.addEventListener("keydown", unlockAudio, { passive: true })
    window.addEventListener("click", unlockAudio, { passive: true })

    return () => {
      window.removeEventListener("mousedown", unlockAudio)
      window.removeEventListener("touchstart", unlockAudio)
      window.removeEventListener("keydown", unlockAudio)
      window.removeEventListener("click", unlockAudio)
    }
  }, [])

  // VISUAL INTERACTION LOGIC
  useEffect(() => {
    const onVisualInteract = () => {
       interacted.current = true
       setDone(true)
       setPeeking(false)
    }

    const onScroll = () => {
      if (window.scrollY > 30) {
        onVisualInteract()
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("touchmove", onVisualInteract, { passive: true, once: true })
    window.addEventListener("mousedown", onVisualInteract, { passive: true, once: true })
    window.addEventListener("keydown", onVisualInteract, { passive: true, once: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("touchmove", onVisualInteract)
      window.removeEventListener("mousedown", onVisualInteract)
      window.removeEventListener("keydown", onVisualInteract)
    }
  }, [])

  return (
    <main className="bg-[#03050a] min-h-screen overflow-x-hidden">
      <LoadingSplash done={loaded} />

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto w-full h-full">
            <OriginalScene peeking={peeking} onLoaded={() => setLoaded(true)} />
        </div>
      </div>
      
      <Hero peeking={peeking} done={done} />
      
      <ScrollSections />

      <RadioHUD audioUnlocked={audioUnlocked} visualUnlocked={done} />
    </main>
  )
}
