"use client"

interface Props {
  bias: {
    direction: string; conviction: number; size_rule: string
    size_factor: number; score: number; narrative: string
    killed: boolean; kill_reason: string | null
    votes: Record<string, number>
  }
}

const WEIGHTS: Record<string, number> = { topology: 0.30, gex: 0.25, reserves_rrp: 0.20, oas: 0.10, walcl: 0.10, auction: 0.05 }
const LABELS: Record<string, string> = { topology: "topology", gex: "gex", reserves_rrp: "reserves / rrp", oas: "oas", walcl: "walcl", auction: "auction" }
const DESCS: Record<string, string> = {
  topology: "market regime via PCA — trend direction and momentum alignment",
  gex: "gamma exposure — above vol trigger = pin, below = amplify",
  reserves_rrp: "fed h.4.1 reserves + reverse repo — system liquidity direction",
  oas: "option-adjusted credit spreads — stress circuit breaker",
  walcl: "fed balance sheet size — expanding = bullish, contracting = bearish",
  auction: "treasury auction calendar — heavy supply = size down",
}

function dirColor(d: string) {
  if (d === "BULLISH") return "var(--bull)"
  if (d === "BEARISH") return "var(--bear)"
  if (d === "NO TRADE") return "var(--muted)"
  return "var(--warn)"
}

function voteColor(v: number) {
  if (v > 0.3) return "var(--bull)"
  if (v < -0.3) return "var(--bear)"
  return "var(--warn)"
}

function ScoreArc({ score, direction }: { score: number; direction: string }) {
  const color = dirColor(direction)
  const cx = 80, cy = 80, r = 60, sw = 5
  const toRad = (d: number) => d * Math.PI / 180
  const startDeg = -210, totalDeg = 240
  const pct = (score + 1) / 2
  const sweepDeg = pct * totalDeg
  const endRad = toRad(startDeg + sweepDeg)
  const bgStart = toRad(startDeg)
  const bgEnd = toRad(startDeg + totalDeg)
  const arc = (a1: number, a2: number, large: number) =>
    `M ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}`

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      <path d={arc(bgStart, bgEnd, 1)} fill="none" stroke="var(--border)" strokeWidth={sw} strokeLinecap="round" />
      {Math.abs(score) > 0.01 && (
        <path d={arc(bgStart, endRad, sweepDeg > 180 ? 1 : 0)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize="22" fontWeight="600" fontFamily="JetBrains Mono, monospace">
        {score >= 0 ? "+" : ""}{score.toFixed(2)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
        SCORE
      </text>
    </svg>
  )
}

export default function BiasTab({ bias }: Props) {
  const color = dirColor(bias.direction)

  if (bias.killed) return (
    <div style={{ border: "1px solid rgba(255,68,102,0.3)", padding: "48px", textAlign: "center" }}>
      <p style={{ fontSize: "28px", fontWeight: 600, color: "var(--bear)", letterSpacing: "0.1em" }}>NO TRADE</p>
      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>{bias.kill_reason}</p>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>

      {/* Hero row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", background: "var(--surface)", border: "1px solid var(--border)", padding: "32px" }}>
        <div>
          <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "16px" }}>nightly bias</p>
          <p style={{ fontSize: "clamp(52px, 7vw, 80px)", fontWeight: 600, color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "20px" }}>
            {bias.direction}
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.7, maxWidth: "500px", marginBottom: "32px" }}>
            {bias.narrative}
          </p>

          {/* conviction */}
          <div style={{ marginBottom: "28px", maxWidth: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>conviction</span>
              <span style={{ fontSize: "9px", color, fontFamily: "JetBrains Mono" }}>{bias.conviction.toFixed(0)}%</span>
            </div>
            <div style={{ height: "1px", background: "var(--border)" }}>
              <div style={{ height: "100%", width: `${bias.conviction}%`, background: color, transition: "width 0.8s ease" }} />
            </div>
          </div>

          {/* stats */}
          <div style={{ display: "flex", gap: "40px" }}>
            {[
              { label: "size rule", value: bias.size_rule },
              { label: "size factor", value: `${(bias.size_factor * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--text)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <ScoreArc score={bias.score} direction={bias.direction} />
        </div>
      </div>

      {/* Layer breakdown */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--muted)", textTransform: "uppercase" }}>layer breakdown</span>
          <span style={{ fontSize: "9px", color: "var(--muted)" }}>score = Σ(vote × weight) × entropy</span>
        </div>
        {["topology", "gex", "reserves_rrp", "oas", "walcl", "auction"].map((key, i, arr) => {
          const vote = bias.votes[key] ?? 0
          const weight = WEIGHTS[key] ?? 0
          const contribution = vote * weight
          const vc = voteColor(vote)
          return (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr 80px 80px 100px", gap: "16px", alignItems: "center", padding: "14px 24px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: "10px", color: "var(--dim)" }}>{LABELS[key]}</span>
              <div style={{ height: "1px", background: "var(--border)", position: "relative" }}>
                <div style={{
                  position: "absolute", top: "-1px", height: "3px", borderRadius: "0",
                  background: vc, width: `${Math.abs(vote) * 100}%`,
                  left: vote >= 0 ? "50%" : `${50 - Math.abs(vote) * 50}%`,
                  transition: "width 0.5s"
                }} />
                <div style={{ position: "absolute", top: "-2px", left: "50%", width: "1px", height: "5px", background: "var(--border-light)" }} />
              </div>
              <span style={{ fontSize: "9px", color: "var(--muted)", textAlign: "right" }}>{(weight * 100).toFixed(0)}%</span>
              <span style={{ fontSize: "11px", color: vc, textAlign: "right", fontFamily: "JetBrains Mono" }}>{vote >= 0 ? "+" : ""}{vote.toFixed(2)}</span>
              <span style={{ fontSize: "10px", color: "var(--muted)", textAlign: "right", fontFamily: "JetBrains Mono" }}>{contribution >= 0 ? "+" : ""}{contribution.toFixed(3)}</span>
            </div>
          )
        })}
      </div>

      {/* Score math */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 24px", display: "flex", gap: "48px" }}>
        {[
          { label: "BULLISH threshold", value: "score > +0.25" },
          { label: "BEARISH threshold", value: "score < −0.25" },
          { label: "NEUTRAL zone", value: "−0.25 to +0.25" },
          { label: "conviction formula", value: "|score| × 100" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "4px", letterSpacing: "0.1em" }}>{label}</p>
            <p style={{ fontSize: "10px", color: "var(--dim)", fontFamily: "JetBrains Mono" }}>{value}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
