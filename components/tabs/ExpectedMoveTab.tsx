"use client"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface Move { iv: number; move_pts: number; move_pct: number; upper: number; lower: number }
interface EMData {
  ticker: string; spot: number; atm_iv: number
  moves: { "1d": Move | null; "1w": Move | null; "1m": Move | null }
  error?: string
}

export default function ExpectedMoveTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<EMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = (t: string) => {
    setLoading(true); setError(null); setData(null)
    fetch(`${API}/expected_move?ticker=${t}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch expected move"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(ticker) }, [ticker])

  const Row = ({ label, move }: { label: string; move: Move | null }) => {
    if (!move) return null
    return (
      <div style={{ display: "grid", gridTemplateColumns: "80px 90px 90px 100px 1fr 100px 100px", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)", gap: "8px" }}>
        <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "9px", color: "var(--muted)" }}>{move.iv}% IV</span>
        <span style={{ fontSize: "11px", color: "var(--text)", fontFamily: "JetBrains Mono" }}>±{move.move_pct}%</span>
        <span style={{ fontSize: "11px", color: "var(--text)", fontFamily: "JetBrains Mono" }}>±{move.move_pts.toLocaleString()}</span>
        <div style={{ position: "relative", height: "4px", background: "var(--border)", borderRadius: "2px" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: `${Math.min(move.move_pct * 8, 50)}%`, background: "var(--accent)", opacity: 0.4, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: "-3px", width: "2px", height: "10px", background: "var(--accent)", transform: "translateX(-50%)" }} />
        </div>
        <span style={{ fontSize: "11px", color: "var(--bull)", fontFamily: "JetBrains Mono", textAlign: "right" }}>{move.upper.toLocaleString()}</span>
        <span style={{ fontSize: "11px", color: "var(--bear)", fontFamily: "JetBrains Mono", textAlign: "right" }}>{move.lower.toLocaleString()}</span>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginBottom: "4px" }}>
        <div>
          <p style={{ fontSize: "11px", color: "var(--text)", fontWeight: 600, letterSpacing: "0.1em" }}>EXPECTED MOVE</p>
          <p style={{ fontSize: "8px", color: "var(--muted)", marginTop: "3px" }}>1-sigma brackets from IV surface · 1 day · 1 week · 1 month</p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)} style={{
              padding: "6px 14px", background: ticker === t ? "var(--accent-dim)" : "transparent",
              border: `1px solid ${ticker === t ? "var(--accent)" : "var(--border)"}`,
              color: ticker === t ? "var(--accent)" : "var(--muted)",
              fontSize: "9px", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit"
            }}>{t}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "11px", padding: "32px 0" }}>
          <div style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
          calculating expected moves...
        </div>
      )}

      {error && <div style={{ padding: "16px", border: "1px solid rgba(220,38,38,0.3)", color: "var(--bear)", fontSize: "11px" }}>{error}</div>}

      {data && !loading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px" }}>
            {[
              { label: "spot", value: data.spot.toLocaleString() },
              { label: "atm iv", value: `${data.atm_iv}%` },
              { label: "ticker", value: data.ticker },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "16px 24px", border: "1px solid var(--border)", background: "rgba(0,0,0,0)" }}>
                <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                <p style={{ fontSize: "20px", fontFamily: "JetBrains Mono", color: "var(--text)", fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 90px 90px 100px 1fr 100px 100px", padding: "8px 24px", borderBottom: "1px solid var(--border)", background: "rgba(30,30,46,0.5)", gap: "8px" }}>
              {["period","iv","±%","±pts","range","upper","lower"].map(h => (
                <span key={h} style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            <Row label="1 DAY" move={data.moves["1d"]} />
            <Row label="1 WEEK" move={data.moves["1w"]} />
            <Row label="1 MONTH" move={data.moves["1m"]} />
          </div>

          <div style={{ border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(0,0,0,0)" }}>
            <div style={{ padding: "16px 24px", borderRight: "1px solid var(--border)" }}>
              <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>how to use this</p>
              {[
                "1-day bracket = your range for tomorrow. don't set targets outside it without strong confluence.",
                "if GEX walls align with bracket edges = high confidence levels. trade them with conviction.",
                "if GEX walls diverge from bracket = one is about to catch up. watch and wait.",
                "high ATM IV = bracket is wide, options expensive, take profits earlier than usual.",
              ].map((t, i) => (
                <p key={i} style={{ fontSize: "8px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "6px" }}>· {t}</p>
              ))}
            </div>
            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>iv regime</p>
              {[
                { range: "below 20%", label: "compressed", desc: "pinning likely. fade breakouts.", color: "var(--bull)" },
                { range: "20–35%", label: "normal", desc: "standard moves. use brackets as-is.", color: "var(--muted)" },
                { range: "35–50%", label: "elevated", desc: "real moves. take profits early.", color: "var(--warn)" },
                { range: "above 50%", label: "crisis", desc: "don't hold overnight. size way down.", color: "var(--bear)" },
              ].map(({ range, label, desc, color }) => (
                <div key={range} style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "8px", color, fontFamily: "JetBrains Mono", width: "70px", flexShrink: 0, fontWeight: 600 }}>{range}</span>
                  <span style={{ fontSize: "8px", color: "var(--muted)" }}><span style={{ color }}>{label}</span> · {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
