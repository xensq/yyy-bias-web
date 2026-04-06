"use client"
import TerminalLoader from "@/components/TerminalLoader"
import { useEffect, useState } from "react"
import { fetchOutlook } from "@/lib/api"

interface MacroData {
  walcl: { direction: number; note: string; value: number; change_pct: number }
  reserves_rrp: { direction: number; strength: number; note: string; res_chg: number; rrp_chg: number }
  oas: { direction: number; note: string; value: number; stress: string; wk_change: number }
  auctions: { warning: boolean; note: string; auctions: string[] }
}

function sc(d: number) { return d >= 1 ? "var(--bull)" : d > 0 ? "var(--bull)" : d <= -1 ? "var(--bear)" : d < 0 ? "var(--bear)" : "var(--warn)" }
function sl(d: number) {
  if (d >= 1) return "MAX BULL"
  if (d > 0) return "MILD BULL"
  if (d <= -1) return "MAX BEAR"
  if (d < 0) return "MILD BEAR"
  return "NEUTRAL"
}

function Row({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "10px", color: "var(--muted)" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono", color: color || "var(--text)" }}>{value}</span>
        {sub && <p style={{ fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>{sub}</p>}
      </div>
    </div>
  )
}

function SignalBar({ d, s = 1 }: { d: number; s?: number }) {
  const pct = Math.min(Math.abs(d) * (s ?? 1) * 50, 50)
  const color = sc(d)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0 4px" }}>
      <span style={{ fontSize: "8px", color: "var(--muted)", width: "24px", textAlign: "right" }}>bear</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border)", position: "relative" }}>
        <div style={{ position: "absolute", top: "-1px", height: "3px", background: color, width: `${pct}%`, left: d >= 0 ? "50%" : `${50 - pct}%` }} />
        <div style={{ position: "absolute", top: "-2px", left: "50%", width: "1px", height: "5px", background: "var(--border-light)" }} />
      </div>
      <span style={{ fontSize: "8px", color: "var(--muted)", width: "24px" }}>bull</span>
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
    setLoading(true); setFetched(true)
    fetchOutlook()
      .then(d => { if (d.error) setError(d.error); else setText(d.text) })
      .catch(() => setError("could not generate outlook"))
      .finally(() => setLoading(false))
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--muted)", textTransform: "uppercase" }}>ai market outlook</span>
        {!fetched && (
          <button onClick={load}
            style={{ padding: "5px 14px", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
            generate →
          </button>
        )}
      </div>
      {loading && <TerminalLoader />}
      {error && <p style={{ fontSize: "11px", color: "var(--muted)" }}>could not generate — check openrouter key in railway</p>}
      {text && (
        <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.8 }}>
          {text.split("\n\n").map((p, i) => <p key={i} style={{ marginBottom: "12px" }}>{p}</p>)}
        </div>
      )}
      {!fetched && !loading && !text && (
        <p style={{ fontSize: "11px", color: "var(--muted)" }}>ai-generated outlook from live macro + structure data</p>
      )}
    </div>
  )
}

export default function MacroTab({ macro: m }: { macro: MacroData }) {
  const oc = m.oas.value < 3 ? "var(--bull)" : m.oas.value < 4 ? "var(--warn)" : "var(--bear)"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>

      {m.auctions.warning && (
        <div style={{ background: "rgba(232,184,75,0.06)", border: "1px solid rgba(232,184,75,0.25)", padding: "12px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ fontSize: "9px", color: "var(--warn)", letterSpacing: "0.2em", textTransform: "uppercase" }}>auction warning</span>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>{m.auctions.note}</span>
        </div>
      )}

      {/* Signal summary bar */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "fed policy", d: m.walcl.direction, note: m.walcl.change_pct > 0 ? "balance sheet expanding" : "contracting" },
          { label: "system liquidity", d: m.reserves_rrp.direction * m.reserves_rrp.strength, note: m.reserves_rrp.res_chg > 0 ? "reserves rising" : "reserves falling" },
          { label: "credit stress", d: m.oas.direction, note: m.oas.stress.toLowerCase() },
        ].map(({ label, d, note }, i, arr) => (
          <div key={label} style={{ padding: "16px 20px", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "9px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{label}</span>
              <span style={{ fontSize: "10px", color: sc(d), fontFamily: "JetBrains Mono" }}>{sl(d)}</span>
            </div>
            <SignalBar d={d} />
            <span style={{ fontSize: "9px", color: "var(--muted)" }}>{note}</span>
          </div>
        ))}
      </div>

      {/* WALCL + Reserves side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>walcl — fed balance sheet</span>
            <span style={{ fontSize: "11px", color: sc(m.walcl.direction), fontFamily: "JetBrains Mono" }}>{sl(m.walcl.direction)}</span>
          </div>
          <SignalBar d={m.walcl.direction} />
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px", lineHeight: 1.7 }}>{m.walcl.note}</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>reserves / rrp — h.4.1</span>
            <span style={{ fontSize: "11px", color: sc(m.reserves_rrp.direction), fontFamily: "JetBrains Mono" }}>{sl(m.reserves_rrp.direction)}</span>
          </div>
          <SignalBar d={m.reserves_rrp.direction} s={m.reserves_rrp.strength} />
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px", lineHeight: 1.7 }}>{m.reserves_rrp.note}</p>
          <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
            <span style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "JetBrains Mono" }}>res {m.reserves_rrp.res_chg >= 0 ? "+" : ""}{m.reserves_rrp.res_chg}B</span>
            <span style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "JetBrains Mono" }}>rrp {m.reserves_rrp.rrp_chg >= 0 ? "+" : ""}{m.reserves_rrp.rrp_chg}B</span>
          </div>
        </div>
      </div>

      {/* OAS */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>oas — credit spreads</span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "10px", color: "var(--muted)" }}>{m.oas.stress}</span>
            <span style={{ fontSize: "22px", fontWeight: 600, color: oc, fontFamily: "JetBrains Mono" }}>{m.oas.value?.toFixed(2)}%</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "9px", color: "var(--muted)", width: "20px" }}>0%</span>
          <div style={{ flex: 1, height: "4px", background: "var(--border)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: "0 67% 0 0", background: "rgba(0,200,150,0.15)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "37.5%", width: "12.5%", background: "rgba(232,184,75,0.15)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", right: 0, background: "rgba(255,68,102,0.15)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, width: "2px", background: oc, left: `${Math.min(m.oas.value / 8 * 100, 98)}%` }} />
          </div>
          <span style={{ fontSize: "9px", color: "var(--muted)", width: "28px" }}>8%+</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginBottom: "12px" }}>
          <span>&lt;3% healthy</span><span>3–4% concern</span><span>4–5% stress</span><span>5%+ crisis</span>
        </div>
        <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.7 }}>{m.oas.note}</p>
      </div>

      {/* AI Outlook */}
      <OutlookSection />
    </div>
  )
}
