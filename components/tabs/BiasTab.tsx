"use client"

interface Props {
  bias: {
    direction: string
    conviction: number
    size_rule: string
    size_factor: number
    score: number
    narrative: string
    killed: boolean
    kill_reason: string | null
    votes: Record<string, number>
  }
}

const WEIGHTS: Record<string, number> = { topology: 0.30, gex: 0.25, reserves_rrp: 0.20, oas: 0.10, walcl: 0.10, auction: 0.05 }
const LABELS: Record<string, string> = { topology: "topology", gex: "gex", reserves_rrp: "reserves / rrp", oas: "oas", walcl: "walcl", auction: "auction" }

const DIR_COLOR: Record<string, string> = { BULLISH: "#00c896", BEARISH: "#ff5555", NEUTRAL: "#f0c040", "NO TRADE": "#444" }

function ScoreArc({ score, direction }: { score: number; direction: string }) {
  const color = DIR_COLOR[direction] || "#666"
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 80
  const strokeW = 6

  // Arc from -150deg to +150deg (300deg total sweep)
  const startAngle = -210
  const endAngle = 30
  const totalDeg = 240

  const toRad = (deg: number) => (deg * Math.PI) / 180

  // Background arc
  const bgStart = toRad(startAngle)
  const bgEnd = toRad(endAngle)
  const bgX1 = cx + r * Math.cos(bgStart)
  const bgY1 = cy + r * Math.sin(bgStart)
  const bgX2 = cx + r * Math.cos(bgEnd)
  const bgY2 = cy + r * Math.sin(bgEnd)

  // Score arc — score is -1 to +1, map to 0-240 degrees
  const pct = (score + 1) / 2  // 0 to 1
  const sweepDeg = pct * totalDeg
  const scoreEnd = toRad(startAngle + sweepDeg)
  const sX1 = cx + r * Math.cos(bgStart)
  const sY1 = cy + r * Math.sin(bgStart)
  const sX2 = cx + r * Math.cos(scoreEnd)
  const sY2 = cy + r * Math.sin(scoreEnd)
  const largeArc = sweepDeg > 180 ? 1 : 0

  // Tick marks
  const ticks = [-1, -0.5, 0, 0.5, 1]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background arc */}
      <path
        d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
        fill="none" stroke="#1a1a1a" strokeWidth={strokeW} strokeLinecap="round"
      />

      {/* Score arc */}
      {Math.abs(score) > 0.01 && (
        <path
          d={`M ${sX1} ${sY1} A ${r} ${r} 0 ${largeArc} 1 ${sX2} ${sY2}`}
          fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      )}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill={color} />

      {/* Tick marks */}
      {ticks.map(v => {
        const tickPct = (v + 1) / 2
        const tickDeg = startAngle + tickPct * totalDeg
        const tickRad = toRad(tickDeg)
        const inner = r - 8
        const outer = r + 4
        return (
          <line key={v}
            x1={cx + inner * Math.cos(tickRad)} y1={cy + inner * Math.sin(tickRad)}
            x2={cx + outer * Math.cos(tickRad)} y2={cy + outer * Math.sin(tickRad)}
            stroke="#2a2a2a" strokeWidth="1"
          />
        )
      })}

      {/* Labels */}
      <text x={cx + (r + 18) * Math.cos(toRad(startAngle))} y={cy + (r + 18) * Math.sin(toRad(startAngle))} textAnchor="middle" fill="#333" fontSize="8" fontFamily="JetBrains Mono, monospace">-1</text>
      <text x={cx + (r + 18) * Math.cos(toRad(endAngle))} y={cy + (r + 18) * Math.sin(toRad(endAngle))} textAnchor="middle" fill="#333" fontSize="8" fontFamily="JetBrains Mono, monospace">+1</text>
    </svg>
  )
}

export default function BiasTab({ bias }: Props) {
  const color = DIR_COLOR[bias.direction] || "#666"

  if (bias.killed) {
    return (
      <div style={{ border: "0.5px solid rgba(255,85,85,0.2)", background: "rgba(255,85,85,0.03)", borderRadius: "8px", padding: "40px", textAlign: "center" }}>
        <p style={{ fontSize: "24px", fontWeight: 600, color: "#ff5555", letterSpacing: "0.1em" }}>NO TRADE</p>
        <p style={{ fontSize: "12px", color: "#444", marginTop: "12px" }}>{bias.kill_reason}</p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* main bias card */}
      <div style={{ border: `0.5px solid ${color}22`, background: "#0d0d0d", borderRadius: "8px", padding: "32px", display: "grid", gridTemplateColumns: "1fr auto", gap: "32px", alignItems: "center" }}>
        <div>
          {/* direction */}
          <p style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#333", textTransform: "uppercase", marginBottom: "12px", fontFamily: "JetBrains Mono, monospace" }}>
            nightly bias
          </p>
          <p style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 600, color, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "16px", fontFamily: "JetBrains Mono, monospace" }}>
            {bias.direction}
          </p>
          <p style={{ fontSize: "12px", color: "#444", lineHeight: 1.7, maxWidth: "480px", marginBottom: "28px" }}>
            {bias.narrative}
          </p>

          {/* conviction bar */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase" }}>conviction</span>
              <span style={{ fontSize: "10px", color, fontFamily: "JetBrains Mono, monospace" }}>{bias.conviction.toFixed(0)}%</span>
            </div>
            <div style={{ height: "2px", background: "#111", borderRadius: "1px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${bias.conviction}%`, background: color, borderRadius: "1px", transition: "width 0.8s ease" }} />
            </div>
          </div>

          {/* stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "32px" }}>
            {[
              { label: "size rule", value: bias.size_rule },
              { label: "raw score", value: `${bias.score >= 0 ? "+" : ""}${bias.score.toFixed(3)}` },
              { label: "size factor", value: `${(bias.size_factor * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#333", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#e8e8e8", fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* arc gauge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <ScoreArc score={bias.score} direction={bias.direction} />
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase" }}>signal score</p>
        </div>
      </div>

      {/* layer votes */}
      <div style={{ border: "0.5px solid #1a1a1a", background: "#0d0d0d", borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "9px", letterSpacing: "0.3em", color: "#333", textTransform: "uppercase", marginBottom: "6px" }}>layer breakdown</p>
        <p style={{ fontSize: "11px", color: "#2a2a2a", marginBottom: "20px", lineHeight: 1.6 }}>
          each layer votes bullish (+) or bearish (−) and is weighted by importance. the final score is the weighted sum, scaled by entropy.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { key: "topology", desc: "market regime via PCA — captures trend direction and momentum alignment across the full price structure" },
            { key: "gex", desc: "gamma exposure — above vol trigger means dealers pin price (suppresses moves), below means they amplify moves" },
            { key: "reserves_rrp", desc: "fed h.4.1 reserves + reverse repo — rising reserves = more system liquidity = bullish tailwind" },
            { key: "oas", desc: "option-adjusted credit spreads — wide spreads signal stress and risk-off, tight spreads = healthy risk appetite" },
            { key: "walcl", desc: "fed balance sheet size — expanding = liquidity injection = bullish, contracting = tightening = bearish" },
            { key: "auction", desc: "treasury auction calendar — heavy supply this week can pressure rates and drag on equities" },
          ].map(({ key, desc }) => {
            const vote = bias.votes[key] ?? 0
            const weight = WEIGHTS[key] ?? 0
            const contribution = vote * weight
            const vc = vote > 0.3 ? "#00c896" : vote < -0.3 ? "#ff5555" : "#f0c040"
            return (
              <div key={key} style={{ borderBottom: "0.5px solid #111", paddingBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#666", fontFamily: "JetBrains Mono, monospace" }}>{LABELS[key]}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <span style={{ fontSize: "10px", color: "#2a2a2a" }}>wt {(weight * 100).toFixed(0)}%</span>
                    <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: vc, minWidth: "44px", textAlign: "right" }}>
                      {vote >= 0 ? "+" : ""}{vote.toFixed(2)}
                    </span>
                    <span style={{ fontSize: "10px", color: "#2a2a2a", fontFamily: "JetBrains Mono, monospace", minWidth: "52px", textAlign: "right" }}>
                      {contribution >= 0 ? "+" : ""}{contribution.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div style={{ height: "1px", background: "#111", borderRadius: "1px", overflow: "hidden", marginBottom: "6px" }}>
                  <div style={{ height: "100%", width: `${Math.abs(vote) * 100}%`, background: vc, borderRadius: "1px" }} />
                </div>
                <p style={{ fontSize: "10px", color: "#2a2a2a", lineHeight: 1.6 }}>{desc}</p>
              </div>
            )
          })}
        </div>

        {/* score math */}
        <div style={{ marginTop: "20px", padding: "14px", background: "#080808", borderRadius: "6px", border: "0.5px solid #161616" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#2a2a2a", textTransform: "uppercase", marginBottom: "10px" }}>how the score is calculated</p>
          <p style={{ fontSize: "11px", color: "#2a2a2a", lineHeight: 1.8 }}>
            score = Σ(layer vote × weight) × entropy factor<br />
            <span style={{ color: "#222" }}>
              if score &gt; 0.25 → BULLISH · if score &lt; −0.25 → BEARISH · otherwise NEUTRAL<br />
              conviction = |score| × 100 · size rule scales down when entropy is elevated or topology is near a regime boundary
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
