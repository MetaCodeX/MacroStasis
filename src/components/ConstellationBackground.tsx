'use client'
import { useEffect, useRef } from 'react'

export default function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf: number

    const COUNT = 280
    const MAX_DIST = 190
    const SPEED = 0.3
    const NODE_OPACITY = 0.85
    const LINE_OPACITY = 0.95

    type Node = {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      isGold: boolean
    }
    let nodes: Node[] = []

    function init() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodes = Array.from({ length: COUNT }, () => {
        const isGold = Math.random() < 0.35
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          size: Math.random() * 2.5 + 2.0,
          isGold,
        }
      })
    }

    function draw() {
      const { width: W, height: H } = canvas
      ctx.clearRect(0, 0, W, H)

      // Move nodes & Draw lines first
      for (let i = 0; i < COUNT; i++) {
        const a = nodes[i]
        a.x += a.vx
        a.y += a.vy
        if (a.x < 0 || a.x > W) a.vx *= -1
        if (a.y < 0 || a.y > H) a.vy *= -1

        for (let j = i + 1; j < COUNT; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = LINE_OPACITY * (1 - dist / MAX_DIST)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            if (a.isGold || b.isGold) {
              ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.95})`
              ctx.lineWidth = 1.3
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.75})`
              ctx.lineWidth = 0.85
            }
            ctx.stroke()
          }
        }
      }

      // Draw nodes on top
      for (let i = 0; i < COUNT; i++) {
        const a = nodes[i]
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2)
        if (a.isGold) {
          ctx.shadowBlur = 12
          ctx.shadowColor = '#ffd700'
          ctx.fillStyle = `rgba(255, 215, 0, ${NODE_OPACITY})`
        } else {
          ctx.shadowBlur = 0
          ctx.fillStyle = `rgba(255, 255, 255, ${NODE_OPACITY})`
        }
        ctx.fill()
      }
      ctx.shadowBlur = 0 // reset shadow blur

      raf = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(init)
    ro.observe(canvas)
    init()
    draw()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
