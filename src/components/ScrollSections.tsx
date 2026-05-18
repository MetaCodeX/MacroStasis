"use client"

import { useEffect, useRef } from "react"

const sections = [
  {
    id: "about",
    title: "About",
    content:
      "Full-stack developer & AI automation architect with a passion for 3D web experiences, distributed systems, and building tools that make sense. I bridge the gap between design and infrastructure.",
  },
  {
    id: "skills",
    title: "Skills",
    items: [
      "React / Next.js / Vue",
      "Node / Python / Go",
      "Three.js / WebGL",
      "Docker / K8s / Cloud",
      "AI Agents / Automation",
      "System Design",
    ],
  },
  {
    id: "projects",
    title: "Projects",
    items: [
      { name: "MacroStasis", desc: "Personal brand & 3D experience" },
      { name: "Bifrost", desc: "SSH mesh for multi-server orchestration" },
      { name: "N8N Workflows", desc: "AI-powered automation pipelines" },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    content: "Reach out via GitHub or email — always open to interesting collaborations.",
  },
]

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
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

function Section({
  title,
  content,
  items,
}: {
  title: string
  content?: string
  items?: string[] | { name: string; desc: string }[]
}) {
  const ref = useScrollReveal()

  return (
    <section
      id={title.toLowerCase()}
      ref={ref}
      className="scroll-section mx-auto max-w-4xl px-6 py-24"
    >
      <h2 className="text-sm font-[300] tracking-[0.3em] text-gold uppercase mb-2">
        {title}
      </h2>
      <h3 className="text-3xl font-[200] tracking-[0.05em] text-white/90 mb-8">
        {title === "About" && "Who I Am"}
        {title === "Skills" && "What I Do"}
        {title === "Projects" && "What I've Built"}
        {title === "Contact" && "Get In Touch"}
      </h3>

      {content && (
        <p className="text-base font-[300] leading-relaxed text-white/60 max-w-2xl">
          {content}
        </p>
      )}

      {items && Array.isArray(items) && typeof items[0] === "string" && (
        <div className="flex flex-wrap gap-3">
          {(items as string[]).map((item) => (
            <span
              key={item}
              className="px-4 py-2 text-sm font-[300] tracking-[0.1em] text-white/70 border border-white/10 rounded-full hover:border-gold/40 hover:text-gold/80 transition-colors duration-500"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {items && Array.isArray(items) && typeof items[0] === "object" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {(items as { name: string; desc: string }[]).map((item) => (
            <div
              key={item.name}
              className="p-5 border border-white/5 rounded-lg hover:border-white/10 transition-colors duration-500"
            >
              <h4 className="text-base font-[400] text-white/80 mb-1">{item.name}</h4>
              <p className="text-sm font-[300] text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function ScrollSections() {
  return (
    <div className="relative z-20 mt-[100vh]">
      {sections.map((s) => (
        <Section key={s.id} title={s.title} content={s.content} items={s.items} />
      ))}
    </div>
  )
}
