"use client"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface StrikeDetail { strike: number; net_delta: number; above_spot: boolean }
interface DealerDeltaData {
  spot: number; net_dealer_delta: number; dealer_lean: string
  delta_flip: number; above_delta_flip: boolean
  hedge_up_1pct: number; hedge_up_2pct: number
  hedge_dn_1pct: number; hedge_dn_2pct: number
  strike_data: StrikeDetail[]; error: string | null
}

export default function DealerDeltaTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<DealerDeltaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`${API}/dealer_delta?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch dealer delta"))
      .finally(() => setLoading(false))
  }, [ticker])

  const leanColor = data?.dealer_lean === "long" ? "var(--bull)" : "var(--bear)"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)" }}>dealer positioning — delta exposure</p>
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>which direction dealers must hedge if price moves</p>
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
          calculating dealer exposure...
        </div>
      )}

      {error && <p style={{ color: "var(--bear)", fontSize: "12px" }}>{error}</p>}

      {data && !loading && (
        <>
          {/* Hero — dealer lean + delta flip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="glass" style={{ padding: "24px", borderColor: `${leanColor}22` }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "12px" }}>dealer net lean</p>
              <p style={{ fontSize: "36px", fontFamily: "JetBrains Mono, monospace", color: leanColor, fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                {data.dealer_lean}
              </p>
              <p style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: "var(--dim)", marginBottom: "12px" }}>
                {data.net_dealer_delta >= 0 ? "+" : ""}{data.net_dealer_delta.toLocaleString()} delta
              </p>
              <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.7 }}>
                {data.dealer_lean === "long"
                  ? "dealers are net long delta — on a rally they sell to rebalance (headwind). on a drop they buy to rebalance (support). acts as a stabilizing force."
                  : "dealers are net short delta — on a rally they buy to rebalance (accelerant). on a drop they sell (accelerant). amplifies directional moves."}
              </p>
            </div>

            <div className="glass" style={{ padding: "24px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "12px" }}>delta flip level</p>
              <p style={{ fontSize: "36px", fontFamily: "JetBrains Mono, monospace", color: "var(--warn)", fontWeight: 600, marginBottom: "8px" }}>
                {data.delta_flip.toLocaleString()}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: data.above_delta_flip ? "var(--bull)" : "var(--bear)" }} />
                <span style={{ fontSize: "11px", color: data.above_delta_flip ? "var(--bull)" : "var(--bear)" }}>
                  spot {data.above_delta_flip ? "above" : "below"} flip ({data.spot.toLocaleString()})
                </span>
              </div>
              <p style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.7 }}>
                {data.above_delta_flip
                  ? "above the delta flip — dealers are net long. stabilizing environment. moves tend to revert."
                  : "below the delta flip — dealers are net short. destabilizing environment. moves tend to extend."}
              </p>
            </div>
          </div>

          {/* Hedge pressure table */}
          <div className="glass" style={{ padding: "20px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "6px" }}>dealer hedge pressure</p>
            <p style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              how many delta contracts dealers must buy or sell to stay neutral if price moves. positive = dealers buying (supportive), negative = dealers selling (headwind).
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "up +1%", value: data.hedge_up_1pct, price: (data.spot * 1.01).toFixed(0) },
                { label: "up +2%", value: data.hedge_up_2pct, price: (data.spot * 1.02).toFixed(0) },
                { label: "dn -1%", value: data.hedge_dn_1pct, price: (data.spot * 0.99).toFixed(0) },
                { label: "dn -2%", value: data.hedge_dn_2pct, price: (data.spot * 0.98).toFixed(0) },
              ].map(({ label, value, price }) => {
                const color = value > 0 ? "var(--bull)" : value < 0 ? "var(--bear)" : "var(--warn)"
                return (
                  <div key={label} style={{ padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "0.5px solid var(--border)" }}>
                    <p style={{ fontSize: "9px", color: "var(--dim)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                    <p style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "8px" }}>≈ {Number(price).toLocaleString()}</p>
                    <p style={{ fontSize: "16px", fontFamily: "JetBrains Mono, monospace", color, fontWeight: 500 }}>
                      {value >= 0 ? "+" : ""}{value.toLocaleString()}
                    </p>
                    <p style={{ fontSize: "9px", color: "var(--muted)", marginTop: "4px" }}>
                      {value > 0 ? "dealers buying" : value < 0 ? "dealers selling" : "neutral"}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-strike delta chart */}
          {data.strike_data.length > 0 && (
            <div className="glass" style={{ padding: "20px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "16px" }}>net dealer delta by strike</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[...data.strike_data].sort((a, b) => b.strike - a.strike).map(row => {
                  const max = Math.max(...data.strike_data.map(r => Math.abs(r.net_delta))) || 1
                  const pct = Math.abs(row.net_delta) / max * 100
                  const color = row.net_delta > 0 ? "rgba(0,200,150,0.6)" : "rgba(255,85,85,0.6)"
                  const isNear = Math.abs(row.strike - data.spot) < 5
                  return (
                    <div key={row.strike} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "9px", fontFamily: "JetBrains Mono, monospace", color: isNear ? "var(--text)" : "var(--muted)", width: "52px", textAlign: "right" }}>
                        {row.strike.toLocaleString()}
                      </span>
                      <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                        <div style={{ position: "absolute", top: 0, bottom: 0, width: "1px", left: "50%", background: "var(--border)" }} />
                        <div style={{
                          position: "absolute", top: 0, bottom: 0, borderRadius: "2px", background: color,
                          width: `${pct / 2}%`,
                          left: row.net_delta >= 0 ? "50%" : `${50 - pct / 2}%`
                        }} />
                      </div>
                      <span style={{ fontSize: "9px", fontFamily: "JetBrains Mono, monospace", color: row.net_delta > 0 ? "var(--bull)" : "var(--bear)", width: "64px" }}>
                        {row.net_delta >= 0 ? "+" : ""}{row.net_delta.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* How to use */}
          <div className="glass" style={{ padding: "18px", borderColor: "rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--dim)", textTransform: "uppercase", marginBottom: "10px" }}>how to use dealer positioning</p>
            <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.8 }}>
              dealer delta tells you the mechanical flow that MUST happen as price moves — regardless of sentiment or news.
              when dealers are long delta above the flip, they act as a shock absorber — buying dips, selling rips.
              when short delta below the flip, they pour fuel on the fire — selling dips, buying rips.
              combine with GEX: positive GEX + long dealer delta = maximum stabilization. negative GEX + short dealer delta = maximum volatility amplification.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
