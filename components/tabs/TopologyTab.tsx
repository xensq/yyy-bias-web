"use client"
import { useEffect, useState, useRef } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface TopoProps {
  topology: { pca1: number; pca2: number; vol_z: number; regime: string; dist: number; aligned: boolean; price: number; error: string | null }
  entropy: { entropy: number; threshold: number; rho: number; status: string; size_factor: number; trend: string; error: string | null }
}

interface HistData { pca1: number[]; pca2: number[]; vol_z: number[]; entropy: number[]; threshold: number[]; n: number }

const REGIME_COLOR: Record<string, string> = {
  "BULL TREND": "#00c896", "BEAR TREND": "#ff5555",
  CONSOLIDATION: "#f0c040", EXTENDED: "#f97316", UNCHARTED: "#ff5555"
}
const ENT_COLOR: Record<string, string> = { NORMAL: "#00c896", ELEVATED: "#f0c040", CRITICAL: "#ff5555" }

function BarChart({ data, label, color, threshold }: { data: number[]; label: string; color: (v: number) => string; threshold?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const max = Math.max(...data.map(Math.abs)) || 1
    const barW = Math.max(1, W / data.length - 0.5)
    const midY = H / 2

    // Zero line
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(W, midY)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1
    ctx.stroke()

    // Threshold line for entropy
    if (threshold !== undefined) {
      const tY = H - (threshold / (max * 1.1)) * H
      ctx.beginPath()
      ctx.moveTo(0, tY)
      ctx.lineTo(W, tY)
      ctx.strokeStyle = "rgba(240,192,64,0.4)"
      ctx.lineWidth = 0.8
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Bars
    data.forEach((v, i) => {
      const x = i * (barW + 0.5)
      const h = Math.abs(v) / (max * 1.1) * (H / 2 - 2)
      const y = v >= 0 ? midY - h : midY
      ctx.fillStyle = color(v)
      ctx.fillRect(x, v >= 0 ? y : midY, barW, h)
    })

    // Current value dot
    const last = data[data.length - 1]
    const lastX = (data.length - 1) * (barW + 0.5) + barW / 2
    const lastH = Math.abs(last) / (max * 1.1) * (H / 2 - 2)
    const lastY = last >= 0 ? midY - lastH : midY + lastH
    ctx.beginPath()
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = "#fff"
    ctx.fill()
  }, [data, threshold])

  return <canvas ref={canvasRef} width={560} height={80} style={{ width: "100%", height: "80px", display: "block" }} />
}

function EntropyLineChart({ entropy, threshold }: { entropy: number[]; threshold: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !entropy.length) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const allVals = [...entropy, ...threshold]
    const maxV = Math.max(...allVals) * 1.1
    const toY = (v: number) => H - (v / maxV) * H

    const stepX = W / (entropy.length - 1)

    // Threshold area fill
    ctx.beginPath()
    threshold.forEach((v, i) => { i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * stepX, toY(v)) })
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fillStyle = "rgba(240,192,64,0.04)"
    ctx.fill()

    // Threshold line
    ctx.beginPath()
    threshold.forEach((v, i) => { i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * stepX, toY(v)) })
    ctx.strokeStyle = "rgba(240,192,64,0.35)"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // Entropy line — color by threshold crossing
    for (let i = 1; i < entropy.length; i++) {
      const x1 = (i - 1) * stepX, x2 = i * stepX
      const y1 = toY(entropy[i - 1]), y2 = toY(entropy[i])
      const aboveThresh = entropy[i] > threshold[i]
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = aboveThresh ? "rgba(255,85,85,0.8)" : "rgba(0,200,150,0.7)"
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    // Current dot
    const lastX = (entropy.length - 1) * stepX
    const lastY = toY(entropy[entropy.length - 1])
    ctx.beginPath()
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
    ctx.fillStyle = entropy[entropy.length - 1] > threshold[threshold.length - 1] ? "#ff5555" : "#00c896"
    ctx.fill()
  }, [entropy, threshold])

  return <canvas ref={canvasRef} width={560} height={100} style={{ width: "100%", height: "100px", display: "block" }} />
}

export default function TopologyTab({ topology: t, entropy: e }: TopoProps) {
  const [hist, setHist] = useState<HistData | null>(null)
  const [loading, setLoading] = useState(true)
  const rc = REGIME_COLOR[t.regime] || "#666"
  const ec = ENT_COLOR[e.status] || "#666"

  useEffect(() => {
    fetch(`${API}/history`)
      .then(r => r.json())
      .then(setHist)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const trendColor = (v: number) => {
    if (v > 1.0) return "rgba(0,200,150,0.7)"
    if (v > 0) return "rgba(0,200,150,0.35)"
    if (v < -1.0) return "rgba(255,85,85,0.7)"
    if (v < 0) return "rgba(255,85,85,0.35)"
    return "rgba(80,80,80,0.5)"
  }

  const momColor = (v: number) => {
    if (v > 0.5) return "rgba(0,180,255,0.7)"
    if (v > 0) return "rgba(0,180,255,0.35)"
    if (v < -0.5) return "rgba(255,140,0,0.7)"
    if (v < 0) return "rgba(255,140,0,0.35)"
    return "rgba(80,80,80,0.5)"
  }

  const volColor = (v: number) => {
    if (v > 1.5) return "rgba(255,85,85,0.8)"
    if (v > 0.5) return "rgba(240,192,64,0.7)"
    return "rgba(100,100,100,0.5)"
  }

  const Panel = ({ children, label, value, color }: { children: React.ReactNode; label: string; value: string; color: string }) => (
    <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "6px", padding: "14px 16px", background: "#0a0a0a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#333", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color, fontWeight: 500 }}>{value}</span>
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* status bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
        {[
          { label: "regime", value: t.regime, color: rc },
          { label: "pca1 trend", value: `${t.pca1 >= 0 ? "+" : ""}${t.pca1.toFixed(3)}`, color: t.pca1 > 1 ? "#00c896" : t.pca1 < -1 ? "#ff5555" : "#666" },
          { label: "pca2 momentum", value: `${t.pca2 >= 0 ? "+" : ""}${t.pca2.toFixed(3)}`, color: t.aligned ? "#00c896" : "#f0c040" },
          { label: "entropy", value: `${e.rho.toFixed(3)}×`, color: ec },
          { label: "vol z-score", value: `${t.vol_z >= 0 ? "+" : ""}${t.vol_z.toFixed(3)}`, color: t.vol_z > 1.5 ? "#ff5555" : t.vol_z > 0.5 ? "#f0c040" : "#555" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ border: "0.5px solid #1a1a1a", borderRadius: "6px", padding: "12px 14px", background: "#0a0a0a" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
            <p style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color, fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#333", fontSize: "12px", padding: "20px 0" }}>
          <div style={{ width: "5px", height: "5px", background: "#00c896", borderRadius: "50%" }} />
          loading chart data...
        </div>
      ) : hist && !hist.error ? (
        <>
          {/* Trend */}
          <Panel label="trend (pca1)" value={`${t.pca1 >= 0 ? "+" : ""}${t.pca1.toFixed(3)}`} color={t.pca1 > 1 ? "#00c896" : t.pca1 < -1 ? "#ff5555" : "#555"}>
            <BarChart data={hist.pca1} label="pca1" color={trendColor} />
            <p style={{ fontSize: "10px", color: "#333", marginTop: "6px" }}>
              {t.pca1 > 1 ? "buyers in structural control" : t.pca1 < -1 ? "sellers in structural control" : "no dominant structural direction"}
            </p>
          </Panel>

          {/* Momentum */}
          <Panel label="momentum (pca2)" value={`${t.pca2 >= 0 ? "+" : ""}${t.pca2.toFixed(3)}`} color={t.aligned ? "#00c896" : "#f0c040"}>
            <BarChart data={hist.pca2} label="pca2" color={momColor} />
            <p style={{ fontSize: "10px", color: "#333", marginTop: "6px" }}>
              {t.aligned ? "momentum aligned with trend — signals reliable" : "momentum diverging from trend — reduce conviction"}
            </p>
          </Panel>

          {/* Entropy */}
          <Panel label={`entropy — ${e.status}`} value={`${e.rho.toFixed(3)}× threshold`} color={ec}>
            <EntropyLineChart entropy={hist.entropy} threshold={hist.threshold} />
            <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
              <span style={{ fontSize: "10px", color: "#333" }}>current {e.entropy.toFixed(5)}</span>
              <span style={{ fontSize: "10px", color: "#555" }}>threshold {e.threshold.toFixed(5)}</span>
              <span style={{ fontSize: "10px", color: e.trend === "rising" ? "#f0c040" : "#555" }}>
                {e.trend === "rising" ? "↑ rising into close" : "↓ falling into close"}
              </span>
            </div>
          </Panel>

          {/* Volatility */}
          <Panel label="volatility z-score" value={`${t.vol_z >= 0 ? "+" : ""}${t.vol_z.toFixed(3)}`} color={t.vol_z > 1.5 ? "#ff5555" : t.vol_z > 0.5 ? "#f0c040" : "#555"}>
            <BarChart data={hist.vol_z} label="vol_z" color={volColor} />
            <p style={{ fontSize: "10px", color: "#333", marginTop: "6px" }}>
              {t.vol_z > 1.5 ? "vol significantly elevated — widen stops, reduce size" : t.vol_z > 0.5 ? "vol slightly above average — normal caution" : t.vol_z < -0.5 ? "vol compressed — expansion likely incoming" : "vol near historical average"}
            </p>
          </Panel>
        </>
      ) : (
        <p style={{ fontSize: "12px", color: "#444", padding: "20px 0" }}>chart data unavailable</p>
      )}
    </div>
  )
}
