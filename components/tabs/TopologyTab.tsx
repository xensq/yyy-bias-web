"use client"
import { useEffect, useState } from "react"
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
  "BULL TREND": "var(--bull)", "BEAR TREND": "var(--bear)",
  CONSOLIDATION: "var(--warn)", EXTENDED: "#f97316", UNCHARTED: "var(--bear)"
}
const ENT_COLOR: Record<string, string> = { NORMAL: "var(--bull)", ELEVATED: "var(--warn)", CRITICAL: "var(--bear)" }

export default function TopologyTab({ topology: t, entropy: e }: TopoProps) {
  const [hist, setHist] = useState<HistData | null>(null)
  const [loading, setLoading] = useState(true)
  const rc = REGIME_COLOR[t.regime] || "var(--muted)"
  const ec = ENT_COLOR[e.status] || "var(--muted)"

  useEffect(() => {
    fetch(`${API}/history`)
      .then(r => r.json())
      .then(setHist)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: "regime", value: t.regime, color: rc },
    { label: "pca1 trend", value: `${t.pca1 >= 0 ? "+" : ""}${t.pca1.toFixed(3)}`, color: t.pca1 > 1 ? "var(--bull)" : t.pca1 < -1 ? "var(--bear)" : "var(--muted)" },
    { label: "pca2 momentum", value: `${t.pca2 >= 0 ? "+" : ""}${t.pca2.toFixed(3)}`, color: t.aligned ? "var(--bull)" : "var(--warn)" },
    { label: "vol z-score", value: `${t.vol_z >= 0 ? "+" : ""}${t.vol_z.toFixed(3)}`, color: t.vol_z > 1.5 ? "var(--bear)" : t.vol_z > 0.5 ? "var(--warn)" : "var(--muted)" },
    { label: "entropy", value: `${e.rho.toFixed(3)}×`, color: ec },
    { label: "size rule", value: e.status === "CRITICAL" ? "NO TRADE" : e.status === "ELEVATED" ? "HALF SIZE" : "FULL SIZE", color: e.status === "CRITICAL" ? "var(--bear)" : e.status === "ELEVATED" ? "var(--warn)" : "var(--bull)" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>

      {/* Stats row */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
        {stats.map(({ label, value, color }, i, arr) => (
          <div key={label} style={{ padding: "16px 20px", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>{label}</p>
            <p style={{ fontSize: "13px", fontFamily: "JetBrains Mono", color, fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Phase space */}
      {!loading && hist && !hist.error && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>phase space · pca1 × pca2 × vol z · drag to rotate</span>
            <span style={{ fontSize: "9px", color: "var(--muted)" }}>{hist.n} sessions</span>
          </div>
          <Plot
            data={[
              {
                type: "scatter3d" as const,
                x: hist.pca1.slice(0, -1), y: hist.pca2.slice(0, -1), z: hist.vol_z.slice(0, -1),
                mode: "markers" as const,
                marker: {
                  size: 3, opacity: 0.5,
                  color: hist.entropy.slice(0, -1).map((v: number, i: number) => v / (hist.threshold[i] || 1)),
                  colorscale: [[0, "#00c896"], [0.6, "#e8b84b"], [1.0, "#ff4466"]] as any,
                  cmin: 0, cmax: 1.3, showscale: false,
                },
                hoverinfo: "skip" as const
              },
              {
                type: "scatter3d" as const,
                x: [t.pca1], y: [t.pca2], z: [t.vol_z],
                mode: "markers" as const,
                marker: { size: 10, color: "#f97316", line: { color: "#fff", width: 1 } },
                hovertemplate: `trend: ${t.pca1.toFixed(3)}<br>momentum: ${t.pca2.toFixed(3)}<br>vol z: ${t.vol_z.toFixed(3)}<extra>now</extra>`,
                showlegend: false
              }
            ]}
            layout={{
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
              margin: { l: 0, r: 0, t: 0, b: 0 },
              scene: {
                bgcolor: "rgba(0,0,0,0)",
                xaxis: { title: { text: "PCA1", font: { family: "JetBrains Mono", size: 9, color: "#44445a" } }, gridcolor: "#1e1e2e", tickfont: { family: "JetBrains Mono", size: 8, color: "#44445a" } },
                yaxis: { title: { text: "PCA2", font: { family: "JetBrains Mono", size: 9, color: "#44445a" } }, gridcolor: "#1e1e2e", tickfont: { family: "JetBrains Mono", size: 8, color: "#44445a" } },
                zaxis: { title: { text: "Vol Z", font: { family: "JetBrains Mono", size: 9, color: "#44445a" } }, gridcolor: "#1e1e2e", tickfont: { family: "JetBrains Mono", size: 8, color: "#44445a" } },
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


      {loading && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "32px", display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "11px" }}>
          <div style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
          loading history...
        </div>
      )}



      {/* Entropy */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: "20px 24px", borderRight: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>entropy</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "9px", color: ec, textTransform: "uppercase", letterSpacing: "0.15em" }}>{e.status}</span>
              <span style={{ fontSize: "20px", fontFamily: "JetBrains Mono", color: ec, fontWeight: 600 }}>{e.rho.toFixed(3)}×</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
            {[
              { label: "current", value: e.entropy.toFixed(5) },
              { label: "threshold", value: e.threshold.toFixed(5) },
              { label: "trend", value: e.trend === "rising" ? "↑ rising" : "↓ falling", color: e.trend === "rising" ? "var(--warn)" : "var(--bull)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "3px" }}>{label}</p>
                <p style={{ fontSize: "11px", fontFamily: "JetBrains Mono", color: color || "var(--muted)" }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: ec, lineHeight: 1.7 }}>
              {e.status === "CRITICAL" ? "⚠ entropy critical — stand aside or minimum size only" :
               e.status === "ELEVATED" ? "entropy elevated — half size until it normalizes" :
               e.rho < 0.5 ? "entropy very low — signals clean, full size justified" :
               "entropy normal — signals reliable, standard sizing applies"}
            </p>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "16px" }}>what this means</span>
          {[
            { label: "pca1", desc: "primary trend axis. >+1 = strong bull, <−1 = strong bear, near 0 = no direction" },
            { label: "pca2", desc: "momentum. aligned with pca1 = follow-through. opposed = trend fading" },
            { label: "vol z", desc: ">+1.5 = vol spike expect chop. near 0 = calm tape, signals reliable" },
            { label: "entropy", desc: "signal reliability. below 1× = clean. above 1× = reduce size. above 2× = stop trading" },
          ].map(({ label, desc }) => (
            <div key={label} style={{ display: "flex", gap: "12px", paddingBottom: "10px", marginBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "JetBrains Mono", width: "60px", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.6 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
