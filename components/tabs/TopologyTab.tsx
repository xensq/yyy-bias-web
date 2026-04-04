interface Props {
  topology: {
    pca1: number; pca2: number; vol_z: number; regime: string
    dist: number; aligned: boolean; size_factor: number; price: number; error: string | null
  }
  entropy: {
    entropy: number; threshold: number; rho: number; status: string
    size_factor: number; trend: string; error: string | null
  }
}

const REGIME_COLORS: Record<string, string> = {
  "BULL TREND": "#00c896", "BEAR TREND": "#ff4444",
  "CONSOLIDATION": "#f59e0b", "EXTENDED": "#f97316", "UNCHARTED": "#ff4444"
}

const ENTROPY_COLORS: Record<string, string> = {
  NORMAL: "#00c896", ELEVATED: "#f59e0b", CRITICAL: "#ff4444"
}

export default function TopologyTab({ topology: t, entropy: e }: Props) {
  const regimeColor = REGIME_COLORS[t.regime] || "#666"
  const entropyColor = ENTROPY_COLORS[e.status] || "#666"

  // PCA regime map dimensions
  const W = 480, H = 320
  const cx = W / 2, cy = H / 2
  const scale = 80  // pixels per unit

  // Current dot position (clamped so it doesn't go off canvas)
  const dotX = cx + Math.max(-cx + 20, Math.min(cx - 20, t.pca1 * scale))
  const dotY = cy - Math.max(-cy + 20, Math.min(cy - 20, t.pca2 * scale))

  // Entropy gauge
  const rhoPercent = Math.min(e.rho / 1.5 * 100, 100)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PCA Regime Map */}
        <div className="border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-dim text-xs uppercase tracking-widest">regime map</p>
            <span className="text-xs font-medium" style={{ color: regimeColor }}>{t.regime}</span>
          </div>

          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
            {/* grid */}
            {[-2,-1,0,1,2].map(i => (
              <g key={i}>
                <line x1={cx + i*scale} y1={20} x2={cx + i*scale} y2={H-20}
                  stroke="#1a1a1a" strokeWidth="1" />
                <line x1={20} y1={cy - i*scale} x2={W-20} y2={cy - i*scale}
                  stroke="#1a1a1a" strokeWidth="1" />
              </g>
            ))}

            {/* regime zones */}
            {/* bull trend zone */}
            <rect x={cx + 1*scale} y={20} width={cx - 1*scale - 20} height={H-40}
              fill="rgba(0,200,150,0.04)" />
            {/* bear trend zone */}
            <rect x={20} y={20} width={cx - 1*scale - 20} height={H-40}
              fill="rgba(255,68,68,0.04)" />

            {/* axes */}
            <line x1={cx} y1={20} x2={cx} y2={H-20} stroke="#2a2a2a" strokeWidth="1" />
            <line x1={20} y1={cy} x2={W-20} y2={cy} stroke="#2a2a2a" strokeWidth="1" />

            {/* threshold lines */}
            <line x1={cx + 1*scale} y1={20} x2={cx + 1*scale} y2={H-20}
              stroke="#333" strokeWidth="1" strokeDasharray="4,4" />
            <line x1={cx - 1*scale} y1={20} x2={cx - 1*scale} y2={H-20}
              stroke="#333" strokeWidth="1" strokeDasharray="4,4" />

            {/* axis labels */}
            <text x={W-15} y={cy+4} fill="#333" fontSize="10" textAnchor="end">trend →</text>
            <text x={cx+4} y={30} fill="#333" fontSize="10">mom ↑</text>

            {/* zone labels */}
            <text x={cx + 1.5*scale} y={40} fill="rgba(0,200,150,0.4)" fontSize="9" textAnchor="middle">BULL</text>
            <text x={cx - 1.5*scale} y={40} fill="rgba(255,68,68,0.4)" fontSize="9" textAnchor="middle">BEAR</text>

            {/* mahalanobis distance circle */}
            <circle cx={cx} cy={cy} r={t.dist * scale}
              fill="none" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3,3" />

            {/* current position */}
            <circle cx={dotX} cy={dotY} r={8}
              fill={regimeColor} opacity={0.2} />
            <circle cx={dotX} cy={dotY} r={4}
              fill={regimeColor} />

            {/* crosshairs */}
            <line x1={dotX} y1={cy} x2={dotX} y2={dotY}
              stroke={regimeColor} strokeWidth="0.5" opacity={0.3} />
            <line x1={cx} y1={dotY} x2={dotX} y2={dotY}
              stroke={regimeColor} strokeWidth="0.5" opacity={0.3} />
          </svg>

          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
            {[
              { label: "pca1", value: `${t.pca1 >= 0 ? "+" : ""}${t.pca1.toFixed(3)}` },
              { label: "pca2", value: `${t.pca2 >= 0 ? "+" : ""}${t.pca2.toFixed(3)}` },
              { label: "dist", value: t.dist.toFixed(3) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-dim text-xs">{label}</p>
                <p className="text-text text-xs font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Entropy gauge */}
        <div className="border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-dim text-xs uppercase tracking-widest">entropy</p>
            <span className="text-xs font-medium" style={{ color: entropyColor }}>{e.status}</span>
          </div>

          {/* big rho display */}
          <div className="text-center py-6">
            <p className="text-dim text-xs uppercase tracking-widest mb-2">vs threshold</p>
            <p className="text-5xl font-semibold" style={{ color: entropyColor }}>
              {e.rho.toFixed(3)}×
            </p>
            <p className="text-dim text-xs mt-2">
              {e.trend === "rising" ? "↑ rising into close" : "↓ falling into close"}
            </p>
          </div>

          {/* gauge bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>0×</span>
              <span className="text-dim">normal</span>
              <span className="text-warn">1.0×</span>
              <span className="text-bear">1.2×</span>
              <span>1.5×</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden relative">
              {/* normal zone */}
              <div className="absolute inset-y-0 left-0 bg-bull/20 rounded-full"
                style={{ width: "66.7%" }} />
              {/* elevated zone */}
              <div className="absolute inset-y-0 bg-warn/20"
                style={{ left: "66.7%", width: "13.3%" }} />
              {/* critical zone */}
              <div className="absolute inset-y-0 bg-bear/20 rounded-r-full"
                style={{ left: "80%", right: 0 }} />
              {/* current marker */}
              <div className="absolute inset-y-0 w-0.5 rounded-full"
                style={{
                  left: `${Math.min(rhoPercent, 99)}%`,
                  background: entropyColor
                }} />
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            {[
              { label: "entropy", value: e.entropy.toFixed(6) },
              { label: "threshold", value: e.threshold.toFixed(6) },
              { label: "size factor", value: `${(e.size_factor * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-dim text-xs">{label}</span>
                <span className="text-text text-xs font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* vol z-score bar */}
      <div className="border border-border rounded-lg p-5">
        <p className="text-dim text-xs uppercase tracking-widest mb-4">volatility z-score</p>
        <div className="flex items-center gap-4">
          <span className="text-dim text-xs w-20">compressed</span>
          <div className="flex-1 h-1 bg-border rounded-full relative overflow-hidden">
            <div className="absolute inset-y-0 w-px bg-border" style={{ left: "50%" }} />
            <div className="absolute inset-y-0 rounded-full"
              style={{
                left: t.vol_z >= 0 ? "50%" : `${50 + t.vol_z * 10}%`,
                width: `${Math.abs(t.vol_z) * 10}%`,
                background: t.vol_z > 1 ? "#ff4444" : t.vol_z > 0 ? "#f59e0b" : "#00c896",
                maxWidth: "50%"
              }} />
          </div>
          <span className="text-dim text-xs w-20 text-right">elevated</span>
          <span className="text-text text-xs font-mono w-16 text-right">
            {t.vol_z >= 0 ? "+" : ""}{t.vol_z.toFixed(3)}
          </span>
        </div>
        <p className="text-dim text-xs mt-2">
          {t.vol_z > 1.5 ? "vol significantly above average — widen stops, reduce size"
           : t.vol_z > 0.5 ? "vol slightly elevated — normal caution"
           : t.vol_z < -0.5 ? "vol compressed — potential expansion incoming"
           : "vol near average — normal conditions"}
        </p>
      </div>
    </div>
  )
}
