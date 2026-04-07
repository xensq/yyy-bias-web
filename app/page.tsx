"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { validateKey, saveKey, checkAuth } from "@/lib/auth"

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const router = useRouter()
  const [key, setKey] = useState("")
  const [status, setStatus] = useState<"idle"|"checking"|"denied"|"granted">("idle")
  const [shake, setShake] = useState(false)
  const [deniedText, setDeniedText] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("yyy-theme") || "crimson"
    document.documentElement.setAttribute("data-theme", saved)
  }, [])

  // Auto-login if valid key already stored
  useEffect(() => {
    checkAuth().then(valid => {
      if (valid) router.push("/dashboard")
    })
  }, [])

  // Typewriter for ACCESS DENIED
  useEffect(() => {
    if (status !== "denied") return
    const msg = "ACCESS DENIED"
    let i = 0
    setDeniedText("")
    const iv = setInterval(() => {
      if (i < msg.length) { setDeniedText(msg.slice(0, i + 1)); i++ }
      else clearInterval(iv)
    }, 60)
    return () => clearInterval(iv)
  }, [status])

  const handleSubmit = async () => {
    if (!key.trim() || status === "checking") return
    setStatus("checking")
    const valid = await validateKey(key.trim())
    if (valid) {
      saveKey(key.trim())
      setStatus("granted")
      setTimeout(() => router.push("/dashboard"), 600)
    } else {
      setStatus("denied")
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)
    const symbols = ["Δ","Γ","Σ","θ","σ","ρ","λ","μ","α","β","π","φ","∂","∫","∇","ε"]
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      speed: Math.random() * 0.4 + 0.1, opacity: Math.random() * 0.18 + 0.06,
      size: Math.random() * 12 + 8, drift: (Math.random() - 0.5) * 0.2,
    }))
    let t = 0
    const draw = () => {
      const W = canvas.width, H = canvas.height
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "220,38,38"
      ctx.clearRect(0, 0, W, H)
      const GRID = 80
      const cols = Math.ceil(W / GRID) + 1, rows = Math.ceil(H / GRID) + 1
      const ox = (t * 0.2) % GRID, oy = (t * 0.1) % GRID
      for (let i = 0; i < cols; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID - ox, 0); ctx.lineTo(i * GRID - ox, H)
        ctx.strokeStyle = `rgba(${rgb},${0.02 + 0.01 * Math.sin(t * 0.008 + i * 0.5)})`
        ctx.lineWidth = 0.5; ctx.stroke()
      }
      for (let j = 0; j < rows; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * GRID - oy); ctx.lineTo(W, j * GRID - oy)
        ctx.strokeStyle = `rgba(${rgb},${0.02 + 0.01 * Math.sin(t * 0.006 + j * 0.4)})`
        ctx.lineWidth = 0.5; ctx.stroke()
      }
      const scanY = (t * 0.6) % H
      const g = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
      g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},0.03)`); g.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = g; ctx.fillRect(0, scanY - 60, W, 120)
      particles.forEach(p => {
        p.y -= p.speed; p.x += p.drift
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W }
        if (p.x < -20) p.x = W + 20
        if (p.x > W + 20) p.x = -20
        ctx.font = `${p.size}px JetBrains Mono, monospace`
        ctx.fillStyle = `rgba(${rgb},${p.opacity})`
        ctx.fillText(p.symbol, p.x, p.y)
      })
      for (let k = 0; k < 5; k++) {
        const x = W * 0.78 + k * 22
        const yStart = ((t * (0.8 + k * 0.25) + k * 150) % (H + 60)) - 60
        ctx.beginPath(); ctx.moveTo(x, yStart); ctx.lineTo(x, yStart + 30)
        ctx.strokeStyle = `rgba(${rgb},${0.04 + k * 0.01})`; ctx.lineWidth = 1; ctx.stroke()
      }
      t++; rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize) }
  }, [])

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#09050a", overflow: "hidden" }}>
      <style>{`
        @keyframes spin3d { 0% { transform: rotateY(0deg) rotateX(8deg); } 100% { transform: rotateY(360deg) rotateX(8deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
      `}</style>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, transparent, rgba(var(--accent-rgb),0.5), transparent)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, borderBottom: "1px solid rgba(var(--accent-rgb),0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.4em", color: "var(--accent)", fontFamily: "JetBrains Mono" }}>YYY</span>
          <span style={{ fontSize: "8px", letterSpacing: "0.2em", color: "rgba(var(--accent-rgb),0.4)", fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>research</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px rgba(var(--accent-rgb),0.8)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "8px", letterSpacing: "0.2em", color: "rgba(var(--accent-rgb),0.6)", fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>live</span>
        </div>
      </div>

      {/* Spinning Omega */}
      <div style={{ position: "absolute", right: "26vw", top: "50%", transform: "translateY(-50%)", zIndex: 10, perspective: "600px" }}>
        <div style={{ fontSize: "clamp(280px, 35vw, 500px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: "transparent", WebkitTextStroke: "2px rgba(var(--accent-rgb),0.9)", textShadow: "0 0 120px rgba(var(--accent-rgb),0.6), 0 0 40px rgba(var(--accent-rgb),0.8)", animation: "spin3d 10s linear infinite", display: "inline-block", userSelect: "none", lineHeight: 1 }}>Ω</div>
      </div>

      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 10vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ width: "32px", height: "1px", background: "rgba(var(--accent-rgb),0.6)" }} />
          <span style={{ fontSize: "9px", letterSpacing: "0.4em", color: "rgba(var(--accent-rgb),0.5)", fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>analysis software</span>
        </div>
        <h1 style={{ fontSize: "clamp(72px, 13vw, 160px)", fontWeight: 700, color: "#e8e8f0", letterSpacing: "-0.04em", lineHeight: 0.9, marginBottom: "40px", fontFamily: "JetBrains Mono", textShadow: "0 0 80px rgba(var(--accent-rgb),0.6)" }}>yyy</h1>

        {/* Key input */}
        <div style={{ marginBottom: "12px", minHeight: "20px" }}>
          {status === "denied" && (
            <span style={{ fontSize: "11px", color: "var(--bear)", fontFamily: "JetBrains Mono", letterSpacing: "0.2em" }}>{deniedText}</span>
          )}
          {status === "granted" && (
            <span style={{ fontSize: "11px", color: "var(--bull)", fontFamily: "JetBrains Mono", letterSpacing: "0.2em" }}>ACCESS GRANTED</span>
          )}
        </div>

        <div style={{ display: "flex", gap: "0px", marginBottom: "48px", animation: shake ? "shake 0.6s ease" : "none" }}>
          <input
            value={key}
            onChange={e => setKey(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="YYY-XXXX-XXXX"
            maxLength={20}
            style={{
              background: "transparent",
              border: "1px solid rgba(var(--accent-rgb),0.3)",
              borderRight: "none",
              color: "var(--text)",
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              letterSpacing: "0.2em",
              padding: "12px 16px",
              outline: "none",
              width: "200px",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={status === "checking"}
            style={{
              padding: "12px 24px",
              background: status === "checking" ? "rgba(var(--accent-rgb),0.1)" : "transparent",
              border: "1px solid rgba(var(--accent-rgb),0.3)",
              color: "var(--accent)",
              fontSize: "10px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "JetBrains Mono",
              transition: "all 0.2s",
            }}
          >
            {status === "checking" ? "..." : "enter →"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "40px" }}>
          {[{ label: "signal layers", value: "11" }, { label: "data sources", value: "live" }, { label: "members", value: "invite only" }].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", fontFamily: "JetBrains Mono", marginBottom: "4px" }}>{value}</p>
              <p style={{ fontSize: "9px", color: "rgba(var(--accent-rgb),0.5)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "JetBrains Mono" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {[
        { top: 0, left: 0, borderTop: "1px solid", borderLeft: "1px solid" },
        { top: 0, right: 0, borderTop: "1px solid", borderRight: "1px solid" },
        { bottom: 0, left: 0, borderBottom: "1px solid", borderLeft: "1px solid" },
        { bottom: 0, right: 0, borderBottom: "1px solid", borderRight: "1px solid" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: "20px", height: "20px", borderColor: "rgba(var(--accent-rgb),0.2)", ...s }} />
      ))}
    </div>
  )
}


