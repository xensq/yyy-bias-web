"use client"
import TerminalLoader from "@/components/TerminalLoader"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface Row { strike: number; values: Record<string, { iv: number; change: number | null } | null> }
interface NetIVData { dates: string[]; rows: Row[]; spot: number; status: string }

function fmt(d: string) { return d.slice(5) }
function changeColor(c: number | null) {
  if (c === null || c === undefined) return "var(--muted)"
  if (c > 0.005) return "#ff5555"
  if (c < -0.005) return "#00c896"
  return "var(--dim)"
}
function ivColor(iv: number) {
  if (iv > 0.30) return "#ff5555"
  if (iv > 0.20) return "#f0c040"
  return "#888"
}

export default function NetIVTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<NetIVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`${API}/net_iv?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch net iv data"))
      .finally(() => setLoading(false))
  }, [ticker])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)" }}>net iv — implied volatility surface history</p>
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>daily iv change by strike · green = iv falling · red = iv rising</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              style={{ padding: "5px 12px", border: `0.5px solid ${ticker === t ? "var(--accent)" : "var(--border)"}`,
                background: ticker === t ? "rgba(200,160,80,0.08)" : "transparent",
                color: ticker === t ? "var(--accent)" : "var(--dim)", fontSize: "10px",
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", borderRadius: "3px" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && <TerminalLoader />}

      {error && <p style={{ fontSize: "12px", color: "#ff5555", padding: "16px 0" }}>{error}</p>}

      {data?.status === "building_history" && (
        <div className="glass" style={{ padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--dim)", marginBottom: "8px" }}>building iv history</p>
          <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.7 }}>
            first snapshot captured. check back tomorrow — net iv needs 2+ days of data to show changes.<br />
            each day a new snapshot is stored and compared to the prior session.
          </p>
        </div>
      )}

      {data?.status === "ok" && data.rows.length > 0 && (
        <>
          {/* spot */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>spot</span>
            <span style={{ fontSize: "14px", fontFamily: "JetBrains Mono, monospace", color: "#888" }}>{data.spot.toLocaleString()}</span>
            <span style={{ fontSize: "10px", color: "var(--muted)" }}>· showing atm ±5% strikes</span>
          </div>

          {/* table */}
          <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "JetBrains Mono, monospace", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #1a1a1a" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--muted)", fontWeight: 400, fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase" }}>strike</th>
                    {data.dates.map(d => (
                      <th key={d} style={{ padding: "10px 14px", textAlign: "center", color: "var(--muted)", fontWeight: 400, fontSize: "9px", letterSpacing: "0.15em" }}>{fmt(d)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, ri) => {
                    const isAtm = Math.abs(row.strike / data.spot - 1.0) < 0.005
                    return (
                      <tr key={row.strike} style={{
                        borderBottom: "0.5px solid #111",
                        background: isAtm ? "rgba(200,160,80,0.04)" : "transparent"
                      }}>
                        <td style={{ padding: "9px 16px", color: isAtm ? "var(--accent)" : "var(--dim)", whiteSpace: "nowrap" }}>
                          {row.strike.toLocaleString()}
                          {isAtm && <span style={{ fontSize: "8px", color: "var(--accent)", marginLeft: "6px", letterSpacing: "0.1em" }}>ATM</span>}
                        </td>
                        {data.dates.map(d => {
                          const cell = row.values[d]
                          if (!cell) return <td key={d} style={{ padding: "9px 14px", textAlign: "center", color: "var(--muted)" }}>—</td>
                          return (
                            <td key={d} style={{ padding: "9px 14px", textAlign: "center" }}>
                              <div style={{ color: ivColor(cell.iv), fontSize: "11px" }}>{(cell.iv * 100).toFixed(1)}%</div>
                              {cell.change !== null && (
                                <div style={{ color: changeColor(cell.change), fontSize: "9px", marginTop: "2px" }}>
                                  {cell.change >= 0 ? "+" : ""}{(cell.change * 100).toFixed(2)}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* legend */}
          <div style={{ display: "flex", gap: "20px", padding: "0 2px" }}>
            {[["IV > 30%", "#ff5555"], ["IV 20–30%", "#f0c040"], ["IV < 20%", "#888"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c as string }} />
                <span style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em" }}>{l}</span>
              </div>
            ))}
            <div style={{ width: "1px", background: "var(--border)" }} />
            {[["rising iv", "#ff5555"], ["falling iv", "#00c896"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c as string }} />
                <span style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em" }}>{l} (Δ)</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
