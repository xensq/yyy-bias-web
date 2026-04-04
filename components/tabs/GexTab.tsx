"use client"
import { useMemo, useState, useEffect } from "react"
import { StrikeData } from "@/lib/api"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface GexProps {
  gex: {
    spot: number; vol_trigger: number; call_wall: number; put_wall: number
    max_pain: number; net_gex_bn: number; above_vol_trigger: boolean
    positive_gamma: boolean; gamma_env: string; pain_pts: number
    strike_data: StrikeData[]; error: string | null
  }
}

export default function GexTab({ gex: initialGex }: GexProps) {
  const [ticker, setTicker] = useState("SPX")
  const [g, setG] = useState(initialGex)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState<{ strike: number; call_gex: number; put_gex: number; net: number; x: number; y: number } | null>(null)

  useEffect(() => {
    if (ticker === "SPX") { setG(initialGex); return }
    setLoading(true)
    fetch(`${API}/gex?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => setG(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ticker]) // eslint-disable-line

  if (g.error) return <div style={{ color: "var(--bear)", fontSize: "12px", padding: "16px" }}>{g.error}</div>

  const strikes = useMemo(() => {
    if (!g.strike_data?.length) return []
    const atm = g.spot || g.vol_trigger || 5000
    return [...g.strike_data].filter(s => Math.abs(s.strike / atm - 1) <= 0.025).sort((a, b) => b.strike - a.strike)
  }, [g.strike_data])

  const maxGex = useMemo(() => Math.max(...strikes.map(s => Math.max(Math.abs(s.call_gex), Math.abs(s.put_gex)))) || 0.1, [strikes])

  const BAR_H = 12, GAP = 2, CHART_W = 500, HALF = CHART_W / 2, LABEL_W = 60, TOTAL_W = LABEL_W + CHART_W
  const CHART_H = strikes.length * (BAR_H + GAP) + 40
  const toX = (v: number) => (Math.abs(v) / maxGex) * (HALF * 0.9)
  const yPos = (i: number) => 30 + i * (BAR_H + GAP)
  const toSVGY = (strike: number) => {
    const idx = strikes.findIndex(s => s.strike === strike)
    return idx < 0 ? -1 : yPos(idx) + BAR_H / 2
  }
  const spotY = (() => { const y = toSVGY(g.spot); if (y > 0) return y; const s = [...strikes].sort((a,b) => Math.abs(a.strike-g.spot)-Math.abs(b.strike-g.spot)); return s.length ? yPos(strikes.findIndex(x=>x.strike===s[0].strike))+BAR_H/2 : CHART_H/2 })()
  const trigY = toSVGY(g.vol_trigger) > 0 ? toSVGY(g.vol_trigger) : spotY - 20
  const cwY = toSVGY(g.call_wall) > 0 ? toSVGY(g.call_wall) : 40
  const pwY = toSVGY(g.put_wall) > 0 ? toSVGY(g.put_wall) : CHART_H - 40

  const envColor = g.above_vol_trigger ? "var(--bull)" : "var(--bear)"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>

      {/* Ticker + summary */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {TICKERS.map(t => (
              <button key={t} onClick={() => setTicker(t)}
                style={{ padding: "4px 12px", border: `1px solid ${ticker === t ? "var(--accent)" : "var(--border)"}`, background: ticker === t ? "var(--accent-dim)" : "transparent", color: ticker === t ? "var(--accent)" : "var(--muted)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
                {t}
              </button>
            ))}
          </div>
          {loading && <span style={{ fontSize: "9px", color: "var(--muted)" }}>loading...</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { label: "gamma env", value: g.gamma_env, color: g.positive_gamma ? "var(--bull)" : "var(--bear)" },
            { label: "spot vs trigger", value: g.above_vol_trigger ? "ABOVE" : "BELOW", color: envColor },
            { label: "net gex", value: `${g.net_gex_bn >= 0 ? "+" : ""}${g.net_gex_bn.toFixed(3)}B`, color: g.positive_gamma ? "var(--bull)" : "var(--bear)" },
            { label: "max pain", value: g.max_pain.toLocaleString(), color: "var(--warn)" },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} style={{ padding: "16px 20px", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>{label}</p>
              <p style={{ fontSize: "14px", fontWeight: 500, color, fontFamily: "JetBrains Mono" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>gex profile by strike</span>
          <div style={{ display: "flex", gap: "16px" }}>
            {[["calls", "var(--bull)"], ["puts", "var(--bear)"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "2px", background: c }} />
                <span style={{ fontSize: "9px", color: "var(--muted)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {strikes.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "11px", padding: "24px 20px" }}>no strike data — market may be closed</p>
        ) : (
          <div style={{ overflowX: "auto", padding: "0 20px" }}>
            <svg width={TOTAL_W} height={CHART_H} style={{ display: "block", minWidth: TOTAL_W, overflow: "visible" }}>
              <text x={LABEL_W + HALF} y={18} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="JetBrains Mono">0</text>
              <text x={LABEL_W + 4} y={18} fill="var(--muted)" fontSize="8" fontFamily="JetBrains Mono">puts ←</text>
              <text x={LABEL_W + CHART_W - 4} y={18} textAnchor="end" fill="var(--muted)" fontSize="8" fontFamily="JetBrains Mono">→ calls</text>
              <line x1={LABEL_W + HALF} y1={24} x2={LABEL_W + HALF} y2={CHART_H - 8} stroke="var(--border)" strokeWidth="1" />

              {strikes.map((s, i) => {
                const y = yPos(i)
                const cW = toX(s.call_gex), pW = toX(Math.abs(s.put_gex))
                const isSpot = Math.abs(s.strike - g.spot) < 5
                const isHov = hovered?.strike === s.strike
                const net = s.call_gex + s.put_gex
                return (
                  <g key={s.strike} style={{ cursor: "crosshair" }}
                    onMouseEnter={e => { const r = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect(); setHovered({ strike: s.strike, call_gex: s.call_gex, put_gex: s.put_gex, net, x: e.clientX - r.left, y }) }}
                    onMouseLeave={() => setHovered(null)}>
                    {isHov && <rect x={LABEL_W} y={y - 1} width={CHART_W} height={BAR_H + 2} fill="rgba(255,255,255,0.02)" />}
                    <text x={LABEL_W - 6} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="9" fontFamily="JetBrains Mono"
                      fill={isSpot ? "var(--text)" : isHov ? "var(--dim)" : "var(--muted)"}>
                      {s.strike.toLocaleString()}
                    </text>
                    {pW > 0.5 && <rect x={LABEL_W + HALF - pW} y={y} width={pW} height={BAR_H} fill={isHov ? "rgba(255,68,102,0.85)" : "rgba(255,68,102,0.5)"} />}
                    {cW > 0.5 && <rect x={LABEL_W + HALF} y={y} width={cW} height={BAR_H} fill={isHov ? "rgba(0,200,150,0.85)" : "rgba(0,200,150,0.5)"} />}
                  </g>
                )
              })}

              {/* Reference lines */}
              <line x1={LABEL_W} x2={LABEL_W+CHART_W} y1={spotY} y2={spotY} stroke="rgba(232,232,240,0.6)" strokeWidth="0.8" />
              <text x={LABEL_W+CHART_W-4} y={spotY-3} textAnchor="end" fontSize="8" fill="var(--muted)" fontFamily="JetBrains Mono">spot {g.spot.toLocaleString()}</text>
              <line x1={LABEL_W} x2={LABEL_W+CHART_W} y1={trigY} y2={trigY} stroke="rgba(232,184,75,0.6)" strokeWidth="0.8" strokeDasharray="4,3" />
              <text x={LABEL_W+CHART_W-4} y={trigY-3} textAnchor="end" fontSize="8" fill="var(--warn)" fontFamily="JetBrains Mono">vol trigger {g.vol_trigger.toLocaleString()}</text>
              <line x1={LABEL_W} x2={LABEL_W+CHART_W} y1={cwY} y2={cwY} stroke="rgba(0,200,150,0.4)" strokeWidth="0.8" strokeDasharray="4,3" />
              <text x={LABEL_W+CHART_W-4} y={cwY-3} textAnchor="end" fontSize="8" fill="var(--bull)" fontFamily="JetBrains Mono">call wall {g.call_wall.toLocaleString()}</text>
              <line x1={LABEL_W} x2={LABEL_W+CHART_W} y1={pwY} y2={pwY} stroke="rgba(255,68,102,0.4)" strokeWidth="0.8" strokeDasharray="4,3" />
              <text x={LABEL_W+CHART_W-4} y={pwY-3} textAnchor="end" fontSize="8" fill="var(--bear)" fontFamily="JetBrains Mono">put wall {g.put_wall.toLocaleString()}</text>

              {/* Tooltip */}
              {hovered && (
                <g>
                  <rect x={hovered.x > HALF ? hovered.x - 155 : hovered.x + 12} y={Math.min(hovered.y - 10, CHART_H - 85)}
                    width={144} height={78} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                  <text fontFamily="JetBrains Mono" fontSize="9">
                    <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18} y={Math.min(hovered.y - 10, CHART_H - 85) + 16} fill="var(--text)" fontWeight="500">strike {hovered.strike.toLocaleString()}</tspan>
                    <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18} dy="14" fill="var(--bull)">call  {hovered.call_gex >= 0 ? "+" : ""}{hovered.call_gex.toFixed(3)}B</tspan>
                    <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18} dy="13" fill="var(--bear)">put   {hovered.put_gex.toFixed(3)}B</tspan>
                    <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18} dy="13" fill={hovered.net >= 0 ? "var(--bull)" : "var(--bear)"}>net   {hovered.net >= 0 ? "+" : ""}{hovered.net.toFixed(3)}B</tspan>
                    <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18} dy="13" fill="var(--muted)">{hovered.strike > g.spot ? `+${(hovered.strike - g.spot).toFixed(0)} above` : `${(hovered.strike - g.spot).toFixed(0)} below`}</tspan>
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Gamma context */}
      <div style={{ background: "var(--surface)", border: `1px solid ${g.above_vol_trigger ? "rgba(0,200,150,0.2)" : "rgba(255,68,102,0.2)"}`, padding: "16px 20px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ width: "3px", background: envColor, alignSelf: "stretch", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: "11px", fontWeight: 500, color: envColor, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {g.above_vol_trigger ? "positive gamma environment" : "negative gamma environment"}
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.7 }}>
            {g.above_vol_trigger
              ? "above vol trigger — dealers long gamma, buying dips and selling rips. moves dampen. avoid chasing extended moves, fade the edges."
              : "below vol trigger — dealers short gamma, hedging amplifies directional moves. do not fade strong momentum. size down, let moves develop."}
          </p>
        </div>
      </div>

    </div>
  )
}
