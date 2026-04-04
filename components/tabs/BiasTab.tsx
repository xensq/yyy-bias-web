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

const WEIGHTS: Record<string, number> = {
  topology: 0.30, gex: 0.25, reserves_rrp: 0.20,
  oas: 0.10, walcl: 0.10, auction: 0.05
}

const LABELS: Record<string, string> = {
  topology: "topology", gex: "gex", reserves_rrp: "reserves / rrp",
  oas: "oas", walcl: "walcl", auction: "auction"
}

function voteColor(v: number) {
  if (v > 0.3) return "#00c896"
  if (v < -0.3) return "#ff4444"
  return "#f59e0b"
}

export default function BiasTab({ bias }: Props) {
  const dirColor = bias.direction === "BULLISH" ? "#00c896" : bias.direction === "BEARISH" ? "#ff4444" : "#f59e0b"
  const barColor = bias.direction === "BULLISH" ? "bg-bull" : bias.direction === "BEARISH" ? "bg-bear" : "bg-warn"

  if (bias.killed) {
    return (
      <div className="border border-bear/20 bg-bear/5 rounded-lg p-8 text-center mt-4">
        <p className="text-bear text-2xl font-semibold tracking-wide">NO TRADE</p>
        <p className="text-dim text-xs mt-3">{bias.kill_reason}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* main call */}
      <div className="border border-border rounded-lg p-6" style={{ borderColor: dirColor + "33" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-4xl font-semibold tracking-wide" style={{ color: dirColor }}>
              {bias.direction}
            </p>
            <p className="text-dim text-xs mt-2 max-w-xl leading-relaxed">{bias.narrative}</p>
          </div>
          <div className="text-right shrink-0 ml-8">
            <p className="text-dim text-xs uppercase tracking-widest mb-1">conviction</p>
            <p className="text-3xl font-medium" style={{ color: dirColor }}>{bias.conviction.toFixed(0)}%</p>
          </div>
        </div>

        {/* conviction bar */}
        <div className="h-px bg-border rounded-full overflow-hidden mb-4">
          <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${bias.conviction}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "size rule", value: bias.size_rule },
            { label: "raw score", value: `${bias.score >= 0 ? "+" : ""}${bias.score.toFixed(3)}` },
            { label: "size factor", value: `${(bias.size_factor * 100).toFixed(0)}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-dim text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className="text-text font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* layer breakdown */}
      <div className="border border-border rounded-lg p-5">
        <p className="text-dim text-xs uppercase tracking-widest mb-4">layer votes</p>
        <div className="space-y-3">
          {["topology", "gex", "reserves_rrp", "oas", "walcl", "auction"].map(key => {
            const vote = bias.votes[key] ?? 0
            const weight = WEIGHTS[key] ?? 0
            const contribution = vote * weight
            const color = voteColor(vote)
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-dim text-xs">{LABELS[key]}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-muted text-xs">{(weight * 100).toFixed(0)}% wt</span>
                    <span className="text-xs font-mono w-14 text-right" style={{ color }}>
                      {vote >= 0 ? "+" : ""}{vote.toFixed(2)}
                    </span>
                    <span className="text-muted text-xs font-mono w-16 text-right">
                      {contribution >= 0 ? "+" : ""}{contribution.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.abs(vote) * 100}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
