"use client"
import TerminalLoader from "@/components/TerminalLoader"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface Move { iv: number; move_pts: number; move_pct: number; upper: number; lower: number }
interface Radar { iv_level: number; vix_level: number; move_size: number; confidence: number; expansion_dw: number; expansion_wm: number }
interface EMData {
  ticker: string; spot: number; atm_iv: number; iv_percentile?: number
  vix?: number; vix_move_pts?: number; vix_upper?: number; vix_lower?: number
  moves: { "1d": Move | null; "1w": Move | null; "1m": Move | null }
  radar?: Radar; error?: string
}

const RADAR_AXES = [
  { key: "iv_level", label: "IV Level" },
  { key: "vix_level", label: "VIX Level" },
  { key: "move_size", label: "Move Size" },
  { key: "confidence", label: "Confidence" },
  { key: "expansion_dw", label: "1D→1W" },
  { key: "expansion_wm", label: "1W→1M" },
]

function SpiderChart({ radar }: { radar: Radar }) {
  const N = 6, cx = 160, cy = 160, r = 120
  const angleOf = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2
  const point = (i: number, v: number) => ({ x: cx + r * v * Math.cos(angleOf(i)), y: cy + r * v * Math.sin(angleOf(i)) })
  const vals = RADAR_AXES.map(a => (radar as any)[a.key] as number)
  const dataPath = vals.map((v, i) => { const p = point(i, v); return `${i === 0 ? "M" : "L"}${p.x},${p.y}` }).join(" ") + "Z"
  return (
    <svg viewBox="0 0 320 320" style={{ width: "100%", maxWidth: "300px" }} xmlns="http://www.w3.org/2000/svg">
      {[0.25, 0.5, 0.75, 1.0].map(level => (
        <polygon key={level} points={Array.from({ length: N }, (_, i) => { const p = point(i, level); return `${p.x},${p.y}` }).join(" ")} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: N }, (_, i) => { const p = point(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" /> })}
      <path d={dataPath} fill="rgba(220,38,38,0.15)" stroke="rgba(220,38,38,0.8)" strokeWidth="1.5" strokeLinejoin="round" />
      {vals.map((v, i) => <circle key={i} cx={point(i, v).x} cy={point(i, v).y} r="3" fill="#dc2626" />)}
      {RADAR_AXES.map((a, i) => {
        const p = point(i, 1.22)
        const anchor = p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle"
        return (
          <g key={i}>
            <text x={p.x} y={p.y} textAnchor={anchor} fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="JetBrains Mono">{a.label}</text>
            <text x={point(i, 1.4).x} y={point(i, 1.4).y} textAnchor={anchor} fill="rgba(220,38,38,0.7)" fontSize="8" fontFamily="JetBrains Mono">{Math.round(vals[i] * 100)}%</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="3" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}

export default function ExpectedMoveTab() {
  const [ticker, setTicker] = useState("SPX")
  const [data, setData] = useState<EMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = (t: string) => {
    setLoading(true); setError(null); setData(null)
    fetch(`${API}/expected_move?ticker=${t}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError("could not fetch expected move"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(ticker) }, [ticker])

  const copyCard = () => {
    if (!data || !data.moves["1d"]) return
    const d = data.moves["1d"]!
    const vixLine = data.vix_move_pts ? `VIX:    +/-${data.vix_move_pts}pts  upper ${data.vix_upper?.toLocaleString()}  lower ${data.vix_lower?.toLocaleString()}` : ""
    const agree = data.vix_move_pts ? (Math.abs(d.move_pts - data.vix_move_pts) / d.move_pts < 0.05 ? "methods agree - high confidence" : "methods diverge - use caution") : ""
    const text = [`YYY DAILY RANGE -- ${data.ticker}`, "-------------------------", `upper:  ${d.upper.toLocaleString()}  |  lower:  ${d.lower.toLocaleString()}`, `move:   +/-${d.move_pts}pts    +/-${d.move_pct}%`, vixLine, agree, `IV:     ${data.atm_iv}%${data.vix ? `   VIX: ${data.vix}` : ""}`, "-------------------------", "yyy-bias-web.vercel.app"].filter(Boolean).join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const Row = ({ label, move }: { label: string; move: Move | null }) => {
    if (!move) return null
    return (
      <div style={{ display: "grid", gridTemplateColumns: "80px 90px 100px 110px 110px", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)", gap: "16px" }}>
        <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "9px", color: "var(--muted)" }}>{move.iv}% IV</span>
        <span style={{ fontSize: "11px", color: "var(--text)", fontFamily: "JetBrains Mono" }}>+/-{move.move_pct}%</span>
        <span style={{ fontSize: "12px", color: "var(--bull)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{move.upper.toLocaleString()}</span>
        <span style={{ fontSize: "12px", color: "var(--bear)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{move.lower.toLocaleString()}</span>
      </div>
    )
  }

  const d1 = data?.moves["1d"]
  const vixAgree = d1 && data?.vix_move_pts ? Math.abs(d1.move_pts - data.vix_move_pts) / d1.move_pts < 0.05 : null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginBottom: "4px" }}>
        <div>
          <p style={{ fontSize: "11px", color: "var(--text)", fontWeight: 600, letterSpacing: "0.1em" }}>EXPECTED MOVE</p>
          <p style={{ fontSize: "8px", color: "var(--muted)", marginTop: "3px" }}>ATM IV + VIX dual-method · 1 day · 1 week · 1 month</p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)} style={{ padding: "6px 14px", background: ticker === t ? "var(--accent-dim)" : "transparent", border: `1px solid ${ticker === t ? "var(--accent)" : "var(--border)"}`, color: ticker === t ? "var(--accent)" : "var(--muted)", fontSize: "9px", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
          ))}
        </div>
      </div>

      {loading && <TerminalLoader />}
      {error && <div style={{ padding: "16px", border: "1px solid rgba(220,38,38,0.3)", color: "var(--bear)", fontSize: "11px" }}>{error}</div>}

      {data && !loading && (
        <>
          {d1 && (
            <div style={{ border: "1px solid var(--border)", padding: "32px", background: "rgba(0,0,0,0)", marginBottom: "1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "12px" }}>today's range — {data.ticker}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
                    <span style={{ fontSize: "clamp(28px,4vw,48px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--bull)" }}>{d1.upper.toLocaleString()}</span>
                    <span style={{ fontSize: "20px", color: "var(--muted)", fontFamily: "JetBrains Mono" }}>—</span>
                    <span style={{ fontSize: "clamp(28px,4vw,48px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--bear)" }}>{d1.lower.toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px", fontFamily: "JetBrains Mono" }}>+/-{d1.move_pts} pts · +/-{d1.move_pct}% · 68% probability</p>
                </div>
                <button onClick={copyCard} style={{ padding: "10px 20px", background: copied ? "var(--accent-dim)" : "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                  {copied ? "copied ✓" : "copy range card"}
                </button>
              </div>
            </div>
          )}

          {data.radar && d1 && (
            <div style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0)", marginBottom: "1px", display: "grid", gridTemplateColumns: "300px 1fr" }}>
              <div style={{ padding: "24px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SpiderChart radar={data.radar} />
              </div>
              <div style={{ padding: "24px" }}>
                <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>volatility profile</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {RADAR_AXES.map(({ key, label }) => {
                    const val = (data.radar as any)[key] as number
                    const pct = Math.round(val * 100)
                    const color = val > 0.75 ? "var(--bear)" : val > 0.5 ? "var(--warn)" : val > 0.25 ? "var(--accent)" : "var(--bull)"
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em" }}>{label}</span>
                          <span style={{ fontSize: "9px", color, fontFamily: "JetBrains Mono", fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: "2px", background: "var(--border)" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {data.iv_percentile != null && (
                  <div style={{ marginTop: "20px", padding: "10px 14px", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px", letterSpacing: "0.1em" }}>IV PERCENTILE (1Y)</p>
                    <p style={{ fontSize: "16px", color: "var(--accent)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{data.iv_percentile}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {d1 && (
            <div style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0)", marginBottom: "1px" }}>
              <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>dual-method comparison</p>
                {vixAgree !== null && <span style={{ fontSize: "8px", color: vixAgree ? "var(--bull)" : "var(--warn)", letterSpacing: "0.1em" }}>{vixAgree ? "✓ methods agree — high confidence" : "⚠ methods diverge — use caution"}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px" }}>
                <div style={{ padding: "20px 24px", borderRight: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>ATM IV method</p>
                  <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", marginBottom: "12px" }}>
                    <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>upper</p><p style={{ fontSize: "18px", color: "var(--bull)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{d1.upper.toLocaleString()}</p></div>
                    <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>lower</p><p style={{ fontSize: "18px", color: "var(--bear)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{d1.lower.toLocaleString()}</p></div>
                    <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>move</p><p style={{ fontSize: "18px", color: "var(--text)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>+/-{d1.move_pts}</p></div>
                  </div>
                  <p style={{ fontSize: "8px", color: "var(--muted)" }}>ATM IV: <span style={{ color: "var(--accent)" }}>{data.atm_iv}%</span> · spot x IV x sqrt(1/252)</p>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>VIX method</p>
                  {data.vix_move_pts ? (
                    <>
                      <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", marginBottom: "12px" }}>
                        <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>upper</p><p style={{ fontSize: "18px", color: "var(--bull)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{data.vix_upper?.toLocaleString()}</p></div>
                        <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>lower</p><p style={{ fontSize: "18px", color: "var(--bear)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{data.vix_lower?.toLocaleString()}</p></div>
                        <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>move</p><p style={{ fontSize: "18px", color: "var(--text)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>+/-{data.vix_move_pts}</p></div>
                      </div>
                      <p style={{ fontSize: "8px", color: "var(--muted)" }}>VIX: <span style={{ color: "var(--accent)" }}>{data.vix}</span> · spot x (VIX/100) x sqrt(1/252)</p>
                    </>
                  ) : <p style={{ fontSize: "9px", color: "var(--muted)" }}>VIX unavailable</p>}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", marginBottom: "1px" }}>
            {[{ label: "spot", value: data.spot?.toLocaleString() ?? "—" }, { label: "atm iv", value: data.atm_iv != null ? `${data.atm_iv}%` : "—" }, { label: "vix", value: data.vix != null ? `${data.vix}` : "—" }, { label: "ticker", value: data.ticker }].map(({ label, value }) => (
              <div key={label} style={{ padding: "14px 20px", border: "1px solid var(--border)", background: "rgba(0,0,0,0)" }}>
                <p style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                <p style={{ fontSize: "16px", fontFamily: "JetBrains Mono", color: "var(--text)", fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(0,0,0,0)" }}>
            <div style={{ padding: "16px 24px", borderRight: "1px solid var(--border)" }}>
              <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>how to use this</p>
              {["1-day bracket = your range for the session. don't set targets outside it without strong confluence.", "when ATM IV and VIX agree = high confidence. trade the bracket with conviction.", "when they diverge = something is mispriced. size down, wait for clarity.", "high ATM IV = bracket is wide, options expensive. take profits earlier than usual."].map((t, i) => (
                <p key={i} style={{ fontSize: "8px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "6px" }}>· {t}</p>
              ))}
            </div>
            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>iv regime</p>
              {[{ range: "below 20%", label: "compressed", desc: "pinning likely. fade breakouts.", color: "var(--bull)" }, { range: "20-35%", label: "normal", desc: "standard moves. use brackets as-is.", color: "var(--muted)" }, { range: "35-50%", label: "elevated", desc: "real moves. take profits early.", color: "var(--warn)" }, { range: "above 50%", label: "crisis", desc: "don't hold overnight. size way down.", color: "var(--bear)" }].map(({ range, label, desc, color }) => (
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
