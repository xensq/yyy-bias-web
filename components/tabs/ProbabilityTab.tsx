"use client"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
// @ts-ignore
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface ProbData {
  spot: number; ticker: string
  mu_daily_pct: number; sigma_daily_pct: number
  mu_ann_pct: number; sigma_ann_pct: number
  skewness: number; excess_kurtosis: number
  n_days: number; fat_tails: boolean
  days_beyond_2s: number; days_beyond_2s_pct: number
  normal_expect_2s_pct: number
  bands_1d: Record<string, number[]>
  bands_1w: Record<string, number[]>
  price_grid: number[]; heatmap: number[][]
  sigma_bands: Record<string, number[]>
  terminal_density: number[]
  return_hist_centers: number[]; return_hist_counts: number[]
  normal_fit_x: number[]; normal_fit_y: number[]
  error: string | null
}

export default function ProbabilityTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<ProbData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"heatmap" | "distribution">("heatmap")

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`${API}/probability?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch probability data"))
      .finally(() => setLoading(false))
  }, [ticker])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div>
            <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)" }}>probability lab</p>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
              {data ? `${data.n_days} trading days · σ ${data.sigma_daily_pct.toFixed(3)}% daily · spot ${data.spot.toLocaleString()}` : "loading..."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["heatmap", "distribution"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: "5px 14px", border: `0.5px solid ${view === v ? "var(--accent)" : "var(--border)"}`,
                  background: view === v ? "var(--accent-dim)" : "transparent",
                  color: view === v ? "var(--accent)" : "var(--muted)", fontSize: "10px",
                  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                  fontFamily: "inherit", borderRadius: "3px" }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              style={{ padding: "5px 12px", border: `0.5px solid ${ticker === t ? "var(--accent)" : "var(--border)"}`,
                background: ticker === t ? "var(--accent-dim)" : "transparent",
                color: ticker === t ? "var(--accent)" : "var(--muted)", fontSize: "10px",
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                fontFamily: "inherit", borderRadius: "3px" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--muted)", fontSize: "12px", padding: "32px 0" }}>
          <div style={{ width: "5px", height: "5px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
          computing probability distributions...
        </div>
      )}
      {error && <p style={{ color: "var(--bear)", fontSize: "12px" }}>{error}</p>}

      {data && !loading && view === "heatmap" && (
        <>
          {/* Forward probability heatmap */}
          <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase" }}>
                {ticker} forward probability density · 5-day forecast · drag to zoom
              </span>
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>spot {data.spot.toLocaleString()} · iv-adjusted log-normal</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
              {/* Main heatmap */}
              <Plot
                data={[
                  {
                    type: "heatmap" as const,
                    z: data.heatmap,
                    x: [1, 2, 3, 4, 5],
                    y: data.price_grid,
                    colorscale: [
                      [0, "#050510"],
                      [0.15, "#0a1628"],
                      [0.35, "#0d3b6e"],
                      [0.55, "#1a6b3c"],
                      [0.72, "#c8a020"],
                      [0.88, "#e05020"],
                      [1.0, "#ff2020"]
                    ] as any,
                    showscale: true,
                    colorbar: {
                      thickness: 10, len: 0.8,
                      tickfont: { family: "JetBrains Mono", size: 8, color: "#444" },
                      title: { text: "density", font: { family: "JetBrains Mono", size: 8, color: "#444" }, side: "right" as const },
                    },
                    hovertemplate: "day %{x}<br>price %{y:,.0f}<br>density %{z:.4f}<extra></extra>",
                  },
                  // Spot line
                  {
                    type: "scatter" as const,
                    x: [1, 2, 3, 4, 5],
                    y: Array(5).fill(data.spot),
                    mode: "lines" as const,
                    line: { color: "rgba(240,240,240,0.9)", width: 1.5 },
                    name: "spot",
                    hoverinfo: "skip" as const,
                  },
                  // +1σ
                  {
                    type: "scatter" as const,
                    x: [1,2,3,4,5], y: data.sigma_bands["1s"],
                    mode: "lines" as const,
                    line: { color: "rgba(0,200,150,0.7)", width: 1, dash: "dash" as const },
                    name: "+1σ", hovertemplate: "+1σ: %{y:,.0f}<extra></extra>",
                  },
                  {
                    type: "scatter" as const,
                    x: [1,2,3,4,5], y: data.sigma_bands["m1s"],
                    mode: "lines" as const,
                    line: { color: "rgba(0,200,150,0.7)", width: 1, dash: "dash" as const },
                    name: "-1σ", hovertemplate: "-1σ: %{y:,.0f}<extra></extra>",
                  },
                  // +2σ
                  {
                    type: "scatter" as const,
                    x: [1,2,3,4,5], y: data.sigma_bands["2s"],
                    mode: "lines" as const,
                    line: { color: "rgba(240,192,64,0.6)", width: 1, dash: "dot" as const },
                    name: "+2σ", hovertemplate: "+2σ: %{y:,.0f}<extra></extra>",
                  },
                  {
                    type: "scatter" as const,
                    x: [1,2,3,4,5], y: data.sigma_bands["m2s"],
                    mode: "lines" as const,
                    line: { color: "rgba(240,192,64,0.6)", width: 1, dash: "dot" as const },
                    name: "-2σ", hovertemplate: "-2σ: %{y:,.0f}<extra></extra>",
                  },
                  // +3σ
                  {
                    type: "scatter" as const,
                    x: [1,2,3,4,5], y: data.sigma_bands["3s"],
                    mode: "lines" as const,
                    line: { color: "rgba(255,85,85,0.5)", width: 1, dash: "dot" as const },
                    name: "+3σ", hovertemplate: "+3σ: %{y:,.0f}<extra></extra>",
                  },
                  {
                    type: "scatter" as const,
                    x: [1,2,3,4,5], y: data.sigma_bands["m3s"],
                    mode: "lines" as const,
                    line: { color: "rgba(255,85,85,0.5)", width: 1, dash: "dot" as const },
                    name: "-3σ", hovertemplate: "-3σ: %{y:,.0f}<extra></extra>",
                  },
                ]}
                layout={{
                  paper_bgcolor: "transparent", plot_bgcolor: "#050510",
                  margin: { l: 60, r: 20, t: 10, b: 40 },
                  xaxis: {
                    title: { text: "Trading Days Forward", font: { family: "JetBrains Mono", size: 9, color: "#444" } },
                    tickvals: [1,2,3,4,5],
                    ticktext: ["D1", "D2", "D3", "D4", "D5"],
                    tickfont: { family: "JetBrains Mono", size: 9, color: "#555" },
                    gridcolor: "rgba(255,255,255,0.03)", zeroline: false,
                  },
                  yaxis: {
                    tickfont: { family: "JetBrains Mono", size: 9, color: "#555" },
                    gridcolor: "rgba(255,255,255,0.03)", zeroline: false,
                    tickformat: ",.0f",
                  },
                  legend: { font: { family: "JetBrains Mono", size: 9, color: "#555" }, bgcolor: "transparent", x: 0.01, y: 0.99 },
                  showlegend: true,
                } as any}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%", height: "420px" }}
                useResizeHandler
              />
              {/* Terminal distribution — sideways */}
              <Plot
                data={[
                  {
                    type: "bar" as const,
                    x: data.terminal_density,
                    y: data.price_grid,
                    orientation: "h" as const,
                    marker: {
                      color: data.terminal_density.map(d =>
                        d > 0.7 ? "rgba(255,32,32,0.8)" : d > 0.4 ? "rgba(224,80,32,0.7)" :
                        d > 0.2 ? "rgba(200,160,32,0.6)" : d > 0.1 ? "rgba(26,107,62,0.5)" : "rgba(13,59,110,0.4)"
                      ),
                    },
                    hovertemplate: "%{y:,.0f}<extra></extra>",
                  }
                ]}
                layout={{
                  paper_bgcolor: "transparent", plot_bgcolor: "#050510",
                  margin: { l: 4, r: 8, t: 10, b: 40 },
                  width: 110,
                  xaxis: { visible: false, zeroline: false },
                  yaxis: {
                    tickfont: { family: "JetBrains Mono", size: 8, color: "#444" },
                    gridcolor: "transparent", zeroline: false, tickformat: ",.0f",
                    side: "right" as const,
                  },
                  bargap: 0.05,
                  title: { text: "terminal", font: { family: "JetBrains Mono", size: 8, color: "#333" }, x: 0.5 },
                } as any}
                config={{ displayModeBar: false, responsive: false }}
                style={{ height: "420px", width: "110px" }}
              />
            </div>
          </div>

          {/* Probability bands table */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { title: "1-day probability bands", bands: data.bands_1d },
              { title: "1-week probability bands", bands: data.bands_1w },
            ].map(({ title, bands }) => (
              <div key={title} className="glass" style={{ padding: "18px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "14px" }}>{title}</p>
                {[
                  { label: "68% (1σ)", key: "68", color: "var(--bull)" },
                  { label: "90%", key: "90", color: "#4ade80" },
                  { label: "95% (2σ)", key: "95", color: "var(--warn)" },
                  { label: "99%", key: "99", color: "var(--bear)" },
                ].map(({ label, key, color }) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--border)" }}>
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>{label}</span>
                    <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color }}>
                      {bands[key][0].toLocaleString()} — {bands[key][1].toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {data && !loading && view === "distribution" && (
        <>
          {/* Return distribution */}
          <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase" }}>
                {ticker} daily return distribution · 2-year · {data.n_days} observations
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
              <Plot
                data={[
                  {
                    type: "bar" as const,
                    x: data.return_hist_centers,
                    y: data.return_hist_counts,
                    name: "actual returns",
                    marker: { color: "rgba(59,130,246,0.55)", line: { color: "rgba(59,130,246,0.2)", width: 0.5 } },
                    hovertemplate: "%{x:.2f}%: %{y:.4f}<extra></extra>",
                  },
                  {
                    type: "scatter" as const,
                    x: data.normal_fit_x,
                    y: data.normal_fit_y,
                    mode: "lines" as const,
                    name: `Normal(μ=${data.mu_daily_pct.toFixed(3)}%, σ=${data.sigma_daily_pct.toFixed(3)}%)`,
                    line: { color: "rgba(240,192,64,0.85)", width: 1.5 },
                    hoverinfo: "skip" as const,
                  },
                  // Sigma lines
                  ...[-3,-2,-1,1,2,3].map(n => ({
                    type: "scatter" as const,
                    x: [data.mu_daily_pct + n * data.sigma_daily_pct, data.mu_daily_pct + n * data.sigma_daily_pct],
                    y: [0, Math.max(...data.return_hist_counts) * 0.85],
                    mode: "lines" as const,
                    line: {
                      color: Math.abs(n) === 1 ? "rgba(0,200,150,0.4)" : Math.abs(n) === 2 ? "rgba(240,192,64,0.35)" : "rgba(255,85,85,0.35)",
                      width: 0.8, dash: "dash" as const
                    },
                    name: `${n > 0 ? "+" : ""}${n}σ`,
                    hoverinfo: "skip" as const,
                    showlegend: n > 0,
                  })),
                ]}
                layout={{
                  paper_bgcolor: "transparent", plot_bgcolor: "#050510",
                  margin: { l: 50, r: 20, t: 10, b: 50 },
                  xaxis: {
                    title: { text: "Daily Return %", font: { family: "JetBrains Mono", size: 9, color: "#444" } },
                    tickfont: { family: "JetBrains Mono", size: 9, color: "#555" },
                    gridcolor: "rgba(255,255,255,0.03)", zeroline: true, zerolinecolor: "rgba(255,255,255,0.08)",
                  },
                  yaxis: {
                    title: { text: "Density", font: { family: "JetBrains Mono", size: 9, color: "#444" } },
                    tickfont: { family: "JetBrains Mono", size: 9, color: "#555" },
                    gridcolor: "rgba(255,255,255,0.03)",
                  },
                  legend: { font: { family: "JetBrains Mono", size: 9, color: "#555" }, bgcolor: "transparent", x: 0.01, y: 0.99 },
                  bargap: 0.05,
                } as any}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%", height: "400px" }}
                useResizeHandler
              />

              {/* Stats panel */}
              <div style={{ width: "220px", padding: "20px 16px", borderLeft: "0.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "10px" }}>gaussian measurements</p>
                  {[
                    { label: `${ticker} spot`, value: data.spot.toLocaleString() },
                    { label: "daily μ", value: `${data.mu_daily_pct.toFixed(4)}%` },
                    { label: "daily σ", value: `${data.sigma_daily_pct.toFixed(4)}%` },
                    { label: "skewness", value: data.skewness.toFixed(4), color: data.skewness < -0.5 ? "var(--bear)" : data.skewness > 0.5 ? "var(--bull)" : "var(--dim)" },
                    { label: "excess kurtosis", value: data.excess_kurtosis.toFixed(4), color: data.excess_kurtosis > 3 ? "var(--warn)" : "var(--dim)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid var(--border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--muted)" }}>{label}</span>
                      <span style={{ fontSize: "10px", fontFamily: "JetBrains Mono, monospace", color: color || "var(--text)" }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "10px" }}>tail analysis</p>
                  {[
                    { label: "days > 2σ", value: `${data.days_beyond_2s_pct}%` },
                    { label: "normal expect", value: `${data.normal_expect_2s_pct}%` },
                    { label: "fat tails", value: data.fat_tails ? "YES" : "NO", color: data.fat_tails ? "var(--warn)" : "var(--bull)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid var(--border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--muted)" }}>{label}</span>
                      <span style={{ fontSize: "10px", fontFamily: "JetBrains Mono, monospace", color: color || "var(--text)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
