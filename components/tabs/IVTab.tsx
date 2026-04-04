"use client"
import { useEffect, useState } from "react"
import { fetchIV, IVData } from "@/lib/api"

function cellClass(v: number | null): string {
  if (v === null) return "cell-empty"
  if (v >= 0.5) return "cell-strong-bull"
  if (v >= 0.1) return "cell-mild-bull"
  if (v <= -0.5) return "cell-strong-bear"
  if (v <= -0.1) return "cell-mild-bear"
  return "cell-neutral"
}

function fmtExp(exp: string): string {
  const d = new Date(exp + "T00:00:00")
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`
}

function fmtVal(v: number | null): string {
  if (v === null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

export default function IVTab() {
  const [data, setData] = useState<IVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIV()
      .then(setData)
      .catch(() => setError("could not fetch IV data"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#444", fontSize: "12px", marginTop: "32px", fontFamily: "JetBrains Mono, monospace" }}>
      <div style={{ width: "5px", height: "5px", background: "#00c896", borderRadius: "50%" }} />
      pulling options chains — takes ~20 seconds
    </div>
  )

  if (error || data?.error) return (
    <div style={{ color: "#ff5555", fontSize: "12px", marginTop: "16px", fontFamily: "JetBrains Mono, monospace" }}>{error || data?.error}</div>
  )

  if (!data) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "#333", textTransform: "uppercase", marginBottom: "6px" }}>net iv surface</p>
          <p style={{ fontSize: "12px", color: "#555", fontFamily: "JetBrains Mono, monospace" }}>
            spx · spot {data.spot.toLocaleString()} · change from session open
          </p>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "10px" }}>
          {[
            { bg: "rgba(0,200,150,0.25)", color: "#00c896", label: "IV rising" },
            { bg: "rgba(255,85,85,0.25)", color: "#ff5555", label: "IV falling" },
            { bg: "transparent", color: "#444", label: "flat / no data" },
          ].map(({ bg, color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: bg, border: "0.5px solid #1a1a1a", display: "inline-block", borderRadius: "2px" }} />
              <span style={{ color: "#444", fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* table */}
      <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "11px", fontFamily: "JetBrains Mono, monospace", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #1a1a1a" }}>
                <th style={{ textAlign: "left", padding: "10px 16px", color: "#333", fontWeight: 400, position: "sticky", left: 0, background: "#0a0a0a", minWidth: "76px", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  strike
                </th>
                {data.expirations.map(exp => (
                  <th key={exp} style={{ padding: "10px 10px", color: "#333", fontWeight: 400, textAlign: "center", minWidth: "52px", whiteSpace: "nowrap", fontSize: "10px" }}>
                    {fmtExp(exp)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.table.map((row, i) => (
                <tr key={row.strike} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "5px 16px", color: "#555", position: "sticky", left: 0, background: i % 2 === 0 ? "#0a0a0a" : "#0d0d0d", fontWeight: 500, fontSize: "11px" }}>
                    {row.strike.toLocaleString()}
                  </td>
                  {data.expirations.map(exp => {
                    const val = row.values[exp] ?? null
                    return (
                      <td key={exp} className={cellClass(val)} style={{ padding: "5px 10px", textAlign: "center", fontSize: "10px" }}>
                        {fmtVal(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: "10px", color: "#2a2a2a", fontFamily: "JetBrains Mono, monospace" }}>
        baseline set at first load of the day · resets each session · values in IV percentage points
      </p>
    </div>
  )
}
