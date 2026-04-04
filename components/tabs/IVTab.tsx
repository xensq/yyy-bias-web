"use client"
import { useEffect, useRef, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface SurfacePoint { strike: number; dte: number; iv: number; moneyness: number }

async function fetchSurface(ticker: string): Promise<{ points: SurfacePoint[]; spot: number; atm_iv: number; error?: string }> {
  const res = await fetch(`${API}/iv_surface?ticker=${ticker}`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed")
  return res.json()
}

export default function IVSurfaceTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<{ points: SurfacePoint[]; spot: number; atm_iv: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const load = (t: string) => {
    setLoading(true)
    setError(null)
    setData(null)
    fetchSurface(t)
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch IV surface"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(ticker) }, [ticker])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data?.points.length) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const pts = data.points
    const maxIV = Math.max(...pts.map(p => p.iv))
    const minIV = Math.min(...pts.map(p => p.iv))
    const maxDTE = Math.max(...pts.map(p => p.dte))
    const minMoney = Math.min(...pts.map(p => p.moneyness))
    const maxMoney = Math.max(...pts.map(p => p.moneyness))

    const PAD = 48
    const toX = (m: number) => PAD + ((m - minMoney) / (maxMoney - minMoney || 1)) * (W - PAD * 2)
    const toY = (dte: number) => PAD + ((maxDTE - dte) / (maxDTE || 1)) * (H - PAD * 2)
    const toColor = (iv: number) => {
      const t = (iv - minIV) / (maxIV - minIV || 1)
      if (t < 0.33) {
        const r = Math.round(20 + t * 3 * 20)
        const g = Math.round(80 + t * 3 * 120)
        const b = Math.round(150 - t * 3 * 50)
        return `rgba(${r},${g},${b},0.85)`
      } else if (t < 0.66) {
        const s = (t - 0.33) * 3
        const r = Math.round(40 + s * 180)
        const g = Math.round(200 - s * 60)
        const b = Math.round(100 - s * 80)
        return `rgba(${r},${g},${b},0.85)`
      } else {
        const s = (t - 0.66) * 3
        const r = Math.round(220 + s * 35)
        const g = Math.round(140 - s * 100)
        const b = Math.round(20)
        return `rgba(${r},${g},${b},0.85)`
      }
    }

    // Grid lines
    ctx.strokeStyle = "#111"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (W - PAD * 2)
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke()
      const y = PAD + (i / 5) * (H - PAD * 2)
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    }

    // ATM line
    const atmX = toX(1.0)
    ctx.beginPath(); ctx.moveTo(atmX, PAD); ctx.lineTo(atmX, H - PAD)
    ctx.strokeStyle = "rgba(0,200,150,0.3)"; ctx.lineWidth = 1
    ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([])

    // Draw points as circles sized by IV
    pts.forEach(p => {
      const x = toX(p.moneyness)
      const y = toY(p.dte)
      const r = 3 + (p.iv / maxIV) * 8
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = toColor(p.iv)
      ctx.fill()
    })

    // Axis labels
    ctx.fillStyle = "#333"
    ctx.font = "9px JetBrains Mono, monospace"
    ctx.textAlign = "center"

    // X axis - moneyness
    const mSteps = [0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15]
    mSteps.forEach(m => {
      if (m >= minMoney && m <= maxMoney) {
        ctx.fillText(m.toFixed(2), toX(m), H - PAD + 14)
      }
    })

    // Y axis - DTE
    ctx.textAlign = "right"
    const dteSteps = [1, 2, 3, 5, 7, 14, 21, 30]
    dteSteps.forEach(d => {
      if (d <= maxDTE) {
        ctx.fillText(`${d}d`, PAD - 6, toY(d) + 3)
      }
    })

    // Axis titles
    ctx.fillStyle = "#333"
    ctx.font = "9px JetBrains Mono, monospace"
    ctx.textAlign = "center"
    ctx.fillText("moneyness (K/S)", W / 2, H - 4)
    ctx.save()
    ctx.translate(12, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("DTE", 0, 0)
    ctx.restore()

    // Colorbar
    const cbX = W - 20, cbH = H - PAD * 2
    for (let i = 0; i < cbH; i++) {
      const t = 1 - i / cbH
      const iv = minIV + t * (maxIV - minIV)
      ctx.fillStyle = toColor(iv)
      ctx.fillRect(cbX, PAD + i, 8, 1)
    }
    ctx.fillStyle = "#333"
    ctx.font = "8px JetBrains Mono, monospace"
    ctx.textAlign = "left"
    ctx.fillText(`${(maxIV * 100).toFixed(0)}%`, cbX, PAD - 2)
    ctx.fillText(`${(minIV * 100).toFixed(0)}%`, cbX, H - PAD + 10)

  }, [data])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "#333", textTransform: "uppercase", marginBottom: "6px" }}>iv surface</p>
          <p style={{ fontSize: "12px", color: "#555", fontFamily: "JetBrains Mono, monospace" }}>
            implied volatility by moneyness and expiration
            {data ? ` · spot ${data.spot.toLocaleString()} · atm iv ${(data.atm_iv * 100).toFixed(1)}%` : ""}
          </p>
        </div>
        {/* ticker selector */}
        <div style={{ display: "flex", gap: "6px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              style={{
                padding: "6px 14px", fontSize: "11px", letterSpacing: "0.1em",
                fontFamily: "JetBrains Mono, monospace",
                border: `0.5px solid ${ticker === t ? "var(--accent)" : "#1a1a1a"}`,
                background: ticker === t ? "rgba(0,200,150,0.08)" : "transparent",
                color: ticker === t ? "var(--accent)" : "#444",
                cursor: "pointer", borderRadius: "4px"
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* chart */}
      <div style={{ border: "0.5px solid #1a1a1a", borderRadius: "8px", padding: "16px", background: "#0a0a0a" }} ref={containerRef}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#444", fontSize: "12px", padding: "60px 0", justifyContent: "center", fontFamily: "JetBrains Mono, monospace" }}>
            <div style={{ width: "5px", height: "5px", background: "#00c896", borderRadius: "50%" }} />
            loading {ticker} options chain...
          </div>
        )}
        {error && <p style={{ color: "#ff5555", fontSize: "12px", padding: "40px 0", textAlign: "center", fontFamily: "JetBrains Mono, monospace" }}>{error}</p>}
        {data && !loading && (
          <canvas ref={canvasRef} width={760} height={420}
            style={{ width: "100%", height: "420px", display: "block" }} />
        )}
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: "24px", fontSize: "10px", color: "#333", fontFamily: "JetBrains Mono, monospace" }}>
        <span>· dot size = IV magnitude</span>
        <span>· color: dark teal → amber → red = low → mid → high IV</span>
        <span>· dashed green line = ATM (moneyness 1.0)</span>
      </div>
    </div>
  )
}
