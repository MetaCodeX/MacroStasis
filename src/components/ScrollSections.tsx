"use client"

import { useEffect, useRef, useState } from "react"
import {
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Theme,
  Separator,
  Callout,
  SegmentedControl,
  HoverCard,
  Tooltip,
  IconButton,
  Link,
  DataList,
} from "@radix-ui/themes"
import ConstellationBackground from "./ConstellationBackground"
import { cvData } from "@/lib/cvData"

const GLITCH_FONTS = [
  "font-mono",
  "font-serif italic",
  "font-sans font-black",
  "font-mono tracking-[0.2em]",
  "font-serif font-bold tracking-widest",
  "font-sans tracking-tighter"
]
const GLITCH_CHARS = "!<>-_\\\\/[]{}—=+*^?#________"

// SVGs
const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
)

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
)

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
)

const IconGlobe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
)

const IconGithub = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
)

const IconLinkedin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
)

const IconExternal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '4px' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
)

const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"></path></svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)

const IconRepo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
)

// Interface definitions for GitHub integration
interface GithubDay {
  contributionCount: number
  date: string
  weekday: number
}

interface GithubWeek {
  contributionDays: GithubDay[]
}

interface CommitNode {
  message: string
  committedDate: string
  oid: string
  branch?: string
  isDefault?: boolean
}

interface RepoNode {
  name: string
  description: string | null
  url: string
  primaryLanguage: {
    name: string
  } | null
  recentCommits?: CommitNode[]
}

interface GithubData {
  user?: {
    contributionsCollection?: {
      contributionCalendar?: {
        totalContributions: number
        weeks: GithubWeek[]
      }
    }
    repositories?: {
      nodes: RepoNode[]
    }
  }
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible")
          observer.unobserve(el)
        }
      },
      { threshold: 0.01 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

function GlitchHeader({ words, subtitle }: { words: string[]; subtitle: string }) {
  const [text, setText] = useState(words[0])
  const [fontClass, setFontClass] = useState(GLITCH_FONTS[0])
  const revealRef = useScrollReveal()

  useEffect(() => {
    let currentWordIndex = 0
    let timeoutId: any
    let frameId: number

    // Sync state to current language words
    setText(words[0])

    const nextWord = () => {
      currentWordIndex = (currentWordIndex + 1) % words.length
      const targetWord = words[currentWordIndex]
      const targetFont = GLITCH_FONTS[currentWordIndex % GLITCH_FONTS.length]

      const scrambleDuration = 400
      const resolveDuration = 600
      const startTime = performance.now()

      setFontClass(targetFont)

      const animate = (time: number) => {
        const elapsed = time - startTime

        if (elapsed < scrambleDuration) {
          let scrambled = ""
          for (let i = 0; i < targetWord.length; i++) {
            scrambled += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          }
          setText(scrambled)
          frameId = requestAnimationFrame(animate)
        } else if (elapsed < scrambleDuration + resolveDuration) {
          const resolveProgress = (elapsed - scrambleDuration) / resolveDuration
          const resolvedCount = Math.floor(resolveProgress * targetWord.length)

          let currentStr = targetWord.substring(0, resolvedCount)
          for (let i = resolvedCount; i < targetWord.length; i++) {
            currentStr += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          }
          setText(currentStr)
          frameId = requestAnimationFrame(animate)
        } else {
          setText(targetWord)
          timeoutId = setTimeout(nextWord, 2500)
        }
      }

      frameId = requestAnimationFrame(animate)
    }

    timeoutId = setTimeout(nextWord, 2500)
    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(frameId)
    }
  }, [words])

  return (
    <div ref={revealRef} className="flex flex-col items-center justify-center w-full pt-10 pb-4 px-6">
      <style>{`
        .reveal-text {
          transform: translateY(100%);
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .visible .reveal-text {
          transform: translateY(0);
        }
      `}</style>
      <div className="overflow-hidden mb-3 py-1 px-4">
        <Heading
          as="h2"
          size={{ initial: "2", sm: "3", md: "4" }}
          weight="light"
          color="gold"
          className="reveal-text uppercase text-center tracking-[0.15em] sm:tracking-[0.3em]"
        >
          {subtitle}
        </Heading>
      </div>
      <div className="h-16 md:h-20 flex items-center justify-center min-w-[300px]">
        <h1 className={`text-4xl sm:text-5xl md:text-6xl text-[#ffd700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] uppercase text-center transition-all duration-300 ${fontClass}`}>
          {text}
        </h1>
      </div>
    </div>
  )
}

const CopyButton = ({ text, lang }: { text: string; lang: 'es' | 'en' }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Tooltip content={copied ? (lang === 'es' ? "¡Copiado!" : "Copied!") : (lang === 'es' ? "Copiar al portapapeles" : "Copy to clipboard")}>
      <IconButton
        variant="ghost"
        size="1"
        style={{ color: '#ffd700', cursor: 'pointer', marginLeft: '6px' }}
        onClick={handleCopy}
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        )}
      </IconButton>
    </Tooltip>
  )
}

function formatRelativeTime(dateStr: string, lang: 'es' | 'en'): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (isNaN(date.getTime())) {
    return dateStr
  }

  if (diffSecs < 60) {
    return lang === 'es' ? 'hace un momento' : 'just now'
  }
  if (diffMins < 60) {
    return lang === 'es' ? `hace ${diffMins} min` : `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return lang === 'es' ? `hace ${diffHours} hr${diffHours > 1 ? 's' : ''}` : `${diffHours}h ago`
  }
  if (diffDays < 30) {
    return lang === 'es' ? `hace ${diffDays} día${diffDays > 1 ? 's' : ''}` : `${diffDays}d ago`
  }
  
  return date.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function generateMockGithubData(): GithubData {
  const weeks: GithubWeek[] = []
  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setDate(today.getDate() - 365)
  
  const startDay = new Date(oneYearAgo)
  startDay.setDate(startDay.getDate() - startDay.getDay()) // align to Sunday
  
  let current = new Date(startDay)
  let totalContributions = 0
  
  for (let w = 0; w < 53; w++) {
    const contributionDays: GithubDay[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split("T")[0]
      let count = 0
      const rand = Math.random()
      if (rand > 0.65) {
        if (rand <= 0.8) count = Math.floor(Math.random() * 2) + 1
        else if (rand <= 0.92) count = Math.floor(Math.random() * 3) + 3
        else if (rand <= 0.98) count = Math.floor(Math.random() * 4) + 6
        else count = Math.floor(Math.random() * 5) + 10
      }
      
      if (current <= today) {
        totalContributions += count
        contributionDays.push({
          contributionCount: count,
          date: dateStr,
          weekday: d,
        })
      } else {
        contributionDays.push({
          contributionCount: 0,
          date: dateStr,
          weekday: d,
        })
      }
      current.setDate(current.getDate() + 1)
    }
    weeks.push({ contributionDays })
  }  const mockRepos: RepoNode[] = [
    {
      name: "parhelion-sim",
      description: "Real-time logistics network simulator modeling fleet dispatching, road congestion, and carrier assignment",
      url: "https://github.com/MetaCodeX/parhelion-sim",
      primaryLanguage: { name: "Python" },
      recentCommits: [
        {
          message: "feat: Add concurrent stress tests with Pytest and live simulation visualizer",
          committedDate: new Date(Date.now() - 1 * 3600000 * 24).toISOString(),
          oid: "f83a210f6be7290c01a24d2719a97bcfa811cd49",
          branch: "main",
          isDefault: true
        },
        {
          message: "refactor: Optimize dynamic routing algorithms for large scale grids",
          committedDate: new Date(Date.now() - 3 * 3600000 * 24).toISOString(),
          oid: "a843b22cf283c847b7118228399a9b9cb128ef3c",
          branch: "feature/optimize",
          isDefault: false
        }
      ]
    },
    {
      name: "URMONY",
      description: "Fintech loan lifecycle engine: amortization tables, 2FA OTP, JWT cookies and encrypted PII",
      url: "https://github.com/MetaCodeX/URMONY",
      primaryLanguage: { name: "FastAPI" },
      recentCommits: [
        {
          message: "feat: Implement loan amortization PDF generator and automated mail notification",
          committedDate: new Date(Date.now() - 2 * 3600000 * 24).toISOString(),
          oid: "c82f09ba0fb82937cd21a1178229a9b3cb128ef87",
          branch: "main",
          isDefault: true
        },
        {
          message: "security: Enforce JWT HttpOnly cookies with CSRF double submit tokens",
          committedDate: new Date(Date.now() - 5 * 3600000 * 24).toISOString(),
          oid: "9f82d22cf283c847b7118228399a9b9cb128ef3c",
          branch: "main",
          isDefault: true
        }
      ]
    },
    {
      name: "Quantext",
      description: "Adaptive AI multi-agent orchestrator utilizing KV-cache quantization for low-memory GPU inference",
      url: "https://github.com/Caperro18/Quantext",
      primaryLanguage: { name: "TypeScript" },
      recentCommits: [
        {
          message: "feat(auth): limitar sesiones refresh activas por usuario con revocacion",
          committedDate: new Date(Date.now() - 4 * 3600000 * 24).toISOString(),
          oid: "d8eaa370fb82937cd21a1178229a9b3cb120a2f",
          branch: "main",
          isDefault: true
        },
        {
          message: "perf: Implement adaptive KV-cache quantization on local Llama 3 runner",
          committedDate: new Date(Date.now() - 10 * 3600000 * 24).toISOString(),
          oid: "b103e22cf283c847b7118228399a9b9cb128ef3c",
          branch: "dev",
          isDefault: false
        }
      ]
    },
    {
      name: "OmniDocs",
      description: "Declarative Enterprise Architecture Document Engine parsing custom notations via AST and RAG pipelines",
      url: "https://github.com/MetaCodeX/OmniDocs",
      primaryLanguage: { name: "Go" },
      recentCommits: [
        {
          message: "docs: Update README with comprehensive enterprise deployment guidelines",
          committedDate: new Date(Date.now() - 3 * 3600000 * 24).toISOString(),
          oid: "9003c570f80e7290c01a24d2719a97bcfae8110b",
          branch: "main",
          isDefault: true
        },
        {
          message: "feat: Implement AST parser for markdown directives and metadata extraction",
          committedDate: new Date(Date.now() - 5 * 3600000 * 24).toISOString(),
          oid: "aef381b1d283c847b7118228399a9b9cb1281ef1",
          branch: "main",
          isDefault: true
        }
      ]
    },
    {
      name: "proyecto-rio",
      description: "IoT flood forecasting system for Cazones River utilizing ESP32 ultrasonic sensors and TensorFlow Lite",
      url: "https://github.com/MetaCodeX/proyecto-rio",
      primaryLanguage: { name: "C++" },
      recentCommits: [
        {
          message: "feat: Deploy TensorFlow Lite micro model for local flood prediction",
          committedDate: new Date(Date.now() - 6 * 3600000 * 24).toISOString(),
          oid: "82bc01a0fb82937cd21a1178229a9b3cb128ef3c",
          branch: "main",
          isDefault: true
        },
        {
          message: "refactor: Optimize ESP32 deep sleep interval based on battery telemetrics",
          committedDate: new Date(Date.now() - 12 * 3600000 * 24).toISOString(),
          oid: "732b122cf283c847b7118228399a9b9cb128efcb",
          branch: "main",
          isDefault: true
        }
      ]
    },
    {
      name: "parhelion-wms",
      description: "Enterprise multi-tenant Warehouse/Transportation Management System (WMS/TMS) with .NET 8 and n8n",
      url: "https://github.com/MetaCodeX/parhelion-wms",
      primaryLanguage: { name: "C#" },
      recentCommits: [
        {
          message: "feat: Integrate geo-spatial Haversine routing for driver dispatching",
          committedDate: new Date(Date.now() - 8 * 3600000 * 24).toISOString(),
          oid: "cf2831a0fb82937cd21a1178229a9b3cb128ef87",
          branch: "main",
          isDefault: true
        },
        {
          message: "refactor: Implement multi-tenant schema isolation using EF Core global filters",
          committedDate: new Date(Date.now() - 14 * 3600000 * 24).toISOString(),
          oid: "a238222cf283c847b7118228399a9b9cb128ef3c",
          branch: "feature/multi-tenant",
          isDefault: false
        }
      ]
    },
    {
      name: "macrostasis-next",
      description: "Interactive portfolio and personal 3D web experience built with Next.js, Radix UI Themes, and Three.js",
      url: "https://github.com/MetaCodeX/macrostasis-next",
      primaryLanguage: { name: "TypeScript" },
      recentCommits: [
        {
          message: "feat: Integrate gold-themed GitHub Activity Grid and live Commit Tracker",
          committedDate: new Date().toISOString(),
          oid: "fb904a5cf80e7290c01a24d2719a97bcfae8188ea",
          branch: "main",
          isDefault: true
        },
        {
          message: "style: Correct footer alignment, update contact links to macrostasis.dev domain",
          committedDate: new Date(Date.now() - 2 * 3600000).toISOString(),
          oid: "bd904a5cf80e7290c01a24d2719a97bcfae8a0d8",
          branch: "main",
          isDefault: true
        }
      ]
    },
    {
      name: "k3s-gitops",
      description: "GitOps infrastructure repository for self-managed K3s cluster deployments and PostgreSQL backups",
      url: "https://github.com/MetaCodeX/k3s-gitops",
      primaryLanguage: { name: "Shell" },
      recentCommits: [
        {
          message: "feat: Setup automated Traefik Ingress routing and Let's Encrypt certificates",
          committedDate: new Date(Date.now() - 9 * 3600000 * 24).toISOString(),
          oid: "5e3c22a0fb82937cd21a1178229a9b3cb128efd9",
          branch: "main",
          isDefault: true
        },
        {
          message: "cron: Schedule daily offsite backups for PostgreSQL db instances to OCI bucket",
          committedDate: new Date(Date.now() - 15 * 3600000 * 24).toISOString(),
          oid: "bd29cb1dcf283c847b7118228399a9b9cb128efcb",
          branch: "main",
          isDefault: true
        }
      ]
    }
  ]
  
  return {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions,
          weeks,
        }
      },
      repositories: {
        nodes: mockRepos,
      }
    }
  }
}

const SkeletonCalendar = () => (
  <div className="w-full space-y-2 animate-pulse bg-[#070b12] border border-white/5 rounded-lg p-6">
    <Flex justify="between" className="mb-6">
      <Box className="space-y-2">
        <div className="h-5 bg-white/5 rounded w-48"></div>
        <div className="h-3 bg-white/5 rounded w-64"></div>
      </Box>
      <div className="h-6 bg-white/5 rounded w-24"></div>
    </Flex>
    <div className="flex gap-2 pt-2">
      <div className="grid grid-rows-7 gap-1 pt-[13px] select-none">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-2.5 w-6 bg-white/5 rounded-sm"></div>
        ))}
      </div>
      <div className="flex-1 overflow-x-auto pb-2">
        <div className="h-3 bg-white/5 rounded w-full mb-1.5"></div>
        <div className="grid grid-flow-col gap-1 auto-cols-max" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
          {Array.from({ length: 53 }).map((_, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1">
              {Array.from({ length: 7 }).map((_, dIdx) => (
                <div key={dIdx} className="w-2.5 h-2.5 bg-white/5 rounded-sm"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const SkeletonRepos = () => (
  <div className="space-y-6 mt-8">
    <div className="h-6 bg-white/5 rounded w-48 animate-pulse"></div>
    <Grid columns={{ initial: "1", sm: "2" }} gap="6" className="animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} variant="surface" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
          <Flex justify="between" align="center" className="mb-4">
            <div className="h-5 bg-white/5 rounded w-32"></div>
            <div className="h-4 bg-white/5 rounded w-16"></div>
          </Flex>
          <div className="h-4 bg-white/5 rounded w-full mb-6"></div>
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded w-[90%]"></div>
            <div className="h-3 bg-white/5 rounded w-[85%]"></div>
            <div className="h-3 bg-white/5 rounded w-[80%]"></div>
          </div>
        </Card>
      ))}
    </Grid>
  </div>
)

function GithubSection({ lang }: { lang: 'es' | 'en' }) {
  const [data, setData] = useState<GithubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const sectionRef = useScrollReveal()
  const calendarScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && calendarScrollRef.current) {
      const scroll = () => {
        if (calendarScrollRef.current) {
          calendarScrollRef.current.scrollLeft = calendarScrollRef.current.scrollWidth - calendarScrollRef.current.clientWidth
        }
      }
      scroll()
      const timer1 = setTimeout(scroll, 100)
      const timer2 = setTimeout(scroll, 500)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [loading, data, lang])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/github")
        if (!res.ok) {
          throw new Error("Failed to fetch github data")
        }
        const json = await res.json()
        if (json.error || !json.user) {
          throw new Error(json.error || "Invalid response data")
        }
        setData(json)
      } catch (err) {
        console.error("Error fetching live GitHub data, falling back to mock:", err)
        setData(generateMockGithubData())
        setIsMock(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const calendar = data?.user?.contributionsCollection?.contributionCalendar
  const repos = data?.user?.repositories?.nodes?.slice(0, 8) || []

  // Month labels logic
  const monthLabels: { text: string; colSpan: number }[] = []
  if (calendar?.weeks) {
    let currentMonth = ""
    let colCount = 0

    calendar.weeks.forEach((week) => {
      const day = week.contributionDays[0] || week.contributionDays.find(d => d !== null)
      if (day) {
        const dateObj = new Date(day.date + "T00:00:00")
        const monthName = dateObj.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'short' })
        if (monthName !== currentMonth) {
          if (colCount > 0) {
            monthLabels.push({ text: currentMonth, colSpan: colCount })
          }
          currentMonth = monthName
          colCount = 1
        } else {
          colCount++
        }
      } else {
        colCount++
      }
    })
    if (colCount > 0) {
      monthLabels.push({ text: currentMonth, colSpan: colCount })
    }
  }

  return (
    <section id="github" ref={sectionRef} className="scroll-section mx-auto max-w-5xl px-4 sm:px-6 py-20">
      <Heading as="h2" size="2" weight="light" color="gold" style={{ letterSpacing: '0.3em' }} className="uppercase mb-2">
        GITHUB HUB
      </Heading>
      <Heading as="h3" size="7" weight="light" style={{ letterSpacing: '0.05em' }} className="text-white/95 mb-10">
        {lang === 'es' ? 'Actividad y Código Reciente' : 'Activity & Recent Code'}
      </Heading>

      {loading ? (
        <div className="space-y-12">
          <SkeletonCalendar />
          <SkeletonRepos />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Calendar Grid Container */}
          <div className="relative w-full bg-[#070b12] border border-white/5 rounded-lg p-6 overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,215,0,0.02),transparent_45%)] before:pointer-events-none">
            <Flex justify="between" align="center" className="mb-6 flex-wrap gap-2">
              <Box>
                <Heading as="h4" size="3" className="text-white font-semibold uppercase tracking-wider">
                  {lang === 'es' ? 'Calendario de Contribuciones' : 'Contribution Calendar'}
                </Heading>
                <Text size="1" className="text-white/40 block mt-0.5">
                  {lang === 'es' ? 'Últimos 12 meses de commits y push' : 'Last 12 months of commits and pushes'}
                </Text>
              </Box>
              <Badge size="2" color="gold" variant="surface" className="font-mono">
                {calendar?.totalContributions.toLocaleString()} {lang === 'es' ? 'contribuciones' : 'contributions'}
              </Badge>
            </Flex>

            {/* Grid Scrolling Area */}
            <div 
              ref={calendarScrollRef}
              className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent w-full flex gap-2"
            >
              {/* Sticky Weekdays Column */}
              <div className="sticky left-0 bg-[#070b12] z-10 pr-3 select-none shrink-0 flex flex-col font-mono text-[9px] text-white/40">
                {/* Spacer to match month labels row height */}
                <div className="text-[9px] mb-1.5 font-mono opacity-0 select-none">M</div>
                
                <div className="grid grid-rows-7 gap-1">
                  <div className="h-2.5 flex items-center" />
                  <div className="h-2.5 flex items-center">{lang === 'es' ? 'Lun' : 'Mon'}</div>
                  <div className="h-2.5 flex items-center" />
                  <div className="h-2.5 flex items-center">{lang === 'es' ? 'Mié' : 'Wed'}</div>
                  <div className="h-2.5 flex items-center" />
                  <div className="h-2.5 flex items-center">{lang === 'es' ? 'Vie' : 'Fri'}</div>
                  <div className="h-2.5 flex items-center" />
                </div>
              </div>

              {/* Scrolling grid */}
              <div className="flex flex-col">
                {/* Month labels */}
                <div className="flex text-[9px] text-white/40 mb-1.5 font-mono select-none">
                  {monthLabels.map((label, idx) => (
                    <div 
                      key={idx} 
                      style={{ width: `${label.colSpan * 14}px` }} 
                      className="truncate text-left pr-1"
                    >
                      {label.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1">
                  {calendar?.weeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-rows-7 gap-1">
                      {Array.from({ length: 7 }).map((_, dIdx) => {
                        const day = week.contributionDays.find(d => d.weekday === dIdx)
                        if (!day) return <div key={dIdx} className="w-2.5 h-2.5 bg-transparent" />
                        
                        let color = "bg-[#131720]"
                        if (day.contributionCount > 0) {
                          if (day.contributionCount <= 2) color = "bg-[#ffd700]/20"
                          else if (day.contributionCount <= 5) color = "bg-[#ffd700]/50"
                          else if (day.contributionCount <= 8) color = "bg-[#ffd700]/80"
                          else color = "bg-[#ffd700]"
                        }
                        
                        const dateObj = new Date(day.date + "T00:00:00")
                        const formattedDate = dateObj.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        const tooltipText = lang === 'es'
                          ? `${day.contributionCount} contribuciones el ${formattedDate}`
                          : `${day.contributionCount} contributions on ${formattedDate}`

                        return (
                          <Tooltip key={day.date || dIdx} content={tooltipText}>
                            <div className={`w-2.5 h-2.5 rounded-sm ${color} hover:ring-1 hover:ring-[#ffd700] transition-all duration-100 cursor-pointer`} />
                          </Tooltip>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 font-mono">
              <span>
                {isMock 
                  ? (lang === 'es' ? '⚠️ Datos simulados' : '⚠️ Cached calendar data') 
                  : (lang === 'es' ? '✔ Sincronizado en tiempo real' : '✔ Live synced data')}
              </span>
              <div className="flex items-center gap-1.5 select-none">
                <span>{lang === 'es' ? 'Menos' : 'Less'}</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-[#131720]" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#ffd700]/20" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#ffd700]/50" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#ffd700]/80" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#ffd700]" />
                <span>{lang === 'es' ? 'Más' : 'More'}</span>
              </div>
            </div>
          </div>

          {/* Repositories & Commits Grid */}
          <div className="space-y-6">
            <Heading as="h4" size="4" color="gold" className="uppercase tracking-wider">
              {lang === 'es' ? 'Repositorios Más Activos' : 'Most Active Repositories'}
            </Heading>
            
            <Grid columns={{ initial: "1", sm: "2" }} gap="6">
              {repos.map((repo, idx) => {
                const commits = repo.recentCommits || []
                return (
                  <Card
                    key={idx}
                    variant="surface"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    className="hover:border-gold/30 hover:shadow-[0_4px_20px_rgba(255,215,0,0.03)] transition-all duration-300 group/card p-5 sm:p-6"
                  >
                    <Box>
                      <Flex justify="between" align="center" className="mb-3 flex-wrap gap-2">
                        <Flex align="center" gap="2">
                          <IconRepo />
                          <Link 
                            href={repo.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            color="gold" 
                            className="hover:underline font-bold text-[15px]"
                          >
                            {repo.name}
                          </Link>
                        </Flex>
                        {repo.primaryLanguage && (
                          <Badge size="1" color="gold" variant="surface" className="font-mono">
                            {repo.primaryLanguage.name}
                          </Badge>
                        )}
                      </Flex>

                      <Text as="p" size="2" className="text-white/60 leading-relaxed font-light mb-4 line-clamp-2">
                        {repo.description || (lang === 'es' ? "Sin descripción disponible." : "No description available.")}
                      </Text>

                      {/* Commits */}
                      {commits.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <Text size="1" className="text-white/30 uppercase tracking-widest block mb-3 font-mono text-[9px]">
                            {lang === 'es' ? 'Últimas Modificaciones' : 'Recent Modifications'}
                          </Text>
                          <div className="space-y-3 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                            {commits.map((commit) => (
                              <div key={commit.oid} className="relative pl-5 group/commit">
                                {/* Bullet */}
                                <span className="absolute left-[3px] top-[5px] w-1.5 h-1.5 rounded-full border border-[#03050a] bg-white/20 group-hover/commit:bg-[#ffd700] group-hover/commit:scale-125 transition-all duration-200" />
                                
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[12px] text-white/70 line-clamp-1 group-hover/commit:text-white transition-colors duration-200">
                                    {commit.message}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-white/40 flex-wrap">
                                    <Link
                                      href={`${repo.url}/commit/${commit.oid}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[#ffd700]/70 hover:text-[#ffd700] hover:underline shrink-0"
                                    >
                                      {commit.oid.substring(0, 7)}
                                    </Link>
                                    <span>•</span>
                                    {commit.branch && (
                                      <>
                                        <Badge size="1" color={commit.isDefault ? "gold" : "blue"} variant="surface" className="font-mono text-[9px] py-0 px-1.5 shrink-0 select-none uppercase tracking-wider font-semibold">
                                          {commit.branch}
                                        </Badge>
                                        <span>•</span>
                                      </>
                                    )}
                                    <span className="shrink-0">{formatRelativeTime(commit.committedDate, lang)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-white/5 text-[12px] text-white/40 italic">
                          {lang === 'es' ? 'No se encontraron commits recientes.' : 'No recent commits found.'}
                        </div>
                      )}
                    </Box>
                  </Card>
                )
              })}
            </Grid>
          </div>
        </div>
      )}
    </section>
  )
}

const projectGithubLinks: Record<string, string> = {
  "OmniDocs": "https://github.com/MetaCodeX/OmniDocs",
  "Quantext": "https://github.com/Caperro18/Quantext",
  "Proyecto Río": "https://github.com/MetaCodeX/proyecto-rio",
  "URMONY": "https://github.com/MetaCodeX/URMONY",
  "Parhelion Logistics": "https://github.com/MetaCodeX/parhelion-wms",
  "Parhelion Simulator": "https://github.com/MetaCodeX/parhelion-sim",
  "MacroStasis Portfolio": "https://github.com/MetaCodeX/macrostasis-next"
}

export function ScrollSections() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const aboutRef = useScrollReveal()
  const expRef = useScrollReveal()
  const projRef = useScrollReveal()
  const skillsRef = useScrollReveal()
  const otherRef = useScrollReveal()

  const data = cvData[lang]

  return (
    <Theme appearance="dark" accentColor="gold" grayColor="slate" panelBackground="translucent">
      <div className="relative z-20 mt-[100vh] bg-[#03050a] text-white w-full overflow-x-hidden">
        <ConstellationBackground />
        
        {/* Sticky Header and Language Toggle */}
        <div className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#03050a]/90 border-b border-white/5 py-4 px-4 sm:px-6 lg:px-12 flex justify-between items-center transition-all duration-300">
          <Flex align="center" gap={{ initial: "2", sm: "3" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd700] animate-pulse drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
            <Heading as="h3" size={{ initial: "1", sm: "3" }} weight="medium" style={{ letterSpacing: '0.1em' }} className="text-white uppercase whitespace-nowrap">
              <span className="inline md:hidden">C. E. JUAREZ</span>
              <span className="hidden md:inline xl:hidden">CARLOS JUAREZ</span>
              <span className="hidden xl:inline">{data.name}</span>
            </Heading>
          </Flex>
          <Flex align="center" gap={{ initial: "2", sm: "3", md: "4" }}>
            <Flex gap={{ initial: "2", lg: "3" }} className="hidden md:flex text-[10px] lg:text-[11px] uppercase tracking-wider text-white/50">
              <Link href="#about" color="gray" className="hover:text-[#ffd700] transition-colors">{lang === 'es' ? 'Perfil' : 'Profile'}</Link>
              <Link href="#experience" color="gray" className="hover:text-[#ffd700] transition-colors">
                <span className="hidden lg:inline">{lang === 'es' ? 'Experiencia' : 'Experience'}</span>
                <span className="inline lg:hidden">{lang === 'es' ? 'Exp.' : 'Exp.'}</span>
              </Link>
              <Link href="#projects" color="gray" className="hover:text-[#ffd700] transition-colors">
                <span className="hidden lg:inline">{lang === 'es' ? 'Proyectos' : 'Projects'}</span>
                <span className="inline lg:hidden">{lang === 'es' ? 'Proy.' : 'Proj.'}</span>
              </Link>
              <Link href="#github" color="gray" className="hover:text-[#ffd700] transition-colors">GitHub</Link>
              <Link href="#skills" color="gray" className="hover:text-[#ffd700] transition-colors">
                <span className="hidden lg:inline">{lang === 'es' ? 'Tecnologías' : 'Tech Stack'}</span>
                <span className="inline lg:hidden">{lang === 'es' ? 'Tec.' : 'Tech'}</span>
              </Link>
              <Link href="#achievements" color="gray" className="hover:text-[#ffd700] transition-colors">
                <span className="hidden lg:inline">{lang === 'es' ? 'Logros' : 'Achievements'}</span>
                <span className="inline lg:hidden">{lang === 'es' ? 'Logros' : 'Awards'}</span>
              </Link>
            </Flex>
            <SegmentedControl.Root size="2" value={lang} onValueChange={(v: any) => setLang(v)} style={{ border: '1px solid rgba(255,215,0,0.1)' }}>
              <SegmentedControl.Item value="es" style={{ cursor: 'pointer' }}>ES</SegmentedControl.Item>
              <SegmentedControl.Item value="en" style={{ cursor: 'pointer' }}>EN</SegmentedControl.Item>
            </SegmentedControl.Root>
          </Flex>
        </div>

        <div className="relative z-10">
          <GlitchHeader words={data.glitchWords} subtitle={data.heroSubtitle} />

          {/* PROFILE / ABOUT SECTION */}
          <section id="about" ref={aboutRef} className="scroll-section mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-20">
            <Heading as="h2" size="2" weight="light" color="gold" style={{ letterSpacing: '0.3em' }} className="uppercase mb-2">
              {lang === 'es' ? 'PERFIL Y CONTACTO' : 'PROFILE & CONTACT'}
            </Heading>
            <Heading as="h3" size="7" weight="light" style={{ letterSpacing: '0.05em' }} className="text-white/95 mb-10">
              {lang === 'es' ? 'Quién Soy & Datos Clave' : 'Who I Am & Key Contact'}
            </Heading>

            <Grid columns={{ initial: "1", md: "5" }} gap="6" width="auto">
              <Box className="md:col-span-3 space-y-6">
                <Card variant="surface" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="p-5 sm:p-6">
                  <Heading as="h4" size="4" color="gold" className="mb-3 uppercase tracking-wider">
                    {data.profileTitle}
                  </Heading>
                  <Text as="p" size="3" className="leading-relaxed text-white/70 font-light">
                    {data.profile}
                  </Text>
                </Card>

                <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                  <Card variant="surface" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="p-4 sm:p-5">
                    <Heading as="h4" size="3" color="gold" className="mb-3 uppercase tracking-wider">
                      {data.strengthsTitle}
                    </Heading>
                    <ul className="space-y-2 text-[13px] text-white/60 font-light">
                      {data.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-0.5"><IconCheck /></span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card variant="surface" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="p-4 sm:p-5">
                    <Heading as="h4" size="3" color="gold" className="mb-3 uppercase tracking-wider">
                      {data.softSkillsTitle}
                    </Heading>
                    <Flex wrap="wrap" gap="2">
                      {data.softSkills.map((skill, idx) => (
                        <Badge key={idx} size="1" color="gold" variant="outline" radius="medium">
                          {skill}
                        </Badge>
                      ))}
                    </Flex>
                  </Card>
                </Grid>
              </Box>

               <Box className="md:col-span-2">
                <Card variant="surface" style={{ height: '100%', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="flex flex-col justify-between p-5 sm:p-6">
                  <Box>
                    <Heading as="h4" size="4" color="gold" className="mb-4 uppercase tracking-wider">
                      {lang === 'es' ? 'Datos de Contacto' : 'Contact Information'}
                    </Heading>
                    <Separator size="4" className="my-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    
                    {/* Location detail in prominent box */}
                    <Box className="mb-4 flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <IconMapPin />
                      <Box>
                        <Text size="1" className="text-white/40 uppercase tracking-widest block font-mono text-[9px]">
                          {data.locationLabel}
                        </Text>
                        <Text size="2" className="text-white/85 font-medium">
                          {data.locationValue}
                        </Text>
                      </Box>
                    </Box>

                    <Separator size="4" className="my-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    
                    <DataList.Root size="2" className="space-y-4" orientation={{ initial: "vertical", sm: "horizontal" }}>
                      {data.contact.map((item) => (
                        <DataList.Item key={item.key} align="center">
                          <DataList.Label className="text-white/40 flex items-center gap-2">
                            {item.key === 'phone' && <IconPhone />}
                            {item.key === 'email' && <IconMail />}
                            {item.key === 'web' && <IconGlobe />}
                            {item.key === 'github' && <IconGithub />}
                            {item.key === 'linkedin' && <IconLinkedin />}
                            {item.label}
                          </DataList.Label>
                          <DataList.Value className="text-white/80 flex items-center">
                            {item.href ? (
                              <Link href={item.href} target="_blank" rel="noopener noreferrer" color="gold" className="hover:underline flex items-center">
                                {item.value} <IconExternal />
                              </Link>
                            ) : (
                              item.value
                            )}
                            {item.copyable && (
                              <CopyButton text={item.value} lang={lang} />
                            )}
                          </DataList.Value>
                        </DataList.Item>
                      ))}
                    </DataList.Root>
                  </Box>

                  <Box className="mt-8 pt-6 border-t border-white/5">
                    <Heading as="h5" size="2" color="gold" className="mb-3 uppercase tracking-wider">
                      {data.languagesTitle}
                    </Heading>
                    <Box className="space-y-2">
                      {data.languages.map((l, idx) => (
                        <Flex key={idx} justify="between" align="center" className="text-[13px]">
                          <Text className="text-white/85 font-medium">{l.name}</Text>
                          <Badge size="1" variant="soft" color="gold">{l.level}</Badge>
                        </Flex>
                      ))}
                    </Box>
                  </Box>

                  <Box className="mt-6 pt-6 border-t border-white/5">
                    <a
                      href="/CV_Carlos_Juarez_MetaCodeX_2026_v10.pdf"
                      download="CV_Carlos_Juarez_MetaCodeX_2026_v10.pdf"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/20 hover:from-amber-500/20 hover:to-yellow-500/30 border border-[#ffd700]/30 hover:border-[#ffd700] text-[#ffd700] hover:text-white transition-all duration-300 py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(255,215,0,0.02)] hover:shadow-[0_0_20px_rgba(255,215,0,0.12)] text-center cursor-pointer font-mono"
                    >
                      <IconDownload />
                      {lang === 'es' ? 'Descargar CV PDF' : 'Download CV PDF'}
                    </a>
                  </Box>
                </Card>
              </Box>
            </Grid>
          </section>

          <Separator size="4" my="8" style={{ background: 'rgba(255,255,255,0.03)' }} />

          {/* EXPERIENCE SECTION */}
          <section id="experience" ref={expRef} className="scroll-section mx-auto max-w-5xl px-4 sm:px-6 py-20">
            <Heading as="h2" size="2" weight="light" color="gold" style={{ letterSpacing: '0.3em' }} className="uppercase mb-2">
              {lang === 'es' ? 'TRAYECTORIA' : 'JOURNEY'}
            </Heading>
            <Heading as="h3" size="7" weight="light" style={{ letterSpacing: '0.05em' }} className="text-white/95 mb-12">
              {data.experienceTitle}
            </Heading>

            <Box className="relative border-l border-white/10 pl-6 md:pl-8 ml-2 md:ml-4 space-y-12">
              {data.experience.map((exp, idx) => (
                <Box key={idx} className="relative group">
                  {/* Timeline Glow Dot */}
                  <div className="absolute -left-[31px] md:-left-[37px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#03050a] bg-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] transition-all duration-300 group-hover:scale-125" />
                  
                  <Box className="space-y-2">
                    <Flex justify="between" align="start" direction={{ initial: "column", sm: "row" }} gap="2">
                      <Box>
                        <Heading as="h4" size="4" weight="medium" className="text-white group-hover:text-[#ffd700] transition-colors duration-300">
                          {exp.role}
                        </Heading>
                        <Heading as="h5" size="2" weight="medium" color="gold" style={{ letterSpacing: '0.05em' }} className="mt-1">
                          {exp.company}
                        </Heading>
                      </Box>
                      <Box className="text-left sm:text-right">
                        <Badge size="2" variant="surface" color="gold" className="font-mono">
                          {exp.period}
                        </Badge>
                        <Text as="p" size="1" className="text-white/40 mt-1">
                          {exp.location}
                        </Text>
                      </Box>
                    </Flex>

                    <ul className="list-none space-y-2 mt-4 text-[14px] text-white/60 leading-relaxed font-light pl-1">
                      {exp.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-3">
                          <span className="text-[#ffd700] select-none mt-1">▸</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </Box>
                </Box>
              ))}
            </Box>
          </section>

          <Separator size="4" my="8" style={{ background: 'rgba(255,255,255,0.03)' }} />

          {/* PROJECTS SECTION */}
          <section id="projects" ref={projRef} className="scroll-section mx-auto max-w-5xl px-4 sm:px-6 py-20">
            <Heading as="h2" size="2" weight="light" color="gold" style={{ letterSpacing: '0.3em' }} className="uppercase mb-2">
              {lang === 'es' ? 'PORTAFOLIO' : 'PORTFOLIO'}
            </Heading>
            <Heading as="h3" size="7" weight="light" style={{ letterSpacing: '0.05em' }} className="text-white/95 mb-12">
              {data.projectsTitle}
            </Heading>

            <Grid columns={{ initial: "1", sm: "2" }} gap="6">
              {data.projects.map((proj, idx) => {
                const isProduction = proj.status === "PRODUCCIÓN" || proj.status === "PRODUCTION"
                const isActive = proj.status === "ACTIVO" || proj.status === "ACTIVE" || proj.status === "EN VIVO" || proj.status === "LIVE"
                const isOngoing = proj.status === "EN CURSO" || proj.status === "ONGOING"
                
                let badgeColor: "green" | "blue" | "orange" | "gold" = "gold"
                if (isProduction) badgeColor = "green"
                else if (isActive) badgeColor = "blue"
                else if (isOngoing) badgeColor = "orange"
                
                return (
                  <Card
                    key={idx}
                    variant="surface"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    className="hover:border-gold/30 hover:shadow-[0_4px_20px_rgba(255,215,0,0.03)] transition-all duration-300 p-5 sm:p-6"
                  >
                    <Box>
                      <Flex justify="between" align="center" className="mb-4">
                        <Heading as="h4" size="4" weight="bold" color="gold">
                          {proj.name}
                        </Heading>
                        <Badge size="1" color={badgeColor} variant="solid" radius="small" className="tracking-wide">
                          {proj.status}
                        </Badge>
                      </Flex>

                      <Flex wrap="wrap" gap="1" className="mb-4">
                        {proj.stack.map((s, sIdx) => (
                          <Badge key={sIdx} size="1" variant="soft" color="gray" style={{ fontSize: '10px' }}>
                            {s}
                          </Badge>
                        ))}
                      </Flex>

                      <ul className="space-y-2 text-[13px] text-white/60 font-light mb-6">
                        {proj.description.map((desc, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2">
                            <span className="text-white/30">•</span>
                            <span>{desc}</span>
                          </li>
                        ))}
                      </ul>
                    </Box>

                    <Box className="pt-4 border-t border-white/5 flex justify-between align-center">
                      <HoverCard.Root>
                        <HoverCard.Trigger>
                          <Text size="1" color="gold" className="cursor-pointer underline decoration-dotted hover:text-white transition-colors">
                            {lang === 'es' ? "Detalles del Core" : "Core details"}
                          </Text>
                        </HoverCard.Trigger>
                        <HoverCard.Content size="1" style={{ maxWidth: 300 }} className="bg-[#0b0e14] border border-white/10 text-white/80 p-3">
                          <Text as="p" size="1" className="leading-relaxed">
                            {proj.name === "OmniDocs" && (lang === 'es' ? "Utiliza un parser de Markdown AST personalizado en Go y FastAPI para extraer dependencias e inyectar flujos de trabajo asíncronos y arquitecturas de EventBus en bases vectoriales para RAG." : "Utilizes a custom Markdown AST parser in Go and FastAPI to extract dependencies, injecting asynchronous workflows and EventBus architectures into vector databases for RAG.")}
                            {proj.name === "Quantext" && (lang === 'es' ? "Desarrollado para la Hackatón de AMD del 2026 mayo-abril. Optimiza el KV-cache para paralelizar inferencia y selecciona dinámicamente modelos de IA en base a la complejidad del prompt." : "Developed for the AMD Hackathon 2026 May-April. Optimizes KV-cache to parallelize inference and dynamically selects AI models based on prompt complexity.")}
                            {proj.name === "Proyecto Río" && (lang === 'es' ? "Combina firmware de ESP32 para telemetría de sensores en tiempo real con modelos predictivos en el backend para predecir inundaciones en el Río Cazones." : "Combines ESP32 firmware for real-time sensor telemetry with predictive backend models to forecast flooding on the Cazones River.")}
                            {proj.name === "URMONY" && (lang === 'es' ? "Implementa Clean Architecture + DDD, base de datos PostgreSQL, 2FA con TOTP, JWT seguro en cookies HttpOnly y encriptación de datos sensibles." : "Implements Clean Architecture + DDD, PostgreSQL database, TOTP-based 2FA, secure JWT in HttpOnly cookies, and encryption of sensitive data.")}
                            {proj.name === "Parhelion Logistics" && (lang === 'es' ? "Backend distribuido en .NET 8 y FastAPI. Integración de n8n para análisis automatizados, enrutamiento geoespacial Haversine y sincronización móvil." : "Distributed backend in .NET 8 and FastAPI. n8n integration for automated analytics, Haversine geospatial routing, and mobile sync.")}
                            {proj.name === "Parhelion Simulator" && (lang === 'es' ? "Modela el despacho de flotas, congestión vial y asignación de transportistas en tiempo real mediante algoritmos heurísticos y FastAPI." : "Models fleet dispatching, road congestion, and carrier assignment in real time using heuristic algorithms and FastAPI.")}
                            {proj.name === "MacroStasis Portfolio" && (lang === 'es' ? "Portafolio web responsivo de alto rendimiento que integra reactividad basada en señales y renderizado 3D." : "High-performance responsive web portfolio integrating signal-based reactivity and 3D rendering.")}
                          </Text>
                        </HoverCard.Content>
                      </HoverCard.Root>

                      <Flex gap="3" align="center">
                        {projectGithubLinks[proj.name] && (
                          <Link href={projectGithubLinks[proj.name]} target="_blank" size="1" color="gold" className="flex items-center gap-1 hover:underline">
                            GitHub <IconExternal />
                          </Link>
                        )}
                        {proj.name === "MacroStasis Portfolio" && (
                          <Link href="https://macrostasis.dev" target="_blank" size="1" color="gold" className="flex items-center gap-1 hover:underline">
                            {lang === 'es' ? "Ver sitio" : "Visit site"} <IconExternal />
                          </Link>
                        )}
                      </Flex>
                    </Box>
                  </Card>
                )
              })}
            </Grid>
          </section>

          <Separator size="4" my="8" style={{ background: 'rgba(255,255,255,0.03)' }} />

          {/* GITHUB INTEGRATION SECTION */}
          <GithubSection lang={lang} />

          <Separator size="4" my="8" style={{ background: 'rgba(255,255,255,0.03)' }} />

          {/* TECHNICAL STACK SECTION */}
          <section id="skills" ref={skillsRef} className="scroll-section mx-auto max-w-5xl px-4 sm:px-6 py-20">
            <Heading as="h2" size="2" weight="light" color="gold" style={{ letterSpacing: '0.3em' }} className="uppercase mb-2">
              {lang === 'es' ? 'TECNOLOGÍAS' : 'TECH STACK'}
            </Heading>
            <Heading as="h3" size="7" weight="light" style={{ letterSpacing: '0.05em' }} className="text-white/95 mb-12">
              {data.techStackTitle}
            </Heading>

            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
              {data.techStack.map((tech, idx) => (
                <Card
                  key={idx}
                  variant="surface"
                  style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}
                  className="hover:border-gold/30 transition-all duration-300 flex flex-col justify-between p-4 sm:p-5"
                >
                  <Box>
                    <Heading as="h4" size="3" color="gold" className="mb-4 uppercase tracking-wider font-semibold">
                      {tech.category}
                    </Heading>
                    <Flex wrap="wrap" gap="2">
                      {tech.items.map((item, iIdx) => (
                        <Badge
                          key={iIdx}
                          size="2"
                          variant="outline"
                          color="gold"
                          radius="medium"
                        >
                          {item}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                </Card>
              ))}
            </Grid>
          </section>

          <Separator size="4" my="8" style={{ background: 'rgba(255,255,255,0.03)' }} />

          {/* OTHER DETAILS, EDUCATION, CTF ACHIEVEMENT */}
          <section id="achievements" ref={otherRef} className="scroll-section mx-auto max-w-5xl px-4 sm:px-6 py-20">
            <Heading as="h2" size="2" weight="light" color="gold" style={{ letterSpacing: '0.3em' }} className="uppercase mb-2">
              {lang === 'es' ? 'LOGROS Y MÁS' : 'LOGROS & MORE'}
            </Heading>
            <Heading as="h3" size="7" weight="light" style={{ letterSpacing: '0.05em' }} className="text-white/95 mb-12">
              {lang === 'es' ? 'Educación, Metodologías y Reconocimientos' : 'Education, Methodologies & Achievements'}
            </Heading>

            <Grid columns={{ initial: "1", md: "5" }} gap="6">
              <Box className="md:col-span-3 space-y-6">
                {/* EDUCATION CARD */}
                <Card variant="surface" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="p-5 sm:p-6">
                  <Heading as="h4" size="4" color="gold" className="mb-4 uppercase tracking-wider">
                    {data.educationTitle}
                  </Heading>
                  <Flex justify="between" align="start" wrap="wrap" gap="2">
                    <Box>
                      <Heading as="h5" size="3" className="text-white font-medium">
                        {data.education.degree}
                      </Heading>
                      <Text size="2" className="text-white/50 block mt-1">
                        {data.education.institution}
                      </Text>
                    </Box>
                    <Badge color="gold" variant="surface" className="font-mono">
                      {data.education.period}
                    </Badge>
                  </Flex>
                </Card>

                {/* METHODOLOGIES CARD */}
                <Card variant="surface" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="p-5 sm:p-6">
                  <Heading as="h4" size="4" color="gold" className="mb-4 uppercase tracking-wider">
                    {data.methodologiesTitle}
                  </Heading>
                  <Flex wrap="wrap" gap="2">
                    {data.methodologies.map((m, idx) => (
                      <Badge key={idx} size="2" color="gold" variant="outline" radius="full" style={{ padding: '4px 10px' }}>
                        {m}
                      </Badge>
                    ))}
                  </Flex>
                </Card>
              </Box>

              {/* ACHIEVEMENTS / CTF */}
              <Box className="md:col-span-2">
                <Card variant="surface" style={{ height: '100%', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} className="flex flex-col justify-between p-5 sm:p-6">
                  <Box className="space-y-4">
                    <Heading as="h4" size="4" color="gold" className="uppercase tracking-wider">
                      {data.achievementTitle}
                    </Heading>

                    <Callout.Root color="gold" size="2" variant="surface" style={{ background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.2)' }}>
                      <Callout.Icon className="pt-0.5">
                        <IconTrophy />
                      </Callout.Icon>
                      <Callout.Text className="space-y-2">
                        <Heading as="h5" size="3" className="text-[#ffd700] font-semibold">
                          {data.achievement.title}
                        </Heading>
                        <Text size="2" color="gold" className="block font-mono text-[11px] uppercase tracking-wider">
                          {data.achievement.event}
                        </Text>
                        <Text size="2" className="text-white/70 block font-light leading-relaxed">
                          {data.achievement.description}
                        </Text>
                        <Badge size="2" variant="solid" color="gold" className="mt-2 font-mono">
                          {data.achievement.prize}
                        </Badge>
                      </Callout.Text>
                    </Callout.Root>
                  </Box>

                  <Box className="mt-6 pt-6 border-t border-white/5">
                    <Heading as="h5" size="2" color="gold" className="mb-3 uppercase tracking-wider">
                      {lang === 'es' ? 'Otras Habilidades' : 'Other Skills'}
                    </Heading>
                    <Flex wrap="wrap" gap="1.5">
                      {data.otherSkills.map((os, idx) => (
                        <Badge key={idx} size="1" color="gray" variant="soft" style={{ fontSize: '10px' }}>
                          {os}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                </Card>
              </Box>
            </Grid>
          </section>

          {/* CONTACT & FOOTER */}
          <footer id="contact" className="bg-[#020306] border-t border-white/5 py-16 px-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-5xl flex flex-col items-center justify-center text-center space-y-6">
              <Heading as="h3" size="6" weight="light" color="gold" className="uppercase tracking-widest text-center">
                {lang === 'es' ? 'CONECTEMOS' : 'GET IN TOUCH'}
              </Heading>
              <Text as="p" size="3" className="text-white/50 max-w-lg mx-auto font-light leading-relaxed text-center">
                {lang === 'es' 
                  ? '¿Buscas un ingeniero apasionado por diseñar arquitecturas originales de alto rendimiento y automatizaciones inteligentes? Hablemos.' 
                  : 'Looking for an engineer who loves designing original high-performance architectures and intelligent automations? Let\'s talk.'}
              </Text>
              
              <Flex justify="center" align="center" gap="4" className="pt-4">
                <Tooltip content={lang === 'es' ? 'Enviar correo' : 'Send email'}>
                  <IconButton size="3" variant="solid" color="gold" radius="full" style={{ cursor: 'pointer' }} asChild>
                    <a href="mailto:metacodex@macrostasis.dev">
                      <IconMail />
                    </a>
                  </IconButton>
                </Tooltip>
                
                <Tooltip content="GitHub">
                  <IconButton size="3" variant="solid" color="gold" radius="full" style={{ cursor: 'pointer' }} asChild>
                    <a href="https://github.com/MetaCodeX" target="_blank" rel="noopener noreferrer">
                      <IconGithub />
                    </a>
                  </IconButton>
                </Tooltip>

                <Tooltip content="LinkedIn">
                  <IconButton size="3" variant="solid" color="gold" radius="full" style={{ cursor: 'pointer' }} asChild>
                    <a href="https://linkedin.com/in/metacodex" target="_blank" rel="noopener noreferrer">
                      <IconLinkedin />
                    </a>
                  </IconButton>
                </Tooltip>
              </Flex>

              <Text as="p" size="1" className="text-white/20 pt-8 font-mono text-center">
                &copy; 2026 METACODEX &middot; MACROSTASIS
              </Text>
            </div>
          </footer>
        </div>
      </div>
    </Theme>
  )
}
