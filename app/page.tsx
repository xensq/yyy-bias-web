"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const router = useRouter()
  const [typed, setTyped] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [phase, setPhase] = useState(0) // 0=typing, 1=done, 2=show buttons

  const fullText = "options flow. dealer positioning. market structure."

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTyped(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setPhase(1)
        setTimeout(() => setPhase(2), 400)
      }
    }, 28)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setShowCursor(c => !c), 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)

    const symbols = ["Δ", "Γ", "Σ", "θ", "σ", "ρ", "λ", "μ", "α", "β", "π", "φ", "∂", "∫", "∇", "ε"]

    // Floating symbols
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.18 + 0.06,
      size: Math.random() * 12 + 8,
      drift: (Math.random() - 0.5) * 0.2,
    }))

    // Grid
    let t = 0
    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Subtle grid
      const GRID = 80
      const cols = Math.ceil(W / GRID) + 1
      const rows = Math.ceil(H / GRID) + 1
      const ox = (t * 0.2) % GRID
      const oy = (t * 0.1) % GRID

      for (let i = 0; i < cols; i++) {
        ctx.beginPath()
        ctx.moveTo(i * GRID - ox, 0)
        ctx.lineTo(i * GRID - ox, H)
        ctx.strokeStyle = `rgba(220,38,38,${0.02 + 0.01 * Math.sin(t * 0.008 + i * 0.5)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      for (let j = 0; j < rows; j++) {
        ctx.beginPath()
        ctx.moveTo(0, j * GRID - oy)
        ctx.lineTo(W, j * GRID - oy)
        ctx.strokeStyle = `rgba(220,38,38,${0.02 + 0.01 * Math.sin(t * 0.006 + j * 0.4)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Scanline
      const scanY = (t * 0.6) % H
      const g = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
      g.addColorStop(0, "rgba(220,38,38,0)")
      g.addColorStop(0.5, "rgba(220,38,38,0.03)")
      g.addColorStop(1, "rgba(220,38,38,0)")
      ctx.fillStyle = g
      ctx.fillRect(0, scanY - 60, W, 120)

      // Floating Greek symbols
      particles.forEach(p => {
        p.y -= p.speed
        p.x += p.drift
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W }
        if (p.x < -20) p.x = W + 20
        if (p.x > W + 20) p.x = -20
        ctx.font = `${p.size}px JetBrains Mono, monospace`
        ctx.fillStyle = `rgba(220,38,38,${p.opacity})`
        ctx.fillText(p.symbol, p.x, p.y)
      })

      // Data streams right side
      for (let k = 0; k < 5; k++) {
        const x = W * 0.78 + k * 22
        const yStart = ((t * (0.8 + k * 0.25) + k * 150) % (H + 60)) - 60
        ctx.beginPath()
        ctx.moveTo(x, yStart)
        ctx.lineTo(x, yStart + 30)
        ctx.strokeStyle = `rgba(220,38,38,${0.04 + k * 0.01})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      t++
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize) }
  }, [])

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#09050a", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* Left accent */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, transparent, rgba(220,38,38,0.5), transparent)" }} />

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, borderBottom: "1px solid rgba(220,38,38,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.4em", color: "#dc2626", fontFamily: "JetBrains Mono" }}>YYY</span>
          <span style={{ fontSize: "8px", letterSpacing: "0.2em", color: "rgba(220,38,38,0.4)", fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>research</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#dc2626", boxShadow: "0 0 8px rgba(220,38,38,0.8)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "8px", letterSpacing: "0.2em", color: "rgba(220,38,38,0.6)", fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>live</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 10vw" }}>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ width: "32px", height: "1px", background: "rgba(220,38,38,0.6)" }} />
          <span style={{ fontSize: "9px", letterSpacing: "0.4em", color: "rgba(220,38,38,0.5)", fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>
            analysis software
          </span>
        </div>

        {/* Logo */}
        <h1 style={{
          fontSize: "clamp(72px, 13vw, 160px)",
          fontWeight: 700,
          color: "#e8e8f0",
          letterSpacing: "-0.04em",
          lineHeight: 0.9,
          marginBottom: "40px",
          fontFamily: "JetBrains Mono",
          textShadow: "0 0 80px rgba(220,38,38,0.08)",
        }}>
          yyy
        </h1>

        {/* Typewriter */}
        <div style={{ marginBottom: "48px", minHeight: "24px" }}>
          <span style={{ fontSize: "13px", color: "rgba(220,38,38,0.7)", fontFamily: "JetBrains Mono", letterSpacing: "0.02em" }}>
            {typed}
            {(phase < 2) && <span style={{ opacity: showCursor ? 1 : 0, color: "var(--accent)" }}>|</span>}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "40px", marginBottom: "48px", opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.6s ease" }}>
          {[
            { label: "signal layers", value: "6" },
            { label: "data sources", value: "live" },
            { label: "members", value: "invite only" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", fontFamily: "JetBrains Mono", marginBottom: "4px" }}>{value}</p>
              <p style={{ fontSize: "9px", color: "rgba(220,38,38,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "JetBrains Mono" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: "16px", opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.8s ease 0.2s" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "14px 36px",
              background: "transparent",
              border: "1px solid rgba(220,38,38,0.5)",
              color: "#dc2626",
              fontSize: "10px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "JetBrains Mono",
              transition: "all 0.2s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = "rgba(220,38,38,0.08)"
              ;(e.target as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.9)"
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = "transparent"
              ;(e.target as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.5)"
            }}
          >
            enter terminal →
          </button>
        </div>
      </div>

      {/* Bottom right */}
      <div style={{ position: "absolute", bottom: "28px", right: "40px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", zIndex: 10 }}>
        <span style={{ fontSize: "8px", color: "rgba(220,38,38,0.3)", fontFamily: "JetBrains Mono", letterSpacing: "0.15em" }}>not financial advice</span>
      </div>

      {/* Corner marks */}
      {[
        { top: 0, left: 0, borderTop: "1px solid", borderLeft: "1px solid" },
        { top: 0, right: 0, borderTop: "1px solid", borderRight: "1px solid" },
        { bottom: 0, left: 0, borderBottom: "1px solid", borderLeft: "1px solid" },
        { bottom: 0, right: 0, borderBottom: "1px solid", borderRight: "1px solid" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: "20px", height: "20px", borderColor: "rgba(220,38,38,0.2)", ...s }} />
      ))}
    </div>
  )
}
