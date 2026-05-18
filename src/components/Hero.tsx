"use client"

import { useEffect, useState } from "react"

export function Hero() {
  const [hintActive, setHintActive] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)")
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const interval = setInterval(() => {
      setHintActive(true)
      setTimeout(() => setHintActive(false), 1500)
    }, 4000)
    return () => clearInterval(interval)
  }, [isMobile])

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-12 select-none pointer-events-none">
      <div className={`flex gap-6 text-sm font-[300] tracking-[0.25em] text-white/40 uppercase mb-8 transition-all duration-700 ${hintActive ? "translate-y-[-6px] opacity-100" : "opacity-60"}`}>
        <span>Desliza para continuar</span>
      </div>

      <div className={`flex flex-col items-center gap-1 text-white/20 transition-all duration-700 ${hintActive ? "translate-y-[4px] opacity-80" : "opacity-40"}`}>
        <span className="block h-6 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
        <svg className="h-4 w-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14m0 0-6-6m6 6 6-6" />
        </svg>
      </div>
    </div>
  )
}
