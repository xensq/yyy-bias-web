"use client"
import { useMemo, useState, useEffect } from "react"
import { StrikeData } from "@/lib/api"

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

  if (g.error) return <div style={{ color: "#ff5555", fontSize: "12px", marginTop: "16px" }}>{g.error}</div>

  const strikes = useMemo(() => {
    if (!g.strike_data?.length) return []
    const atm = g.spot || g.vol_trigger || 5000
    return [...g.strike_data]
      .filter(s => Math.abs(s.strike / atm - 1) <= 0.025)
      .sort((a, b) => b.strike - a.strike)
  }, [g.strike_data])

  const maxGex = useMemo(() => {
    if (!strikes.length) return 0.1
    return Math.max(...strikes.map(s => Math.max(Math.abs(s.call_gex), Math.abs(s.put_gex)))) || 0.1
  }, [strikes])

  const BAR_HEIGHT = 14
  const BAR_GAP = 2
  const CHART_W = 520
  const HALF = CHART_W / 2
  const Y_LABEL_W = 68
  const TOTAL_W = Y_LABEL_W + CHART_W
  const CHART_H = strikes.length * (BAR_HEIGHT + BAR_GAP) + 40

  const toX = (val: number) => (Math.abs(val) / maxGex) * (HALF * 0.88)
  const yPos = (i: number) => 30 + i * (BAR_HEIGHT + BAR_GAP)

  const toSVGY = (strike: number) => {
    const idx = strikes.findIndex(s => s.strike === strike)
    if (idx < 0) return -1
    return yPos(idx) + BAR_HEIGHT / 2
  }

  const spotY    = toSVGY(g.spot) > 0 ? toSVGY(g.spot) : (() => {
    const sorted = [...strikes].sort((a,b) => Math.abs(a.strike-g.spot)-Math.abs(b.strike-g.spot))
    return sorted.length ? yPos(strikes.findIndex(s=>s.strike===sorted[0].strike))+BAR_HEIGHT/2 : CHART_H/2
  })()
  const triggerY = toSVGY(g.vol_trigger) > 0 ? toSVGY(g.vol_trigger) : spotY - 20
  const callWallY = toSVGY(g.call_wall) > 0 ? toSVGY(g.call_wall) : 40
  const putWallY  = toSVGY(g.put_wall)  > 0 ? toSVGY(g.put_wall)  : CHART_H - 40

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ticker + summary row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              style={{ padding: "5px 12px", border: `0.5px solid ${ticker === t ? "var(--accent)" : "var(--border)"}`,
                background: ticker === t ? "var(--accent-dim)" : "transparent",
                color: ticker === t ? "var(--accent)" : "var(--muted)", fontSize: "10px",
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                fontFamily: "inherit", borderRadius: "3px", transition: "all 0.15s" }}>
              {t}
            </button>
          ))}
        </div>
        {loading && <span style={{ fontSize: "10px", color: "var(--muted)" }}>loading...</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "gamma env",      value: g.gamma_env,           color: g.positive_gamma ? "var(--bull)" : "var(--bear)" },
          { label: "spot vs trigger",value: g.above_vol_trigger ? "ABOVE" : "BELOW", color: g.above_vol_trigger ? "var(--bull)" : "var(--bear)" },
          { label: "net gex",        value: `${g.net_gex_bn>=0?"+":""}${g.net_gex_bn.toFixed(3)}B`, color: g.positive_gamma ? "var(--bull)" : "var(--bear)" },
          { label: "max pain",       value: g.max_pain.toLocaleString(), color: "#888" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass" style={{ padding: "16px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)", marginBottom: "8px" }}>{label}</p>
            <p style={{ fontSize: "13px", fontWeight: 500, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* butterfly chart */}
      <div className="glass" style={{ padding: "20px", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)" }}>gex profile by strike</p>
          <div style={{ display: "flex", gap: "20px", fontSize: "10px", color: "var(--dim)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", background: "rgba(0,200,150,0.7)", display: "inline-block" }} />calls</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "8px", height: "8px", background: "rgba(255,85,85,0.7)", display: "inline-block" }} />puts</span>
          </div>
        </div>

        {strikes.length === 0 ? (
          <p style={{ color: "var(--dim)", fontSize: "12px" }}>no strike data — market may be closed</p>
        ) : (
          <svg width={TOTAL_W} height={CHART_H} style={{ display: "block", minWidth: TOTAL_W }}>
            {/* axis labels */}
            <text x={Y_LABEL_W + HALF} y={18} textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">0</text>
            <text x={Y_LABEL_W + 8} y={18} textAnchor="start" fill="var(--muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">puts ←</text>
            <text x={Y_LABEL_W + CHART_W - 8} y={18} textAnchor="end" fill="var(--muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">→ calls</text>

            {/* center line */}
            <line x1={Y_LABEL_W+HALF} y1={24} x2={Y_LABEL_W+HALF} y2={CHART_H-8} stroke="var(--border)" strokeWidth="1" />

            {/* bars */}
            {strikes.map((s, i) => {
              const y = yPos(i)
              const callW = toX(s.call_gex)
              const putW  = toX(Math.abs(s.put_gex))
              const isSpot = Math.abs(s.strike - g.spot) < 5
              const net = s.call_gex + s.put_gex
              const isHovered = hovered?.strike === s.strike
              return (
                <g key={s.strike}
                  style={{ cursor: "crosshair" }}
                  onMouseEnter={e => {
                    const rect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect()
                    setHovered({ strike: s.strike, call_gex: s.call_gex, put_gex: s.put_gex, net, x: e.clientX - rect.left, y: y })
                  }}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* hover highlight row */}
                  <rect x={Y_LABEL_W} y={y - 1} width={CHART_W} height={BAR_HEIGHT + 2}
                    fill={isHovered ? "rgba(255,255,255,0.04)" : "transparent"} rx="2" />
                  {/* strike label */}
                  <text x={Y_LABEL_W - 6} y={y + BAR_HEIGHT/2 + 4} textAnchor="end" fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fill={isSpot ? "var(--text)" : isHovered ? "var(--dim)" : "var(--muted)"}>
                    {s.strike.toLocaleString()}
                  </text>
                  {/* put bar (left) */}
                  {putW > 0.5 && (
                    <rect x={Y_LABEL_W + HALF - putW} y={y} width={putW} height={BAR_HEIGHT}
                      fill={isHovered ? "rgba(255,85,85,0.85)" : "rgba(255,85,85,0.55)"} rx="1" />
                  )}
                  {/* call bar (right) */}
                  {callW > 0.5 && (
                    <rect x={Y_LABEL_W + HALF} y={y} width={callW} height={BAR_HEIGHT}
                      fill={isHovered ? "rgba(0,200,150,0.85)" : "rgba(0,200,150,0.55)"} rx="1" />
                  )}
                </g>
              )
            })}

            {/* Tooltip */}
            {hovered && (
              <g>
                <rect
                  x={hovered.x > HALF ? hovered.x - 160 : hovered.x + 12}
                  y={Math.min(hovered.y - 10, CHART_H - 90)}
                  width={148} height={82} rx="4"
                  fill="#0f0f1a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"
                />
                <text fontFamily="JetBrains Mono, monospace" fontSize="9">
                  <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18}
                    y={Math.min(hovered.y - 10, CHART_H - 90) + 16}
                    fill="var(--text)" fontWeight="500">
                    strike {hovered.strike.toLocaleString()}
                  </tspan>
                  <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18}
                    dy="16" fill="rgba(0,200,150,0.9)">
                    call gex  {hovered.call_gex >= 0 ? "+" : ""}{hovered.call_gex.toFixed(3)}B
                  </tspan>
                  <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18}
                    dy="14" fill="rgba(255,85,85,0.9)">
                    put gex   {hovered.put_gex.toFixed(3)}B
                  </tspan>
                  <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18}
                    dy="14" fill={hovered.net >= 0 ? "rgba(0,200,150,0.7)" : "rgba(255,85,85,0.7)"}>
                    net gex   {hovered.net >= 0 ? "+" : ""}{hovered.net.toFixed(3)}B
                  </tspan>
                  <tspan x={hovered.x > HALF ? hovered.x - 148 : hovered.x + 18}
                    dy="14" fill="var(--muted)">
                    {hovered.strike > g.spot ? `+${(hovered.strike - g.spot).toFixed(0)} above spot` : `${(hovered.strike - g.spot).toFixed(0)} below spot`}
                  </tspan>
                </text>
              </g>
            )}

            {/* reference lines */}
            {/* Spot — white */}
            <line x1={Y_LABEL_W} x2={Y_LABEL_W+CHART_W} y1={spotY} y2={spotY} stroke="rgba(232,232,232,0.7)" strokeWidth="0.8" />
            <text x={Y_LABEL_W+CHART_W-4} y={spotY-3} textAnchor="end" fontSize="8" fill="#888" fontFamily="JetBrains Mono, monospace">spot {g.spot.toLocaleString()}</text>

            {/* Vol trigger — gold */}
            <line x1={Y_LABEL_W} x2={Y_LABEL_W+CHART_W} y1={triggerY} y2={triggerY} stroke="rgba(240,192,64,0.65)" strokeWidth="0.8" strokeDasharray="5,3" />
            <text x={Y_LABEL_W+CHART_W-4} y={triggerY-3} textAnchor="end" fontSize="8" fill="#f0.0250" fontFamily="JetBrains Mono, monospace">vol trigger {g.vol_trigger.toLocaleString()}</text>

            {/* Call wall — soft teal */}
            <line x1={Y_LABEL_W} x2={Y_LABEL_W+CHART_W} y1={callWallY} y2={callWallY} stroke="rgba(0,200,150,0.4)" strokeWidth="0.8" strokeDasharray="4,3" />
            <text x={Y_LABEL_W+CHART_W-4} y={callWallY-3} textAnchor="end" fontSize="8" fill="rgba(0,200,150,0.7)" fontFamily="JetBrains Mono, monospace">call wall {g.call_wall.toLocaleString()}</text>

            {/* Put wall — soft coral */}
            <line x1={Y_LABEL_W} x2={Y_LABEL_W+CHART_W} y1={putWallY} y2={putWallY} stroke="rgba(255,130,110,0.4)" strokeWidth="0.8" strokeDasharray="4,3" />
            <text x={Y_LABEL_W+CHART_W-4} y={putWallY-3} textAnchor="end" fontSize="8" fill="rgba(255,130,110,0.7)" fontFamily="JetBrains Mono, monospace">put wall {g.put_wall.toLocaleString()}</text>
          </svg>
        )}
      </div>

      {/* gamma context */}
      <div className="glass" style={{ padding: "16px", borderColor: g.above_vol_trigger ? "rgba(0,200,150,0.15)" : "rgba(255,85,85,0.15)", background: g.above_vol_trigger ? "rgba(0,200,150,0.03)" : "rgba(255,85,85,0.03)" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: g.above_vol_trigger ? "var(--bull)" : "var(--bear)", marginBottom: "6px" }}>
          {g.above_vol_trigger ? "positive gamma environment" : "negative gamma environment"}
        </p>
        <p style={{ fontSize: "12px", color: "var(--dim)", lineHeight: 1.7 }}>
          {g.above_vol_trigger
            ? "Spot is above the vol trigger. Dealers are long gamma — they actively hedge by buying dips and selling rips, which dampens realized volatility. Price tends to revert toward key levels. Avoid chasing extended moves."
            : "Spot is below the vol trigger. Dealers are short gamma — their hedging amplifies directional moves rather than dampening them. Do not fade strong momentum. Size down and let moves develop before positioning."}
        </p>
      </div>
    </div>
  )
}
