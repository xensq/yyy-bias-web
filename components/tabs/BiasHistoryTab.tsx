"use client"
import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Entry {
  id: string; date: string; time: string
  direction: string; score: number; conviction: number; size_rule: string
  narrative: string; regime: string; entropy_status: string; entropy_rho: number
  above_vol_trigger: boolean | null; vol_trigger: number | null
  outcome: string | null; correct: boolean | null; notes: string
}

interface Stats {
  total_graded: number; wins: number; win_rate: number
  by_regime: Record<string, number>
  by_conviction: Record<string, number>
  by_entropy: Record<string, number>
}

const DIR_COLOR: Record<string, string> = {
  BULLISH: "var(--bull)", BEARISH: "var(--bear)", NEUTRAL: "var(--warn)", "NO TRADE": "var(--muted)"
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: "16px 20px", border: "1px solid var(--border)", background: "rgba(0,0,0,0)" }}>
      <p style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
      <p style={{ fontSize: "22px", fontFamily: "JetBrains Mono", color: "var(--text)", fontWeight: 600 }}>{value}</p>
      {sub && <p style={{ fontSize: "8px", color: "var(--muted)", marginTop: "3px" }}>{sub}</p>}
    </div>
  )
}

export default function BiasHistoryTab() {
  const [data, setData] = useState<{ entries: Entry[]; stats: Stats } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [outcomeEntry, setOutcomeEntry] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  const load = () => {
    setLoading(true)
    fetch(`${API}/bias_log`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const saveTonight = async () => {
    setSaving(true)
    await fetch(`${API}/bias_log`, { method: "POST" })
    load()
    setSaving(false)
  }

  const markOutcome = async (id: string, outcome: string) => {
    await fetch(`${API}/bias_log/${id}/outcome?outcome=${outcome}&notes=${encodeURIComponent(notes)}`, { method: "PUT" })
    setOutcomeEntry(null)
    setNotes("")
    load()
  }

  const winColor = (rate: number) => rate >= 60 ? "var(--bull)" : rate >= 45 ? "var(--warn)" : "var(--bear)"

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "11px", padding: "48px 0" }}>
      <div style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
      loading history...
    </div>
  )

  const { entries = [], stats } = data || {}

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginBottom: "4px" }}>
        <div>
          <p style={{ fontSize: "11px", color: "var(--text)", fontWeight: 600, letterSpacing: "0.1em" }}>BIAS HISTORY LOG</p>
          <p style={{ fontSize: "8px", color: "var(--muted)", marginTop: "3px" }}>save tonight's bias · mark yesterday's outcome · track your edge</p>
        </div>
        <button onClick={saveTonight} disabled={saving} style={{
          padding: "10px 24px", background: "transparent", border: "1px solid var(--accent)",
          color: "var(--accent)", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
          cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.5 : 1
        }}>
          {saving ? "saving..." : "save tonight's bias →"}
        </button>
      </div>

      {stats && stats.total_graded > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px" }}>
            <StatCard label="overall win rate" value={`${stats.win_rate}%`} sub={`${stats.wins} of ${stats.total_graded} graded`} />
            <StatCard label="total entries" value={`${entries.length}`} sub={`${entries.length - stats.total_graded} pending outcome`} />
            <StatCard label="best regime" value={Object.entries(stats.by_regime).sort((a,b) => b[1]-a[1])[0]?.[0] || "—"} sub={`${Object.entries(stats.by_regime).sort((a,b) => b[1]-a[1])[0]?.[1] || 0}% win rate`} />
            <StatCard label="high conviction" value={`${stats.by_conviction["high (70+)"] ?? 0}%`} sub="win rate when conviction ≥70" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px" }}>
            {[
              { title: "win rate by regime", data: stats.by_regime },
              { title: "win rate by conviction", data: stats.by_conviction },
              { title: "win rate by entropy", data: stats.by_entropy },
            ].map(({ title, data: d }) => (
              <div key={title} style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0)" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{title}</span>
                </div>
                {Object.entries(d).map(([k, rate]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "8px", color: "var(--muted)" }}>{k}</span>
                    <span style={{ fontSize: "9px", color: winColor(rate as number), fontFamily: "JetBrains Mono", fontWeight: 600 }}>{rate}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 80px 110px 70px 80px 90px 80px 120px", padding: "8px 16px", borderBottom: "1px solid var(--border)", background: "rgba(30,30,46,0.5)" }}>
          {["date","direction","regime","conviction","entropy","size rule","outcome","action"].map(h => (
            <span key={h} style={{ fontSize: "8px", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        {entries.length === 0 && (
          <div style={{ padding: "32px 16px", color: "var(--muted)", fontSize: "11px" }}>
            no entries yet — hit "save tonight's bias" to start tracking
          </div>
        )}
        {entries.map((e: Entry) => (
          <div key={e.id}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 80px 110px 70px 80px 90px 80px 120px", padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
              <span style={{ fontSize: "9px", color: "var(--muted)", fontFamily: "JetBrains Mono" }}>{e.date}</span>
              <span style={{ fontSize: "10px", color: DIR_COLOR[e.direction] || "var(--muted)", fontWeight: 600 }}>{e.direction}</span>
              <span style={{ fontSize: "8px", color: "var(--muted)" }}>{e.regime}</span>
              <span style={{ fontSize: "10px", color: "var(--text)", fontFamily: "JetBrains Mono" }}>{e.conviction}%</span>
              <span style={{ fontSize: "9px", color: e.entropy_status === "CRITICAL" ? "var(--bear)" : e.entropy_status === "ELEVATED" ? "var(--warn)" : "var(--bull)" }}>{e.entropy_status}</span>
              <span style={{ fontSize: "8px", color: "var(--muted)" }}>{e.size_rule}</span>
              <span style={{ fontSize: "9px", color: e.correct === true ? "var(--bull)" : e.correct === false ? "var(--bear)" : "var(--muted)" }}>
                {e.outcome ? `${e.outcome} ${e.correct === true ? "✓" : e.correct === false ? "✗" : "—"}` : "—"}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {!e.outcome ? (
                  <button onClick={() => setOutcomeEntry(outcomeEntry === e.id ? null : e.id)}
                    style={{ padding: "4px 8px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "7px", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" }}>
                    mark outcome
                  </button>
                ) : (
                  <button onClick={() => { setOutcomeEntry(e.id); setNotes(e.notes) }}
                    style={{ padding: "4px 8px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "7px", cursor: "pointer", fontFamily: "inherit" }}>
                    edit
                  </button>
                )}
              </div>
            </div>
            {outcomeEntry === e.id && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "rgba(30,30,46,0.4)", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "8px", color: "var(--muted)" }}>what did the market do?</span>
                {["BULL", "BEAR", "FLAT"].map(o => (
                  <button key={o} onClick={() => markOutcome(e.id, o)}
                    style={{
                      padding: "6px 14px", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: "8px", letterSpacing: "0.15em",
                      border: `1px solid ${o === "BULL" ? "rgba(34,197,94,0.5)" : o === "BEAR" ? "rgba(220,38,38,0.5)" : "rgba(232,184,75,0.5)"}`,
                      color: o === "BULL" ? "var(--bull)" : o === "BEAR" ? "var(--bear)" : "var(--warn)",
                    }}>
                    {o}
                  </button>
                ))}
                <input value={notes} onChange={ev => setNotes(ev.target.value)} placeholder="notes (optional)"
                  style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 10px", fontSize: "8px", fontFamily: "inherit", flex: 1, minWidth: "150px", outline: "none" }} />
              </div>
            )}
            {e.narrative && (
              <div style={{ padding: "6px 16px 10px", borderBottom: "1px solid rgba(30,30,46,0.5)" }}>
                <span style={{ fontSize: "8px", color: "var(--muted)", fontStyle: "italic" }}>{e.narrative}</span>
                {e.notes && <span style={{ fontSize: "8px", color: "var(--accent)", marginLeft: "12px" }}>· {e.notes}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
