"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)

    // Stars
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
      opacity: Math.random() * 0.4 + 0.1
    }))

    const stars = Array.from({ length: 100 }, () => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, r: Math.random() * 1.2 + 0.3, speed: Math.random() * 0.2 + 0.05, opacity: Math.random() * 0.5 + 0.1 }))
    let t = 0

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Stars
      stars.forEach(s => {
        s.y -= s.speed
        if (s.y < 0) { s.y = H; s.x = Math.random() * W }
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,200,150,${s.opacity * (0.6 + 0.4 * Math.sin(t * 0.02 + s.x))})`
        ctx.fill()
      })

      stars.forEach(s => { s.y -= s.speed; if (s.y < 0) { s.y = H; s.x = Math.random() * W } ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,200,150," + (s.opacity * (0.6 + 0.4 * Math.sin(t * 0.02 + s.x))) + ")"; ctx.fill() })
      // Animated grid
      const COLS = Math.ceil(W / 80) + 1
      const ROWS = Math.ceil(H / 80) + 1
      const offsetX = (t * 0.3) % 80
      const offsetY = (t * 0.15) % 80

      for (let i = 0; i < COLS; i++) {
        const x = i * 80 - offsetX
        const alpha = 0.03 + 0.015 * Math.sin(t * 0.01 + i * 0.3)
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.strokeStyle = `rgba(0,200,150,${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      for (let j = 0; j < ROWS; j++) {
        const y = j * 80 - offsetY
        const alpha = 0.03 + 0.015 * Math.sin(t * 0.008 + j * 0.4)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.strokeStyle = `rgba(0,200,150,${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Scanline effect — very subtle horizontal line sweeping down
      const scanY = (t * 0.8) % H
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      scanGrad.addColorStop(0, "rgba(0,200,150,0)")
      scanGrad.addColorStop(0.5, "rgba(0,200,150,0.04)")
      scanGrad.addColorStop(1, "rgba(0,200,150,0)")
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 40, W, 80)

      // Data stream lines on the right — vertical dashes moving
      for (let k = 0; k < 4; k++) {
        const x = W * 0.82 + k * 18
        const speed = 0.8 + k * 0.3
        const yStart = ((t * speed + k * 120) % (H + 40)) - 40
        ctx.beginPath()
        ctx.moveTo(x, yStart)
        ctx.lineTo(x, yStart + 20)
        ctx.strokeStyle = `rgba(0,200,150,${0.06 + k * 0.02})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      t++
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#050505", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* Orbital reticle */}<div style={{position:"absolute",right:"8vw",top:"50%",transform:"translateY(-50%)",width:"320px",height:"320px",zIndex:5,pointerEvents:"none"}}><svg width="320" height="320" viewBox="0 0 320 320"><style>{`@keyframes orb1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes orb2{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}@keyframes orb3{from{transform:rotate(45deg)}to{transform:rotate(405deg)}}@keyframes cp{0%,100%{opacity:0.3;r:4}50%{opacity:1;r:7}}.r1{transform-origin:160px 160px;animation:orb1 14s linear infinite}.r2{transform-origin:160px 160px;animation:orb2 20s linear infinite}.r3{transform-origin:160px 160px;animation:orb3 9s linear infinite}`}</style><circle cx="160" cy="160" r="130" fill="none" stroke="rgba(0,200,150,0.06)" strokeWidth="0.5"/><circle cx="160" cy="160" r="100" fill="none" stroke="rgba(0,200,150,0.08)" strokeWidth="0.5"/><circle cx="160" cy="160" r="60" fill="none" stroke="rgba(0,200,150,0.1)" strokeWidth="0.5"/><circle cx="160" cy="160" r="28" fill="none" stroke="rgba(0,200,150,0.15)" strokeWidth="0.5"/><line x1="160" y1="20" x2="160" y2="75" stroke="rgba(0,200,150,0.1)" strokeWidth="0.5"/><line x1="160" y1="245" x2="160" y2="300" stroke="rgba(0,200,150,0.1)" strokeWidth="0.5"/><line x1="20" y1="160" x2="75" y2="160" stroke="rgba(0,200,150,0.1)" strokeWidth="0.5"/><line x1="245" y1="160" x2="300" y2="160" stroke="rgba(0,200,150,0.1)" strokeWidth="0.5"/><g className="r1"><ellipse cx="160" cy="160" rx="130" ry="42" fill="none" stroke="rgba(0,200,150,0.18)" strokeWidth="0.8" transform="rotate(-15 160 160)"/><circle cx="290" cy="160" r="3" fill="#00c896" opacity="0.85" transform="rotate(-15 160 160)"/></g><g className="r2"><ellipse cx="160" cy="160" rx="100" ry="32" fill="none" stroke="rgba(0,200,150,0.12)" strokeWidth="0.6" transform="rotate(35 160 160)"/><circle cx="260" cy="160" r="2.5" fill="#00c896" opacity="0.6" transform="rotate(35 160 160)"/></g><g className="r3"><ellipse cx="160" cy="160" rx="60" ry="18" fill="none" stroke="rgba(0,200,150,0.22)" strokeWidth="0.6" transform="rotate(65 160 160)"/><circle cx="220" cy="160" r="2" fill="#00c896" opacity="0.9" transform="rotate(65 160 160)"/></g><circle cx="160" cy="160" r="4" fill="#00c896" style={{animation:"cp 2.5s ease-in-out infinite"}}/><circle cx="160" cy="160" r="11" fill="none" stroke="rgba(0,200,150,0.25)" strokeWidth="0.5"/></svg></div>{/* left edge accent line */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, transparent, rgba(0,200,150,0.4), transparent)" }} />

      {/* top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <span style={{ fontSize: "10px", letterSpacing: "0.4em", color: "#1a1a1a", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>
          yyy research
        </span>
        <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#1a1a1a", fontFamily: "JetBrains Mono, monospace" }}>
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* main content — left aligned, vertically centered */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 10vw" }}>

        {/* label */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div style={{ width: "24px", height: "1px", background: "rgba(0,200,150,0.5)" }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.35em", color: "rgba(0,200,150,0.6)", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>
            analysis software
          </span>
        </div>

        {/* giant yyy */}
        <h1 style={{
          fontSize: "clamp(80px, 14vw, 180px)",
          fontWeight: 600,
          color: "#e8e8e8",
          letterSpacing: "-0.04em",
          lineHeight: 0.9,
          margin: "0 0 32px",
          fontFamily: "JetBrains Mono, monospace",
        }}>
          yyy
        </h1>

        {/* descriptor */}


        {/* cta */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              padding: "14px 40px",
              border: `1px solid ${hovered ? "rgba(0,200,150,0.8)" : "rgba(0,200,150,0.2)"}`,
              background: hovered ? "rgba(0,200,150,0.08)" : "transparent",
              color: hovered ? "#00c896" : "#555",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "JetBrains Mono, monospace",
              transition: "all 0.2s",
              outline: "none",
            }}
          >
            enter terminal
          </button>
          <span style={{ fontSize: "10px", color: "#222", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>
            not financial advice
          </span>
        </div>
      </div>

      {/* bottom right — live indicator */}
      <div style={{ position: "absolute", bottom: "28px", right: "32px", display: "flex", alignItems: "center", gap: "8px", zIndex: 10 }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00c896", boxShadow: "0 0 6px #00c896", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#222", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>live</span>
      </div>
    </div>
  )
}
