"use client"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface NetIVRow {
  strike: number
  values: Record<string, { iv: number; change: number | null } | null>
}

interface NetIVData {
  dates: string[]
  rows: NetIVRow[]
  spot: number
  status: string
}

function changeColor(c: number | null) {
  if (c === null) return "#333"
  if (c > 0.01) return "#ff5555"
  if (c > 0.003) return "#f97316"
  if (c < -0.01) return "#00c896"
  if (c < -0.003) return "#4ade80"
  return "#444"
}

function fmt(c: number | null) {
  if (c === null) return "—"
  const s = (c * 100).toFixed(1)
  return c >= 0 ? `+${s}%` : `${s}%`
}

function fmtDate(d: string) {
  const [, m, day] = d.split("-")
  return `${m}/${day}`
}

export default function IVSurfaceTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<NetIVData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = (t: string) => {
    setLoading(true); setError(null); setData(null)
    fetch(`${API}/net_iv?ticker=${t}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("could not fetch net iv"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(ticker) }, [ticker])

  const mono = "JetBrains Mono, monospace"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "#333", textTransform: "uppercase", marginBottom: "6px" }}>net iv</p>
          <p style={{ fontSize: "12px", color: "#555", fontFamily: mono }}>
            implied volatility change by strike and date
            {data?.spot ? ` · spot ${data.spot.toLocaleString()}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)} style={{
              padding: "6px 14px", fontSize: "11px", letterSpacing: "0.1em",
              fontFamily: mono,
              border: `0.5px solid ${ticker === t ? "#00c896" : "#1a1a1a"}`,
              background: ticker === t ? "rgba(0,200,150,0.08)" : "transparent",
              color: ticker === t ? "#00c896" : "#444",
              cursor: "pointer", borderRadius: "4px"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "8px", background: "#080808", overflow: "hidden" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#444", fontSize: "12px", padding: "80px 0", justifyContent: "center", fontFamily: mono }}>
            <div style={{ width: "5px", height: "5px", background: "#00c896", borderRadius: "50%" }} />
            loading {ticker} net iv...
          </div>
        )}
        {error && <p style={{ color: "#ff5555", fontSize: "12px", padding: "60px 0", textAlign: "center", fontFamily: mono }}>{error}</p>}

        {data && !loading && data.status === "building_history" && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#555", fontFamily: mono, marginBottom: "8px" }}>building history...</p>
            <p style={{ fontSize: "11px", color: "#333", fontFamily: mono }}>first snapshot taken · check back tomorrow for daily changes</p>
          </div>
        )}

        {data && !loading && data.status === "ok" && data.rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mono, fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1a1a1a" }}>
                  <th style={{ padding: "10px 16px", textAlign: "right", color: "#333", fontWeight: 400, letterSpacing: "0.1em", fontSize: "10px", position: "sticky", left: 0, background: "#080808", borderRight: "0.5px solid #111" }}>
                    STRIKE
                  </th>
                  {data.dates.map(d => (
                    <th key={d} style={{ padding: "10px 12px", textAlign: "center", color: "#333", fontWeight: 400, letterSpacing: "0.05em", fontSize: "10px", minWidth: "64px" }}>
                      {fmtDate(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, ri) => {
                  const isATM = data.spot && Math.abs(row.strike / data.spot - 1) < 0.002
                  return (
                    <tr key={row.strike} style={{
                      borderBottom: "0.5px solid #0d0d0d",
                      background: isATM ? "rgba(0,200,150,0.04)" : ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"
                    }}>
                      <td style={{
                        padding: "7px 16px", textAlign: "right", color: isATM ? "#00c896" : "#555",
                        fontWeight: isATM ? 500 : 400, position: "sticky", left: 0,
                        background: isATM ? "rgba(0,200,150,0.06)" : ri % 2 === 0 ? "#080808" : "#090909",
                        borderRight: "0.5px solid #111"
                      }}>
                        {row.strike.toLocaleString()}
                        {isATM && <span style={{ fontSize: "8px", color: "#00c896", marginLeft: "4px" }}>ATM</span>}
                      </td>
                      {data.dates.map(d => {
                        const v = row.values[d]
                        if (!v) return (
                          <td key={d} style={{ padding: "7px 12px", textAlign: "center", color: "#1a1a1a" }}>—</td>
                        )
                        return (
                          <td key={d} style={{ padding: "7px 12px", textAlign: "center" }}>
                            <div style={{ color: changeColor(v.change), fontWeight: v.change !== null && Math.abs(v.change) > 0.01 ? 500 : 400 }}>
                              {fmt(v.change)}
                            </div>
                            <div style={{ fontSize: "9px", color: "#2a2a2a", marginTop: "1px" }}>
                              {(v.iv * 100).toFixed(1)}%
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "24px", fontSize: "10px", color: "#333", fontFamily: mono }}>
        <span>· value = daily IV change</span>
        <span>· <span style={{ color: "#00c896" }}>green = IV falling</span> · <span style={{ color: "#ff5555" }}>red = IV rising</span></span>
        <span>· small number = raw IV level</span>
      </div>
    </div>
  )
}
