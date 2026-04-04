"use client"
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
// @ts-ignore
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface TopoProps {
  topology: { pca1: number; pca2: number; vol_z: number; regime: string; dist: number; aligned: boolean; price: number; error: string | null }
  entropy: { entropy: number; threshold: number; rho: number; status: string; size_factor: number; trend: string; error: string | null }
}

interface HistData { pca1: number[]; pca2: number[]; vol_z: number[]; entropy: number[]; threshold: number[]; n: number; error?: string | null }

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

      {!loading && hist && !hist.error && (
        <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "8px", background: "#050505", overflow: "hidden", marginBottom: "4px" }}>
          <div style={{ padding: "10px 16px", borderBottom: "0.5px solid #111" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#333", textTransform: "uppercase" }}>phase space · pca1 × pca2 × vol z · drag to rotate</span>
          </div>
          <Plot
            data={[
              {
                type: "scatter3d" as const,
                x: hist.pca1.slice(0, -1),
                y: hist.pca2.slice(0, -1),
                z: hist.vol_z.slice(0, -1),
                mode: "markers" as const,
                marker: {
                  size: 3.5,
                  color: hist.entropy.slice(0, -1).map((v: number, i: number) => v / (hist.threshold[i] || 1)),
                  colorscale: [[0, "#00c896"], [0.6, "#f0c040"], [0.85, "#f97316"], [1.0, "#ff3333"]] as any,
                  cmin: 0, cmax: 1.3,
                  opacity: 0.55,
                  showscale: false
                },
                hoverinfo: "skip" as const
              },
              {
                type: "scatter3d" as const,
                x: [hist.pca1[hist.pca1.length - 1]],
                y: [hist.pca2[hist.pca2.length - 1]],
                z: [hist.vol_z[hist.vol_z.length - 1]],
                mode: "markers" as const,
                marker: { size: 11, color: "#f97316", line: { color: "#fff", width: 1 } },
                hovertemplate: `trend: ${t.pca1.toFixed(3)}<br>momentum: ${t.pca2.toFixed(3)}<br>vol z: ${t.vol_z.toFixed(3)}<extra>now</extra>`,
                showlegend: false
              }
            ]}
            layout={{
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              margin: { l: 0, r: 0, t: 0, b: 0 },
              scene: {
                bgcolor: "#050505",
                xaxis: { title: { text: "PCA1 Trend", font: { family: "JetBrains Mono", size: 9, color: "#444" } }, gridcolor: "#141414", tickfont: { family: "JetBrains Mono", size: 8, color: "#444" } },
                yaxis: { title: { text: "PCA2 Mom", font: { family: "JetBrains Mono", size: 9, color: "#444" } }, gridcolor: "#141414", tickfont: { family: "JetBrains Mono", size: 8, color: "#444" } },
                zaxis: { title: { text: "Vol Z", font: { family: "JetBrains Mono", size: 9, color: "#444" } }, gridcolor: "#141414", tickfont: { family: "JetBrains Mono", size: 8, color: "#444" } },
                camera: { eye: { x: 1.6, y: -1.6, z: 1.1 } }
              },
              dragmode: "orbit"
            } as any}
            config={{ displayModeBar: false, responsive: true, scrollZoom: true }}
            style={{ width: "100%", height: "420px" }}
            useResizeHandler
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#333", fontSize: "12px", padding: "20px 0" }}>
          <div style={{ width: "5px", height: "5px", background: "#00c896", borderRadius: "50%" }} />
          loading chart data...
        </div>
      ) : hist && !hist.error ? (
        <>
          {/* 3D Time Series */}
          <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "8px", background: "#050505", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "0.5px solid #111" }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#333", textTransform: "uppercase" }}>structural history · trend · momentum · vol z-score · drag to rotate</span>
            </div>
            <Plot
              data={[
                {
                  type: "scatter3d" as const,
                  x: hist.pca1.map((_: number, i: number) => i),
                  y: hist.pca1,
                  z: Array(hist.pca1.length).fill(0),
                  mode: "lines" as const,
                  line: { color: hist.pca1.map((v: number) => v > 1 ? "#00c896" : v < -1 ? "#ff5555" : "#2a4a3a"), width: 3, colorscale: [[0,"#ff5555"],[0.5,"#2a4a3a"],[1,"#00c896"]] as any },
                  name: "PCA1 Trend",
                  hovertemplate: "trend: %{y:.3f}<extra></extra>"
                },
                {
                  type: "scatter3d" as const,
                  x: hist.pca2.map((_: number, i: number) => i),
                  y: Array(hist.pca2.length).fill(0),
                  z: hist.pca2,
                  mode: "lines" as const,
                  line: { color: "#0084ff", width: 3 },
                  name: "PCA2 Momentum",
                  hovertemplate: "momentum: %{z:.3f}<extra></extra>"
                },
                {
                  type: "scatter3d" as const,
                  x: hist.vol_z.map((_: number, i: number) => i),
                  y: hist.vol_z.map((v: number) => v * 0.3),
                  z: hist.vol_z.map((v: number) => v * 0.3),
                  mode: "lines" as const,
                  line: { color: hist.vol_z.map((v: number) => v > 1.5 ? "#ff5555" : v > 0.5 ? "#f0c040" : "#444"), width: 2, colorscale: [[0,"#444"],[0.5,"#f0c040"],[1,"#ff5555"]] as any },
                  name: "Vol Z",
                  hovertemplate: "vol z: %{y:.3f}<extra></extra>"
                },
                {
                  type: "scatter3d" as const,
                  x: [hist.pca1.length - 1],
                  y: [hist.pca1[hist.pca1.length - 1]],
                  z: [0],
                  mode: "markers" as const,
                  marker: { size: 8, color: t.pca1 > 1 ? "#00c896" : t.pca1 < -1 ? "#ff5555" : "#f0c040", line: { color: "#fff", width: 1 } },
                  name: "Now",
                  hovertemplate: `trend now: ${t.pca1.toFixed(3)}<extra></extra>`,
                  showlegend: false
                }
              ]}
              layout={{
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
                margin: { l: 0, r: 0, t: 0, b: 0 },
                showlegend: true,
                legend: { font: { family: "JetBrains Mono", size: 9, color: "#444" }, bgcolor: "transparent", x: 0.01, y: 0.99 },
                scene: {
                  bgcolor: "#050505",
                  xaxis: { title: { text: "Time", font: { family: "JetBrains Mono", size: 9, color: "#333" } }, gridcolor: "#141414", tickfont: { family: "JetBrains Mono", size: 8, color: "#333" }, showticklabels: false },
                  yaxis: { title: { text: "Trend (PCA1)", font: { family: "JetBrains Mono", size: 9, color: "#00c896" } }, gridcolor: "#141414", tickfont: { family: "JetBrains Mono", size: 8, color: "#444" }, zerolinecolor: "#1e1e1e" },
                  zaxis: { title: { text: "Momentum (PCA2)", font: { family: "JetBrains Mono", size: 9, color: "#0084ff" } }, gridcolor: "#141414", tickfont: { family: "JetBrains Mono", size: 8, color: "#444" }, zerolinecolor: "#1e1e1e" },
                  camera: { eye: { x: 2.0, y: 0.8, z: 0.8 } }
                },
                dragmode: "orbit"
              } as any}
              config={{ displayModeBar: false, responsive: true, scrollZoom: true }}
              style={{ width: "100%", height: "400px" }}
              useResizeHandler
            />
          </div>

          {/* Entropy */}
          <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "6px", padding: "14px 16px", background: "#0a0a0a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#333", textTransform: "uppercase" }}>entropy — {e.status}</span>
              <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: ENT_COLOR[e.status] || "#666", fontWeight: 500 }}>{e.rho.toFixed(3)}× threshold</span>
            </div>
            <EntropyLineChart entropy={hist.entropy} threshold={hist.threshold} />
            <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
              <span style={{ fontSize: "10px", color: "#333" }}>current {e.entropy.toFixed(5)}</span>
              <span style={{ fontSize: "10px", color: "#555" }}>threshold {e.threshold.toFixed(5)}</span>
              <span style={{ fontSize: "10px", color: e.trend === "rising" ? "#f0c040" : "#555" }}>
                {e.trend === "rising" ? "↑ rising into close" : "↓ falling into close"}
              </span>
            </div>
          </div>

                </>
      ) : (
        <p style={{ fontSize: "12px", color: "#444", padding: "20px 0" }}>chart data unavailable</p>
      )}
    </div>
  )
}
