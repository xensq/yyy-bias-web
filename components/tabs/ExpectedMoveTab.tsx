"use client"
import TerminalLoader from "@/components/TerminalLoader"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TICKERS = ["SPX", "NDX", "SPY", "QQQ"]

interface Move { iv: number; move_pts: number; move_pct: number; upper: number; lower: number }
interface EMData {
  ticker: string; spot: number; atm_iv: number
  vix?: number; vix_move_pts?: number; vix_upper?: number; vix_lower?: number
  moves: { "1d": Move | null; "1w": Move | null; "1m": Move | null }
  error?: string
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
    const vixLine = data.vix_move_pts ? `VIX method:  ±${data.vix_move_pts}pts  upper ${data.vix_upper?.toLocaleString()}  lower ${data.vix_lower?.toLocaleString()}` : ""
    const agree = data.vix_move_pts ? (Math.abs(d.move_pts - data.vix_move_pts) / d.move_pts < 0.05 ? "✓ methods agree — high confidence" : "⚠ methods diverge — use caution") : ""
    const text = [`YYY DAILY RANGE — ${data.ticker}`, "━━━━━━━━━━━━━━━━━━━━━━━━━", `upper:  ${d.upper.toLocaleString()}  |  lower:  ${d.lower.toLocaleString()}`, `move:   ±${d.move_pts}pts    ±${d.move_pct}%`, vixLine, agree, `IV:     ${data.atm_iv}%${data.vix ? `   VIX: ${data.vix}` : ""}`, "━━━━━━━━━━━━━━━━━━━━━━━━━", "yyy-bias-web.vercel.app"].filter(Boolean).join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const Row = ({ label, move }: { label: string; move: Move | null }) => {
    if (!move) return null
    return (
      <div style={{ display: "grid", gridTemplateColumns: "80px 90px 90px 100px 1fr 110px 110px", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)", gap: "8px" }}>
        <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "9px", color: "var(--muted)" }}>{move.iv}% IV</span>
        <span style={{ fontSize: "11px", color: "var(--text)", fontFamily: "JetBrains Mono" }}>±{move.move_pct}%</span>
        <span style={{ fontSize: "11px", color: "var(--text)", fontFamily: "JetBrains Mono" }}>±{move.move_pts.toLocaleString()}</span>
        <div style={{ position: "relative", height: "4px", background: "var(--border)" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: `${Math.min(move.move_pct * 8, 50)}%`, background: "var(--accent)", opacity: 0.4, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: "-3px", width: "2px", height: "10px", background: "var(--accent)", transform: "translateX(-50%)" }} />
        </div>
        <span style={{ fontSize: "12px", color: "var(--bull)", fontFamily: "JetBrains Mono", textAlign: "right", fontWeight: 600 }}>{move.upper.toLocaleString()}</span>
        <span style={{ fontSize: "12px", color: "var(--bear)", fontFamily: "JetBrains Mono", textAlign: "right", fontWeight: 600 }}>{move.lower.toLocaleString()}</span>
      </div>
    )
  }

  const Cone = ({ d1, d1w, d1m, spot }: { d1: Move; d1w: Move | null; d1m: Move | null; spot: number }) => {
    const W = 900, H = 220, cx = 120, cy = H / 2
    const maxMove = Math.max(d1.move_pct, d1w?.move_pct ?? 0, d1m?.move_pct ?? 0)
    const scale = ((W - cx - 40) / 2) / maxMove
    const bands = [
      { move: d1m, color: "#6666ff", label: "1M" },
      { move: d1w, color: "#e8b84b", label: "1W" },
      { move: d1,  color: "rgba(220,38,38,1)", label: "1D" },
    ].filter(b => b.move) as { move: Move; color: string; label: string }[]
    return (
      <div style={{ border: "1px solid var(--border)", padding: "24px 28px", background: "rgba(0,0,0,0)", marginBottom: "1px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>volatility expansion cone</p>
          <div style={{ display: "flex", gap: "20px" }}>
            {[{ l: "1D", c: "rgba(220,38,38,1)" }, { l: "1W", c: "#e8b84b" }, { l: "1M", c: "#6666ff" }].map(({ l, c }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "2px", background: c }} />
                <span style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.1em" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
          {/* Center line */}
          <line x1={cx} y1={cy} x2={W - 20} y2={cy} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {/* Spot dot */}
          <circle cx={cx} cy={cy} r="5" fill="rgba(220,38,38,1)" />
          <circle cx={cx} cy={cy} r="10" fill="rgba(220,38,38,0.15)" />
          <text x={cx} y={cy + 22} textAnchor="middle" fill="rgba(220,38,38,0.8)" fontSize="10" fontFamily="JetBrains Mono">{spot.toLocaleString()}</text>
          {bands.map(({ move, color, label }) => {
            const halfH = move.move_pct * scale
            return (
              <g key={label}>
                {/* Filled cone */}
                <polygon
                  points={`${cx},${cy} ${W - 40},${cy - halfH} ${W - 40},${cy + halfH}`}
                  fill={color} fillOpacity="0.06"
                  stroke={color} strokeOpacity="0.4" strokeWidth="1"
                />
                {/* Upper price */}
                <text x={W - 36} y={cy - halfH - 6} textAnchor="end" fill="rgba(34,197,94,0.9)" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">{move.upper.toLocaleString()}</text>
                <text x={W - 36} y={cy - halfH + 10} textAnchor="end" fill={color} fontSize="8" fontFamily="JetBrains Mono" opacity="0.7">{label}</text>
                {/* Lower price */}
                <text x={W - 36} y={cy + halfH + 16} textAnchor="end" fill="rgba(255,68,102,0.9)" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">{move.lower.toLocaleString()}</text>
                <text x={W - 36} y={cy + halfH} textAnchor="end" fill={color} fontSize="8" fontFamily="JetBrains Mono" opacity="0.7">{label}</text>
                {/* Tick at end */}
                <line x1={W - 40} y1={cy - halfH} x2={W - 40} y2={cy + halfH} stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }
    const bands = [
      { move: d1m, color: "#4444cc", labelColor: "#8888ff", label: "1M" },
      { move: d1w, color: "#cc9900", labelColor: "#e8b84b", label: "1W" },
      { move: d1,  color: "var(--accent)", labelColor: "var(--accent)", label: "1D" },
    ].filter(b => b.move) as { move: Move; color: string; labelColor: string; label: string }[]
    return (
      <div style={{ border: "1px solid var(--border)", padding: "28px 32px 32px", background: "rgba(0,0,0,0)", marginBottom: "1px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>volatility expansion cone</p>
          <div style={{ display: "flex", gap: "20px" }}>
            {[{ l: "1D", c: "var(--accent)" }, { l: "1W", c: "#e8b84b" }, { l: "1M", c: "#8888ff" }].map(({ l, c }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "2px", background: c }} />
                <span style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.1em" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", height: "200px" }}>
          <div style={{ position: "absolute", left: "12%", right: "8%", top: "50%", height: "1px", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", left: "12%", top: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 12px rgba(220,38,38,0.7)" }} />
            <span style={{ fontSize: "8px", color: "var(--accent)", fontFamily: "JetBrains Mono", whiteSpace: "nowrap" }}>{spot.toLocaleString()}</span>
          </div>
          {bands.map(({ move, labelColor, label }) => {
            const h = Math.min(move.move_pct * 14, 46)
            return (
              <div key={label} style={{ position: "absolute", left: "12%", right: "8%", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: "50%", height: `${h}%`, background: `linear-gradient(to right, transparent 0%, ${labelColor} 100%)`, opacity: 0.18, clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: "50%", height: `${h}%`, borderTop: `1px solid ${labelColor}`, opacity: 0.5, clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: `${h}%`, background: `linear-gradient(to right, transparent 0%, ${labelColor} 100%)`, opacity: 0.18, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: `${h}%`, borderBottom: `1px solid ${labelColor}`, opacity: 0.5, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
                <div style={{ position: "absolute", right: 0, top: `calc(50% - ${h}% - 20px)`, textAlign: "right" }}>
                  <span style={{ fontSize: "10px", color: "var(--bull)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{move.upper.toLocaleString()}</span>
                  <span style={{ fontSize: "7px", color: labelColor, marginLeft: "6px", letterSpacing: "0.1em" }}>{label}</span>
                </div>
                <div style={{ position: "absolute", right: 0, top: `calc(50% + ${h}% + 4px)`, textAlign: "right" }}>
                  <span style={{ fontSize: "7px", color: labelColor, marginRight: "6px", letterSpacing: "0.1em" }}>{label}</span>
                  <span style={{ fontSize: "10px", color: "var(--bear)", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{move.lower.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
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
                  <p style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "12px" }}>{"today's range"} — {data.ticker}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
                    <span style={{ fontSize: "clamp(28px,4vw,48px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--bull)" }}>{d1.upper.toLocaleString()}</span>
                    <span style={{ fontSize: "20px", color: "var(--muted)", fontFamily: "JetBrains Mono" }}>—</span>
                    <span style={{ fontSize: "clamp(28px,4vw,48px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--bear)" }}>{d1.lower.toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px", fontFamily: "JetBrains Mono" }}>{"±"}{d1.move_pts}{" pts · ±"}{d1.move_pct}{"% · 68% probability"}</p>
                </div>
                <button onClick={copyCard} style={{ padding: "10px 20px", background: copied ? "var(--accent-dim)" : "transparent", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                  {copied ? "copied ✓" : "copy range card"}
                </button>
              </div>
            </div>
          )}

          {d1 && <Cone d1={d1} d1w={data.moves["1w"]} d1m={data.moves["1m"]} spot={data.spot} />}

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
                    <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>move</p><p style={{ fontSize: "18px", color: "var(--text)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{"±"}{d1.move_pts}</p></div>
                  </div>
                  <p style={{ fontSize: "8px", color: "var(--muted)" }}>ATM IV: <span style={{ color: "var(--accent)" }}>{data.atm_iv}%</span> · spot × IV × √(1/252)</p>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>VIX method</p>
                  {data.vix_move_pts ? (
                    <>
                      <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", marginBottom: "12px" }}>
                        <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>upper</p><p style={{ fontSize: "18px", color: "var(--bull)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{data.vix_upper?.toLocaleString()}</p></div>
                        <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>lower</p><p style={{ fontSize: "18px", color: "var(--bear)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{data.vix_lower?.toLocaleString()}</p></div>
                        <div><p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "4px" }}>move</p><p style={{ fontSize: "18px", color: "var(--text)", fontFamily: "JetBrains Mono", fontWeight: 700 }}>{"±"}{data.vix_move_pts}</p></div>
                      </div>
                      <p style={{ fontSize: "8px", color: "var(--muted)" }}>VIX: <span style={{ color: "var(--accent)" }}>{data.vix}</span> · spot × (VIX/100) × √(1/252)</p>
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

          <div style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0)", marginBottom: "1px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 90px 90px 100px 1fr 110px 110px", padding: "8px 24px", borderBottom: "1px solid var(--border)", background: "rgba(30,30,46,0.5)", gap: "8px" }}>
              {["period","iv","±%","±pts","range","upper","lower"].map(h => (<span key={h} style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</span>))}
            </div>
            <Row label="1 DAY" move={data.moves["1d"]} />
            <Row label="1 WEEK" move={data.moves["1w"]} />
            <Row label="1 MONTH" move={data.moves["1m"]} />
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
              {[{ range: "below 20%", label: "compressed", desc: "pinning likely. fade breakouts.", color: "var(--bull)" }, { range: "20–35%", label: "normal", desc: "standard moves. use brackets as-is.", color: "var(--muted)" }, { range: "35–50%", label: "elevated", desc: "real moves. take profits early.", color: "var(--warn)" }, { range: "above 50%", label: "crisis", desc: "don't hold overnight. size way down.", color: "var(--bear)" }].map(({ range, label, desc, color }) => (
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