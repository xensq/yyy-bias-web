"use client"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
// @ts-ignore
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface SkewPoint { dte: number; expiry: string; moneyness: number; strike: number; call_iv: number; put_iv: number; skew: number }
interface SentimentPoint { strike: number; side: string; iv: number; volume: number; oi: number; iv_zscore: number; above_spot: boolean }

interface FlowData {
  spot: number; ticker: string
  skew_data: SkewPoint[]; skew_regime: string; skew_note: string
  avg_skew: number; put_25d_skew: number; call_25d_skew: number
  atm_iv_by_exp: Record<string, number>
  sentiment_data: SentimentPoint[]; sentiment: string; sentiment_note: string
  avg_call_iv: number; avg_put_iv: number; iv_ratio: number
  vix_history: number[]; vix_dates: string[]
  current_vix: number; vix_mean_30d: number; vix_regime: string
  pcr: number; pcr_signal: string; total_call_oi: number; total_put_oi: number
  error: string | null
}

function regimeColor(r: string) {
  if (r === "FEAR") return "var(--bear)"
  if (r === "CAUTION" || r === "ELEVATED") return "var(--warn)"
  if (r === "GREED" || r === "CALM") return "var(--bull)"
  return "var(--dim)"
}

export default function FlowTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<FlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`${API}/flow?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch flow data"))
      .finally(() => setLoading(false))
  }, [ticker])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)" }}>options flow — skew · sentiment · volatility</p>
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
            {data ? `spot ${data.spot.toLocaleString()} · vix ${data.current_vix} · pcr ${data.pcr}` : "loading..."}
          </p>
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
          fetching options flow...
        </div>
      )}
      {error && <p style={{ color: "var(--bear)", fontSize: "12px" }}>{error}</p>}

      {data && !loading && (
        <>
          {/* Top status row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[
              { label: "skew regime", value: data.skew_regime, color: regimeColor(data.skew_regime) },
              { label: "iv sentiment", value: data.sentiment, color: regimeColor(data.sentiment === "BEARISH" || data.sentiment === "MILD BEAR" ? "FEAR" : data.sentiment === "BULLISH" ? "GREED" : "NEUTRAL") },
              { label: "vix regime", value: data.vix_regime, color: regimeColor(data.vix_regime) },
              { label: "pcr signal", value: data.pcr_signal, color: data.pcr > 1.3 ? "var(--bull)" : data.pcr < 0.7 ? "var(--bear)" : "var(--dim)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass" style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                <p style={{ fontSize: "13px", fontFamily: "JetBrains Mono, monospace", color, fontWeight: 500, textTransform: "uppercase" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* IV Skew curve */}
          {data.skew_data.length > 0 && (() => {
            const exps = Array.from(new Set(data.skew_data.map(d => d.expiry))).sort()
            const colors = ["rgba(0,200,150,0.8)", "rgba(240,192,64,0.7)", "rgba(255,130,100,0.6)"]
            return (
              <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase" }}>iv skew — put iv minus call iv by moneyness</span>
                    <span style={{ fontSize: "10px", color: regimeColor(data.skew_regime), marginLeft: "12px", fontWeight: 500 }}>{data.skew_regime}</span>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--muted)" }}>{data.skew_note}</span>
                </div>
                <Plot
                  data={[
                    ...exps.map((exp, i) => {
                      const pts = data.skew_data.filter(d => d.expiry === exp).sort((a,b) => a.moneyness - b.moneyness)
                      return {
                        type: "scatter" as const,
                        x: pts.map(p => p.moneyness),
                        y: pts.map(p => p.skew),
                        mode: "lines+markers" as const,
                        name: `${exp} (${pts[0]?.dte || 0}d)`,
                        line: { color: colors[i] || "#888", width: 2 },
                        marker: { size: 4, color: colors[i] || "#888" },
                        hovertemplate: "moneyness %{x}<br>skew %{y:.2f}%<extra>" + exp + "</extra>",
                      }
                    }),
                    // Zero line reference
                    {
                      type: "scatter" as const,
                      x: [0.90, 1.10], y: [0, 0],
                      mode: "lines" as const,
                      line: { color: "rgba(255,255,255,0.1)", width: 1, dash: "dot" as const },
                      hoverinfo: "skip" as const, showlegend: false,
                    },
                    // ATM marker
                    {
                      type: "scatter" as const,
                      x: [1.0, 1.0], y: [-2, 10],
                      mode: "lines" as const,
                      line: { color: "rgba(255,255,255,0.15)", width: 1, dash: "dash" as const },
                      name: "ATM", hoverinfo: "skip" as const,
                    }
                  ]}
                  layout={{
                    paper_bgcolor: "transparent", plot_bgcolor: "#050510",
                    margin: { l: 50, r: 20, t: 10, b: 50 },
                    xaxis: {
                      title: { text: "Moneyness (K/S)", font: { family: "JetBrains Mono", size: 9, color: "#555" } },
                      tickfont: { family: "JetBrains Mono", size: 9, color: "#555" },
                      gridcolor: "rgba(255,255,255,0.03)", zeroline: false,
                      tickformat: ".2f",
                    },
                    yaxis: {
                      title: { text: "Put IV - Call IV (%)", font: { family: "JetBrains Mono", size: 9, color: "#555" } },
                      tickfont: { family: "JetBrains Mono", size: 9, color: "#555" },
                      gridcolor: "rgba(255,255,255,0.03)", zeroline: true, zerolinecolor: "rgba(255,255,255,0.08)",
                    },
                    legend: { font: { family: "JetBrains Mono", size: 9, color: "#555" }, bgcolor: "transparent", x: 0.01, y: 0.99 },
                    shapes: [
                      { type: "rect", x0: 0.95, x1: 1.05, y0: -10, y1: 20, fillcolor: "rgba(255,255,255,0.02)", line: { width: 0 } }
                    ],
                  } as any}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: "100%", height: "320px" }}
                  useResizeHandler
                />
                {/* Skew stats */}
                <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--border)", display: "flex", gap: "32px" }}>
                  {[
                    { label: "25Δ put skew", value: `${data.put_25d_skew.toFixed(2)}%`, color: data.put_25d_skew > 2 ? "var(--bear)" : "var(--dim)" },
                    { label: "25Δ call skew", value: `${data.call_25d_skew.toFixed(2)}%`, color: data.call_25d_skew > 2 ? "var(--bull)" : "var(--dim)" },
                    { label: "atm skew", value: `${data.avg_skew.toFixed(2)}%`, color: "var(--dim)" },
                    { label: "put iv avg", value: `${data.avg_put_iv.toFixed(1)}%`, color: "var(--bear)" },
                    { label: "call iv avg", value: `${data.avg_call_iv.toFixed(1)}%`, color: "var(--bull)" },
                    { label: "iv ratio (p/c)", value: data.iv_ratio.toFixed(3), color: data.iv_ratio > 1.1 ? "var(--bear)" : "var(--bull)" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3px" }}>{label}</p>
                      <p style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Sentiment heatmap + VIX side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* IV Sentiment by strike */}
            <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase" }}>iv sentiment by strike</span>
                <span style={{ fontSize: "10px", color: regimeColor(data.sentiment === "BEARISH" ? "FEAR" : data.sentiment === "BULLISH" ? "GREED" : "NEUTRAL"), marginLeft: "10px" }}>{data.sentiment}</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "12px", lineHeight: 1.6 }}>{data.sentiment_note}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {data.sentiment_data
                    .filter(d => d.side === "call")
                    .sort((a, b) => b.strike - a.strike)
                    .slice(0, 12)
                    .map(row => {
                      const max = Math.max(...data.sentiment_data.map(d => d.iv))
                      const pct = (row.iv / max) * 100
                      const isNear = Math.abs(row.strike - data.spot) < 5
                      return (
                        <div key={`c${row.strike}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "9px", fontFamily: "JetBrains Mono, monospace", color: isNear ? "var(--text)" : "var(--muted)", width: "48px", textAlign: "right" }}>
                            {row.strike.toLocaleString()}
                          </span>
                          <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `rgba(0,200,150,${0.3 + (pct/100)*0.6})`, borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontSize: "9px", color: "var(--bull)", width: "40px", textAlign: "right" }}>{row.iv.toFixed(1)}%</span>
                        </div>
                      )
                    })
                  }
                  <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                  {data.sentiment_data
                    .filter(d => d.side === "put")
                    .sort((a, b) => b.strike - a.strike)
                    .slice(0, 12)
                    .map(row => {
                      const max = Math.max(...data.sentiment_data.map(d => d.iv))
                      const pct = (row.iv / max) * 100
                      const isNear = Math.abs(row.strike - data.spot) < 5
                      return (
                        <div key={`p${row.strike}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "9px", fontFamily: "JetBrains Mono, monospace", color: isNear ? "var(--text)" : "var(--muted)", width: "48px", textAlign: "right" }}>
                            {row.strike.toLocaleString()}
                          </span>
                          <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `rgba(255,85,85,${0.3 + (pct/100)*0.6})`, borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontSize: "9px", color: "var(--bear)", width: "40px", textAlign: "right" }}>{row.iv.toFixed(1)}%</span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>

            {/* VIX + PCR */}
            <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase" }}>vix — 30 day history</span>
                <div style={{ display: "flex", gap: "16px" }}>
                  <span style={{ fontSize: "10px", fontFamily: "JetBrains Mono, monospace", color: regimeColor(data.vix_regime) }}>{data.current_vix}</span>
                  <span style={{ fontSize: "10px", color: "var(--muted)" }}>30d avg {data.vix_mean_30d}</span>
                </div>
              </div>
              {data.vix_history.length > 0 && (
                <Plot
                  data={[
                    {
                      type: "scatter" as const,
                      x: data.vix_dates,
                      y: data.vix_history,
                      mode: "lines" as const,
                      fill: "tozeroy" as const,
                      fillcolor: "rgba(255,85,85,0.08)",
                      line: { color: "rgba(255,85,85,0.7)", width: 1.5 },
                      hovertemplate: "%{x}<br>VIX: %{y:.2f}<extra></extra>",
                      name: "VIX",
                    },
                    // Mean line
                    {
                      type: "scatter" as const,
                      x: [data.vix_dates[0], data.vix_dates[data.vix_dates.length-1]],
                      y: [data.vix_mean_30d, data.vix_mean_30d],
                      mode: "lines" as const,
                      line: { color: "rgba(240,192,64,0.5)", width: 1, dash: "dash" as const },
                      name: "30d mean", hoverinfo: "skip" as const,
                    },
                    // Fear threshold
                    {
                      type: "scatter" as const,
                      x: [data.vix_dates[0], data.vix_dates[data.vix_dates.length-1]],
                      y: [25, 25],
                      mode: "lines" as const,
                      line: { color: "rgba(255,85,85,0.3)", width: 1, dash: "dot" as const },
                      name: "fear (25)", hoverinfo: "skip" as const,
                    }
                  ]}
                  layout={{
                    paper_bgcolor: "transparent", plot_bgcolor: "#050510",
                    margin: { l: 40, r: 16, t: 10, b: 40 },
                    xaxis: {
                      tickfont: { family: "JetBrains Mono", size: 8, color: "#444" },
                      gridcolor: "rgba(255,255,255,0.02)", zeroline: false,
                      nticks: 6,
                    },
                    yaxis: {
                      tickfont: { family: "JetBrains Mono", size: 8, color: "#444" },
                      gridcolor: "rgba(255,255,255,0.03)",
                    },
                    legend: { font: { family: "JetBrains Mono", size: 8, color: "#444" }, bgcolor: "transparent", x: 0.01, y: 0.99 },
                  } as any}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: "100%", height: "220px" }}
                  useResizeHandler
                />
              )}
              {/* PCR */}
              <div style={{ padding: "14px 16px", borderTop: "0.5px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--dim)", textTransform: "uppercase" }}>put/call ratio (OI)</p>
                  <p style={{ fontSize: "16px", fontFamily: "JetBrains Mono, monospace", color: data.pcr > 1.3 ? "var(--bear)" : data.pcr < 0.7 ? "var(--bull)" : "var(--warn)" }}>{data.pcr}</p>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{ height: "100%", width: `${Math.min(data.pcr / 2 * 100, 100)}%`, background: data.pcr > 1.3 ? "var(--bear)" : data.pcr < 0.7 ? "var(--bull)" : "var(--warn)", borderRadius: "2px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "9px", color: "var(--muted)" }}>call oi {data.total_call_oi.toLocaleString()}</span>
                  <span style={{ fontSize: "9px", color: regimeColor(data.pcr > 1.3 ? "FEAR" : data.pcr < 0.7 ? "GREED" : "NEUTRAL"), textTransform: "uppercase" }}>{data.pcr_signal}</span>
                  <span style={{ fontSize: "9px", color: "var(--muted)" }}>put oi {data.total_put_oi.toLocaleString()}</span>
                </div>
                <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.6 }}>
                  {data.pcr > 1.3 ? "extreme put buying — historically a contrarian bullish signal. crowd is overly hedged." :
                   data.pcr < 0.7 ? "extreme call buying — complacency or squeeze setup. contrarian bearish signal." :
                   "balanced positioning — no extreme reading from put/call flow."}
                </p>
              </div>
            </div>
          </div>

          {/* How to read */}
          <div className="glass" style={{ padding: "18px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "10px" }}>how to read the flow tab</p>
            <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.8 }}>
              skew tells you what the options market fears — steep put skew means institutions are buying downside protection, which is bearish but also a contrarian signal when extreme. iv sentiment shows where premium is being bid up across strikes — elevated put IV relative to calls confirms bearish flow. vix confirms the macro vol regime. pcr above 1.3 is historically a contrarian bullish signal (crowd is too hedged). use all three together — when skew, sentiment, and pcr all point the same direction, that's a high-conviction read.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
