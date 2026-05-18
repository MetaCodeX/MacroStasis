"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { LoadingSplash } from "@/components/LoadingSplash"
import { Hero } from "@/components/Hero"
import { ScrollSections } from "@/components/ScrollSections"

const OriginalScene = dynamic(
  () => import("@/components/OriginalScene").then((m) => ({ default: m.OriginalScene })),
  { ssr: false },
)

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <LoadingSplash done={loaded} />
      <OriginalScene onLoaded={() => setLoaded(true)} />
      <Hero />
      <ScrollSections />
    </>
  )
}
