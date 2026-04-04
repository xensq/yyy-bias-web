"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const PHI = (1 + Math.sqrt(5)) / 2
const RAW_VERTS: [number,number,number][] = [
  [0,1,PHI],[0,-1,PHI],[0,1,-PHI],[0,-1,-PHI],
  [1,PHI,0],[-1,PHI,0],[1,-PHI,0],[-1,-PHI,0],
  [PHI,0,1],[-PHI,0,1],[PHI,0,-1],[-PHI,0,-1]
]
const NORM_VERTS = RAW_VERTS.map(v => { const l = Math.sqrt(v[0]**2+v[1]**2+v[2]**2); return [v[0]/l,v[1]/l,v[2]/l] as [number,number,number] })
const EDGES: [number,number][] = [
  [0,1],[0,4],[0,5],[0,8],[0,9],[1,6],[1,7],[1,8],[1,9],
  [2,3],[2,4],[2,5],[2,10],[2,11],[3,6],[3,7],[3,10],[3,11],
  [4,5],[4,8],[4,10],[5,9],[5,11],[6,7],[6,8],[6,10],[7,9],[7,11],[8,10],[9,11]
]

function rotX(v:[number,number,number], a:number):[number,number,number] { const c=Math.cos(a),s=Math.sin(a); return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c] }
function rotY(v:[number,number,number], a:number):[number,number,number] { const c=Math.cos(a),s=Math.sin(a); return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c] }
function project(v:[number,number,number], cx:number, cy:number, size:number):[number,number,number] { const z=v[2]+3.5; const f=size*2.2; return [cx+v[0]/z*f, cy+v[1]/z*f, z] }

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef({ x: 0.3, y: 0 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)

    // Star particles
    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      speed: Math.random() * 0.15 + 0.05,
      opacity: Math.random() * 0.4 + 0.1,
    }))

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Particles
      particles.forEach(p => {
        p.y -= p.speed
        if (p.y < -2) { p.y = H + 2; p.x = Math.random() * W }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
        ctx.fill()
      })

      // Polyhedron — centered slightly right on wide screens
      const cx = W * 0.62, cy = H * 0.5
      const size = Math.min(W, H) * 0.18
      angleRef.current.x += 0.004
      angleRef.current.y += 0.006

      const verts = NORM_VERTS.map(v => {
        let w = rotX(v as [number,number,number], angleRef.current.x)
        w = rotY(w, angleRef.current.y)
        return project(w, cx, cy, size)
      })

      // Draw edges with depth-based opacity
      EDGES.forEach(([i, j]) => {
        const a = verts[i], b = verts[j]
        const depth = ((a[2] + b[2]) / 2 - 2.5) / 2
        const alpha = Math.max(0.04, Math.min(0.45, depth * 0.5))
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.strokeStyle = `rgba(0,200,150,${alpha})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })

      // Draw vertices
      verts.forEach(v => {
        const depth = (v[2] - 2.5) / 2
        const alpha = Math.max(0.05, Math.min(0.6, depth * 0.8))
        ctx.beginPath()
        ctx.arc(v[0], v[1], 1.5, 0, Math.PI*2)
        ctx.fillStyle = `rgba(0,200,150,${alpha})`
        ctx.fill()
      })

      // Outer ring glow
      const grad = ctx.createRadialGradient(cx, cy, size*0.8, cx, cy, size*2.2)
      grad.addColorStop(0, "rgba(0,200,150,0.03)")
      grad.addColorStop(1, "rgba(0,200,150,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, size*2.2, 0, Math.PI*2)
      ctx.fillStyle = grad
      ctx.fill()

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#0a0a0a", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* content */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", alignItems: "center", paddingLeft: "8vw" }}>
        <div>
          <p style={{ fontSize: "10px", letterSpacing: "0.35em", color: "#333", marginBottom: "28px", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>
            market intelligence terminal
          </p>
          <h1 style={{ fontSize: "clamp(56px, 8vw, 96px)", fontWeight: 600, color: "#e8e8e8", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "20px", fontFamily: "JetBrains Mono, monospace" }}>
            yyy
          </h1>
          <p style={{ fontSize: "13px", color: "#444", marginBottom: "8px", fontFamily: "JetBrains Mono, monospace" }}>
            nightly bias engine
          </p>
          <p style={{ fontSize: "11px", color: "#2a2a2a", marginBottom: "52px", fontFamily: "JetBrains Mono, monospace" }}>
            gex · entropy · topology · iv surface · macro
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              padding: "13px 36px",
              border: `0.5px solid ${hovered ? "#00c896" : "#2a2a2a"}`,
              background: hovered ? "rgba(0,200,150,0.05)" : "transparent",
              color: hovered ? "#00c896" : "#666",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "JetBrains Mono, monospace",
              transition: "all 0.2s",
              outline: "none",
            }}
          >
            launch terminal →
          </button>
        </div>
      </div>

      <p style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", color: "#222", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>
        not financial advice
      </p>
    </div>
  )
}
