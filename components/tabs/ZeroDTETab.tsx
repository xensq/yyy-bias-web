"use client"
import TerminalLoader from "@/components/TerminalLoader"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface ZeroDTEData {
  spot: number; expiry: string; dte_hours: number; atm_iv: number
  expected_move_1s: number; expected_move_2s: number
  range_1s_low: number; range_1s_high: number
  range_2s_low: number; range_2s_high: number
  pc_ratio: number; pc_sentiment: string
  total_call_oi: number; total_put_oi: number
  gamma_wall_call: number; gamma_wall_put: number; gamma_flip: number
  charm_sum: number; vanna_sum: number
  charm_direction: string; vanna_direction: string
  charm_note: string; vanna_note: string
  error: string | null
}

function sentimentColor(s: string) {
  return s === "bullish" ? "var(--bull)" : s === "bearish" ? "var(--bear)" : "var(--warn)"
}

export default function ZeroDTETab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<ZeroDTEData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`${API}/zero_dte?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch 0DTE data"))
      .finally(() => setLoading(false))
  }, [ticker])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header + ticker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)" }}>0dte flow — session narrative</p>
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
            {data ? `expiry ${data.expiry} · ${data.dte_hours}h remaining · atm iv ${data.atm_iv}%` : "loading..."}
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

      {loading && <TerminalLoader />}

      {error && <p style={{ color: "var(--bear)", fontSize: "12px" }}>{error}</p>}

      {data && !loading && (
        <>
          {/* Expected Move — hero section */}
          <div className="glass" style={{ padding: "28px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "20px" }}>session expected move</p>

            {/* Range bar */}
            <div style={{ position: "relative", margin: "0 0 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em" }}>2σ LOW</p>
                  <p style={{ fontSize: "16px", fontFamily: "JetBrains Mono, monospace", color: "var(--bear)", fontWeight: 500 }}>{data.range_2s_low.toLocaleString()}</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em" }}>SPOT</p>
                  <p style={{ fontSize: "20px", fontFamily: "JetBrains Mono, monospace", color: "var(--text)", fontWeight: 600 }}>{data.spot.toLocaleString()}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em" }}>2σ HIGH</p>
                  <p style={{ fontSize: "16px", fontFamily: "JetBrains Mono, monospace", color: "var(--bull)", fontWeight: 500 }}>{data.range_2s_high.toLocaleString()}</p>
                </div>
              </div>

              {/* Visual range bar */}
              <div style={{ position: "relative", height: "32px", borderRadius: "4px", overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
                {/* 2σ band */}
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,85,85,0.06)", borderRadius: "4px" }} />
                {/* 1σ band */}
                <div style={{ position: "absolute", top: 0, bottom: 0,
                  left: `${((data.range_1s_low - data.range_2s_low) / (data.range_2s_high - data.range_2s_low)) * 100}%`,
                  right: `${((data.range_2s_high - data.range_1s_high) / (data.range_2s_high - data.range_2s_low)) * 100}%`,
                  background: "rgba(0,200,150,0.08)", borderRadius: "2px" }} />
                {/* Spot marker */}
                <div style={{ position: "absolute", top: 0, bottom: 0, width: "2px",
                  left: `${((data.spot - data.range_2s_low) / (data.range_2s_high - data.range_2s_low)) * 100}%`,
                  background: "var(--text)", transform: "translateX(-50%)" }} />
                {/* Key levels */}
                {[
                  { val: data.gamma_flip, color: "var(--warn)", label: "flip" },
                  { val: data.gamma_wall_call, color: "var(--bull)", label: "call wall" },
                  { val: data.gamma_wall_put, color: "var(--bear)", label: "put wall" },
                ].map(({ val, color, label }) => {
                  const pct = ((val - data.range_2s_low) / (data.range_2s_high - data.range_2s_low)) * 100
                  if (pct < 0 || pct > 100) return null
                  return (
                    <div key={label} style={{ position: "absolute", top: 0, bottom: 0, width: "1px",
                      left: `${pct}%`, background: color, opacity: 0.7 }} />
                  )
                })}
              </div>

              {/* Range labels */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontSize: "9px", color: "var(--muted)" }}>{data.range_1s_low.toLocaleString()} <span style={{ color: "var(--dim)" }}>1σ</span></span>
                <div style={{ display: "flex", gap: "16px" }}>
                  <span style={{ fontSize: "9px", color: "var(--warn)" }}>flip {data.gamma_flip.toLocaleString()}</span>
                  <span style={{ fontSize: "9px", color: "var(--bull)" }}>call wall {data.gamma_wall_call.toLocaleString()}</span>
                  <span style={{ fontSize: "9px", color: "var(--bear)" }}>put wall {data.gamma_wall_put.toLocaleString()}</span>
                </div>
                <span style={{ fontSize: "9px", color: "var(--muted)" }}><span style={{ color: "var(--dim)" }}>1σ</span> {data.range_1s_high.toLocaleString()}</span>
              </div>
            </div>

            {/* Move stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {[
                { label: "±1σ move", value: `±${data.expected_move_1s.toLocaleString()}`, sub: "68% probability" },
                { label: "±2σ move", value: `±${data.expected_move_2s.toLocaleString()}`, sub: "95% probability" },
                { label: "atm iv", value: `${data.atm_iv}%`, sub: "0DTE implied vol" },
              ].map(({ label, value, sub }) => (
                <div key={label}>
                  <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</p>
                  <p style={{ fontSize: "18px", fontFamily: "JetBrains Mono, monospace", color: "var(--text)", fontWeight: 500 }}>{value}</p>
                  <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 0DTE Sentiment + PC Ratio */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="glass" style={{ padding: "20px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "16px" }}>0dte sentiment</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sentimentColor(data.pc_sentiment) }} />
                <span style={{ fontSize: "20px", fontFamily: "JetBrains Mono, monospace", color: sentimentColor(data.pc_sentiment), fontWeight: 600, textTransform: "uppercase" }}>
                  {data.pc_sentiment}
                </span>
              </div>
              <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
                <div>
                  <p style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "3px" }}>put/call ratio</p>
                  <p style={{ fontSize: "14px", fontFamily: "JetBrains Mono, monospace", color: data.pc_ratio > 1.2 ? "var(--bear)" : data.pc_ratio < 0.8 ? "var(--bull)" : "var(--warn)" }}>{data.pc_ratio}</p>
                </div>
                <div>
                  <p style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "3px" }}>call oi</p>
                  <p style={{ fontSize: "14px", fontFamily: "JetBrains Mono, monospace", color: "var(--bull)" }}>{data.total_call_oi.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "3px" }}>put oi</p>
                  <p style={{ fontSize: "14px", fontFamily: "JetBrains Mono, monospace", color: "var(--bear)" }}>{data.total_put_oi.toLocaleString()}</p>
                </div>
              </div>
              <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.7 }}>
                {data.pc_ratio > 1.2 ? "heavy put buying — crowd is hedging or bearish positioning. contrarian signal or genuine fear." :
                 data.pc_ratio < 0.8 ? "call-heavy flow — retail chasing upside. watch for gamma pinning near call wall." :
                 "balanced flow — no clear directional lean from 0DTE positioning."}
              </p>
            </div>

            <div className="glass" style={{ padding: "20px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "16px" }}>charm / vanna flow</p>
              <p style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "6px", lineHeight: 1.6 }}>
                as 0DTE options decay and vol moves, dealers must rehedge. charm and vanna tell you which direction that mechanical flow goes.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {[
                  { label: "charm", value: data.charm_direction, note: data.charm_note, val: data.charm_sum },
                  { label: "vanna", value: data.vanna_direction, note: data.vanna_note, val: data.vanna_sum },
                ].map(({ label, value, note, val }) => (
                  <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", border: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{label}</span>
                      <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: sentimentColor(value), fontWeight: 500, textTransform: "uppercase" }}>{value}</span>
                    </div>
                    <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.6 }}>{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key levels summary */}
          <div className="glass" style={{ padding: "20px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "16px" }}>key 0dte levels</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "intraday gamma flip", value: data.gamma_flip, color: "var(--warn)", desc: "spot above = dealers pin, below = dealers amplify. this resets every session." },
                { label: "call gamma wall", value: data.gamma_wall_call, color: "var(--bull)", desc: "highest 0DTE call gamma concentration — strong resistance, price tends to stall here." },
                { label: "put gamma wall", value: data.gamma_wall_put, color: "var(--bear)", desc: "highest 0DTE put gamma concentration — strong support, dealers buy aggressively here." },
              ].map(({ label, value, color, desc }, i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, marginRight: "24px" }}>
                    <p style={{ fontSize: "10px", color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.6 }}>{desc}</p>
                  </div>
                  <p style={{ fontSize: "18px", fontFamily: "JetBrains Mono, monospace", color, fontWeight: 500, whiteSpace: "nowrap" }}>{value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
