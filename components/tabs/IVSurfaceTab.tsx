"use client"
import TerminalLoader from "@/components/TerminalLoader"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
// @ts-ignore
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface SurfacePoint { strike: number; dte: number; iv: number; moneyness: number }

function gridSurface(points: SurfacePoint[]) {
  const mBins: number[] = []
  for (let m = 0.80; m <= 1.21; m += 0.01) mBins.push(parseFloat(m.toFixed(2)))
  const maxDTE = Math.max(...points.map(p => p.dte))
  const dBins = [1,2,3,5,7,10,14,21,30,45,60,90,120,180].filter(d => d <= maxDTE + 15)
  const z: number[][] = dBins.map(dte =>
    mBins.map(mon => {
      const nearest = points
        .map(p => ({ iv: p.iv, d: Math.sqrt(((p.moneyness - mon) / 0.04) ** 2 + ((p.dte - dte) / 12) ** 2) }))
        .sort((a, b) => a.d - b.d).slice(0, 8)
      if (nearest[0].d < 0.001) return nearest[0].iv
      const ws = nearest.map(n => 1 / n.d ** 2)
      const tot = ws.reduce((a, b) => a + b, 0)
      return ws.reduce((s, w, i) => s + w * nearest[i].iv, 0) / tot
    })
  )
  return { x: mBins, y: dBins, z }
}

export default function IVSurfaceTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<{ points: SurfacePoint[]; spot: number; atm_iv: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = (t: string) => {
    setLoading(true); setError(null); setData(null)
    fetch(`${API}/iv_surface?ticker=${t}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch IV surface"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(ticker) }, [ticker])

  const surface = data?.points.length ? gridSurface(data.points) : null
  const atmIdx = Math.round((1.0 - 0.80) / 0.01)

  const plotData: any[] = surface ? [
    {
      type: "surface",
      x: surface.x,
      y: surface.y,
      z: surface.z,
      colorscale: [
        [0.00, "#001510"],
        [0.15, "#00c896"],
        [0.45, "#f0c040"],
        [0.72, "#f97316"],
        [1.00, "#ff2222"]
      ],
      showscale: true,
      colorbar: {
        thickness: 8, len: 0.65, x: 1.01,
        tickfont: { family: "JetBrains Mono, monospace", size: 8, color: "var(--dim)" },
        tickformat: ".0%",
        title: { text: "IV", font: { color: "var(--dim)", size: 9, family: "JetBrains Mono" } }
      },
      contours: {
        z: { show: true, usecolormap: true, highlightcolor: "rgba(255,255,255,0.15)", project: { z: false } },
        x: { show: false }, y: { show: false }
      },
      opacity: 0.92,
      lighting: { ambient: 0.85, diffuse: 0.6, specular: 0.25, roughness: 0.55 },
      hovertemplate: "moneyness: %{x:.3f}<br>dte: %{y}d<br>iv: %{z:.1%}<extra></extra>"
    },
    {
      type: "scatter3d",
      x: Array(surface.y.length).fill(1.0),
      y: surface.y,
      z: surface.y.map((_: number, i: number) => surface.z[i]?.[atmIdx] ?? 0),
      mode: "lines",
      line: { color: "rgba(0,200,150,0.8)", width: 5 },
      hoverinfo: "skip",
      showlegend: false
    }
  ] : []

  const layout: any = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 0, r: 60, t: 10, b: 0 },
    scene: {
      bgcolor: "rgba(0,0,0,0)",
      xaxis: {
        title: { text: "moneyness (K/S)", font: { family: "JetBrains Mono", size: 9, color: "var(--dim)" } },
        gridcolor: "rgba(255,255,255,0.06)", zerolinecolor: "#1e1e1e",
        tickfont: { family: "JetBrains Mono", size: 8, color: "var(--dim)" }, tickformat: ".2f"
      },
      yaxis: {
        title: { text: "DTE", font: { family: "JetBrains Mono", size: 9, color: "var(--dim)" } },
        gridcolor: "rgba(255,255,255,0.06)", zerolinecolor: "#1e1e1e",
        tickfont: { family: "JetBrains Mono", size: 8, color: "var(--dim)" }
      },
      zaxis: {
        title: { text: "IV", font: { family: "JetBrains Mono", size: 9, color: "var(--dim)" } },
        gridcolor: "rgba(255,255,255,0.06)", zerolinecolor: "#1e1e1e",
        tickfont: { family: "JetBrains Mono", size: 8, color: "var(--dim)" }, tickformat: ".0%"
      },
      camera: { eye: { x: 1.9, y: -1.7, z: 0.9 }, up: { x: 0, y: 0, z: 1 } },
      aspectmode: "manual",
      aspectratio: { x: 2.0, y: 1.2, z: 0.75 }
    },
    dragmode: "orbit"
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "6px" }}>iv surface</p>
          <p style={{ fontSize: "12px", color: "var(--dim)", fontFamily: "JetBrains Mono, monospace" }}>
            implied volatility by moneyness and expiration
            {data ? ` · spot ${data.spot.toLocaleString()} · atm iv ${(data.atm_iv * 100).toFixed(1)}%` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)} style={{
              padding: "6px 14px", fontSize: "11px", letterSpacing: "0.1em",
              fontFamily: "JetBrains Mono, monospace",
              border: `0.5px solid ${ticker === t ? "#00c896" : "var(--border)"}`,
              background: ticker === t ? "rgba(0,200,150,0.08)" : "transparent",
              color: ticker === t ? "#00c896" : "var(--dim)",
              cursor: "pointer", borderRadius: "4px"
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "8px", background: "rgba(0,0,0,0)", overflow: "hidden" }}>
        {loading && <TerminalLoader />}
        {error && <p style={{ color: "#ff5555", fontSize: "12px", padding: "80px 0", textAlign: "center", fontFamily: "JetBrains Mono, monospace" }}>{error}</p>}
        {surface && !loading && (
          <Plot
            data={plotData}
            layout={layout}
            config={{ displayModeBar: false, responsive: true, scrollZoom: true }}
            style={{ width: "100%", height: "540px" }}
            useResizeHandler
          />
        )}
      </div>
      <div style={{ display: "flex", gap: "24px", fontSize: "10px", color: "var(--muted)", fontFamily: "JetBrains Mono, monospace" }}>
        <span>· drag to rotate · scroll to zoom</span>
        <span>· color: teal → amber → red = low → mid → high IV</span>
        <span>· teal line = ATM (moneyness 1.0)</span>
      </div>
    </div>
  )
}
