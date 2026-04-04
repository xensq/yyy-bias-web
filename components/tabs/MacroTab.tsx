"use client"
import { useEffect, useState } from "react"
import { fetchOutlook } from "@/lib/api"

interface MacroData {
  walcl: { direction: number; note: string; value: number; change_pct: number }
  reserves_rrp: { direction: number; strength: number; note: string; res_chg: number; rrp_chg: number }
  oas: { direction: number; note: string; value: number; stress: string; wk_change: number }
  auctions: { warning: boolean; note: string; auctions: string[] }
}

function sc(d: number) { return d >= 1 ? "var(--bull)" : d > 0 ? "#4ade80" : d <= -1 ? "var(--bear)" : d < 0 ? "#f87171" : "var(--warn)" }
function sl(d: number, s = 1) {
  if (d >= 1 && s >= 1) return "MAX BULL"
  if (d >= 1) return "BULLISH"
  if (d > 0) return "MILD BULL"
  if (d <= -1 && s >= 1) return "MAX BEAR"
  if (d <= -1) return "BEARISH"
  if (d < 0) return "MILD BEAR"
  return "NEUTRAL"
}

function SignalBar({ d, s = 1 }: { d: number; s?: number }) {
  const pct = Math.abs(d) * (s ?? 1) * 50
  const color = sc(d)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
      <span style={{ fontSize: "10px", color: "#333", width: "28px", textAlign: "right" }}>bear</span>
      <div style={{ flex: 1, height: "3px", background: "#1a1a1a", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, width: "1px", background: "#2a2a2a", left: "50%" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: "2px", background: color,
          left: d >= 0 ? "50%" : `${50 - pct}%`, width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: "10px", color: "#333", width: "28px" }}>bull</span>
    </div>
  )
}

function MacroCard({ label, d, s = 1, note, extra }: { label: string; d: number; s?: number; note: string; extra?: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#444" }}>{label}</p>
        <span style={{ fontSize: "11px", fontWeight: 500, color: sc(d) }}>{sl(d, s)}</span>
      </div>
      <SignalBar d={d} s={s} />
      <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6 }}>{note}</p>
      {extra}
    </div>
  )
}

function OutlookSection() {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const load = () => {
    if (fetched) return
    setLoading(true)
    setFetched(true)
    fetchOutlook()
      .then(data => {
        if (data.error) setError(data.error)
        else setText(data.text)
      })
      .catch(() => setError("could not generate outlook"))
      .finally(() => setLoading(false))
  }

  return (
    <div className="glass" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#444" }}>ai market outlook</p>
          <p style={{ fontSize: "11px", color: "#333", marginTop: "3px" }}>generated from live macro + structure data</p>
        </div>
        {!fetched && (
          <button onClick={load}
            style={{ padding: "8px 18px", border: "0.5px solid #2a2a2a", background: "transparent", color: "#666", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
            generate →
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#444", fontSize: "12px", padding: "12px 0" }}>
          <div style={{ width: "5px", height: "5px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
          analyzing market conditions...
        </div>
      )}

      {error && (
        <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.7 }}>
          {error.includes("OPENROUTER_API_KEY") || error.includes("OPENROUTER_API_KEY") || error.includes("ANTHROPIC_API_KEY") ? (
            <>
              <p>To enable AI-generated outlooks, add your Anthropic API key to Railway:</p>
              <p style={{ marginTop: "8px", color: "#444" }}>Railway → your service → Variables → Add <code style={{ background: "#1a1a1a", padding: "2px 6px" }}>OPENROUTER_API_KEY</code> → redeploy</p>
            </>
          ) : (
            <p>Could not generate outlook: {error}</p>
          )}
        </div>
      )}

      {text && (
        <div style={{ fontSize: "13px", color: "#888", lineHeight: 1.8 }}>
          {text.split("\n\n").map((para, i) => (
            <p key={i} style={{ marginBottom: i < text.split("\n\n").length - 1 ? "16px" : 0 }}>{para}</p>
          ))}
        </div>
      )}

      {!fetched && !loading && !text && !error && (
        <p style={{ fontSize: "12px", color: "#333", lineHeight: 1.7 }}>
          click generate to produce a professional market outlook based on current macro, liquidity, and structure signals.
        </p>
      )}
    </div>
  )
}

export default function MacroTab({ macro: m }: { macro: MacroData }) {
  const oc = m.oas.value < 3 ? "var(--bull)" : m.oas.value < 4 ? "var(--warn)" : "var(--bear)"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {m.auctions.warning && (
        <div className="glass" style={{ padding: "14px 18px", borderColor: "rgba(240,192,64,0.2)", background: "rgba(240,192,64,0.03)" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--warn)", marginBottom: "4px" }}>treasury auction warning</p>
          <p style={{ fontSize: "12px", color: "#555" }}>{m.auctions.note}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <MacroCard label="walcl — fed balance sheet" d={m.walcl.direction} note={m.walcl.note} />
        <MacroCard label="reserves / rrp — h.4.1" d={m.reserves_rrp.direction} s={m.reserves_rrp.strength} note={m.reserves_rrp.note}
          extra={
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <span style={{ fontSize: "11px", color: "#444" }}>res {m.reserves_rrp.res_chg >= 0 ? "+" : ""}{m.reserves_rrp.res_chg}B</span>
              <span style={{ fontSize: "11px", color: "#444" }}>rrp {m.reserves_rrp.rrp_chg >= 0 ? "+" : ""}{m.reserves_rrp.rrp_chg}B</span>
            </div>
          } />
      </div>

      {/* OAS gauge */}
      <div className="glass" style={{ padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#444" }}>oas — credit spreads</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "#444" }}>{m.oas.stress}</span>
            <span style={{ fontSize: "20px", fontWeight: 500, color: oc }}>{m.oas.value?.toFixed(2)}%</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <span style={{ fontSize: "10px", color: "#333", width: "24px" }}>0%</span>
          <div style={{ flex: 1, height: "6px", borderRadius: "3px", overflow: "hidden", position: "relative", background: "#1a1a1a" }}>
            <div style={{ position: "absolute", inset: "0 67% 0 0", background: "rgba(0,200,150,0.2)", borderRadius: "3px 0 0 3px" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "37.5%", width: "12.5%", background: "rgba(240,192,64,0.2)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", right: 0, background: "rgba(255,85,85,0.2)", borderRadius: "0 3px 3px 0" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, width: "3px", borderRadius: "2px", background: oc, left: `${Math.min(m.oas.value / 8 * 100, 98)}%` }} />
          </div>
          <span style={{ fontSize: "10px", color: "#333", width: "28px" }}>8%+</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#2a2a2a", marginBottom: "12px" }}>
          <span>healthy &lt;3%</span><span>concern 3–4%</span><span>stress 4–5%</span><span>crisis 5%+</span>
        </div>
        <p style={{ fontSize: "12px", color: "#555" }}>{m.oas.note}</p>
      </div>

      {/* Signal summary */}
      <div className="glass" style={{ padding: "18px" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: "12px" }}>macro summary</p>
        {[
          { label: "fed policy", d: m.walcl.direction, note: m.walcl.change_pct > 0 ? "balance sheet expanding" : "balance sheet contracting" },
          { label: "system liquidity", d: m.reserves_rrp.direction * m.reserves_rrp.strength, note: m.reserves_rrp.res_chg > 0 ? "reserve balances rising" : "reserve balances falling" },
          { label: "credit stress", d: m.oas.direction, note: m.oas.stress.toLowerCase() },
        ].map(({ label, d, note }, i, arr) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none" }}>
            <span style={{ fontSize: "12px", color: "#555" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "11px", color: "#333" }}>{note}</span>
              <span style={{ fontSize: "11px", fontWeight: 500, color: sc(d), minWidth: "72px", textAlign: "right" }}>{sl(d)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Outlook */}
      <OutlookSection />
    </div>
  )
}
