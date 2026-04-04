"use client"
import { useEffect, useState } from "react"
import { fetchIV, IVData } from "@/lib/api"

function cellClass(v: number | null): string {
  if (v === null) return "cell-empty"
  if (v >= 0.3)  return "cell-strong-bull"
  if (v >= 0.05) return "cell-mild-bull"
  if (v <= -0.3) return "cell-strong-bear"
  if (v <= -0.05) return "cell-mild-bear"
  return "cell-neutral"
}

function fmtExp(exp: string): string {
  const d = new Date(exp + "T00:00:00")
  return `${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getDate().toString().padStart(2,"0")}`
}

function fmtVal(v: number | null): string {
  if (v === null) return "—"
  const sign = v >= 0 ? "+" : ""
  return `${sign}${v.toFixed(1)}%`
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
    <div className="flex items-center gap-3 text-dim text-xs mt-8">
      <div className="w-1.5 h-1.5 bg-bull rounded-full animate-pulse" />
      pulling options chains... this takes ~20 seconds
    </div>
  )

  if (error || data?.error) return (
    <div className="text-bear text-xs mt-4">{error || data?.error}</div>
  )

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dim text-xs uppercase tracking-widest">net iv</p>
          <p className="text-muted text-xs mt-1">
            change in implied volatility from session open · spot {data.spot.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm bg-bull/40" />
            <span className="text-dim">rising IV</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm bg-bear/40" />
            <span className="text-dim">falling IV</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm bg-border" />
            <span className="text-dim">flat</span>
          </span>
        </div>
      </div>

      {/* table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-dim font-normal sticky left-0 bg-surface min-w-20">
                  strike
                </th>
                {data.expirations.map(exp => (
                  <th key={exp} className="px-3 py-2.5 text-dim font-normal text-center min-w-14 whitespace-nowrap">
                    {fmtExp(exp)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.table.map((row, i) => (
                <tr key={row.strike}
                  className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"}`}>
                  <td className="px-4 py-1.5 text-dim sticky left-0 bg-inherit font-medium">
                    {row.strike.toLocaleString()}
                  </td>
                  {data.expirations.map(exp => {
                    const val = row.values[exp] ?? null
                    return (
                      <td key={exp} className={`px-3 py-1.5 text-center ${cellClass(val)}`}>
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

      <p className="text-muted text-xs">
        baseline set at first load of the day · resets each session · values in IV percentage points
      </p>
    </div>
  )
}
