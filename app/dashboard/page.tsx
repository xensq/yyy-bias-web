"use client"
import { useEffect, useRef, useState } from "react"
import { fetchBias, BiasData } from "@/lib/api"
import BiasTab from "@/components/tabs/BiasTab"
import TopologyTab from "@/components/tabs/TopologyTab"
import GexTab from "@/components/tabs/GexTab"
import NetIVTab from "@/components/tabs/NetIVTab"
import IVSurfaceTab from "@/components/tabs/IVSurfaceTab"
import MacroTab from "@/components/tabs/MacroTab"
import ProbabilityTab from "@/components/tabs/ProbabilityTab"
import DealerDeltaTab from "@/components/tabs/DealerDeltaTab"
import FlowTab from "@/components/tabs/FlowTab"
import BiasHistoryTab from "@/components/tabs/BiasHistoryTab"
import ExpectedMoveTab from "@/components/tabs/ExpectedMoveTab"
import { useRouter } from "next/navigation"
import { checkAuth, clearKey } from "@/lib/auth"

const TABS = [
  { id: "bias",        label: "Bias",        icon: "◈" },
  { id: "topology",   label: "Topology",    icon: "⬡" },
  { id: "gex",        label: "GEX",         icon: "Γ" },
  { id: "net iv",     label: "Net IV",      icon: "ν" },
  { id: "iv surface", label: "IV Surface",  icon: "ξ" },
  { id: "probability",label: "Probability", icon: "π" },
  { id: "delta",      label: "Delta",       icon: "Δ" },
  { id: "flow",       label: "Flow",        icon: "ψ" },
  { id: "macro",      label: "Macro",       icon: "Ω" },
  { id: "history",    label: "History",     icon: "τ" },
  { id: "expected",   label: "Exp Move",    icon: "σ" },
] as const
type TabId = typeof TABS[number]["id"]

const THEMES = [
  { id: "default", label: "default" },
  { id: "crimson", label: "crimson" },
  { id: "gold",    label: "gold" },
  { id: "blue",    label: "blue" },
  { id: "silver",  label: "silver" },
]

function GreekBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)

    const symbols = ["Δ", "Γ", "Σ", "θ", "σ", "ρ", "λ", "μ", "α", "β", "π", "φ"]
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      speed: Math.random() * 0.3 + 0.08,
      opacity: Math.random() * 0.28 + 0.10,
      size: Math.random() * 14 + 10,
      drift: (Math.random() - 0.5) * 0.15,
    }))

    const draw = () => {
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "220,38,38"
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.y -= p.speed
        p.x += p.drift
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width }
        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
        ctx.font = `${p.size}px JetBrains Mono, monospace`
        ctx.fillStyle = `rgba(${rgb},${p.opacity})`
        ctx.fillText(p.symbol, p.x, p.y)
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
}

export default function Dashboard() {
  const [data, setData] = useState<BiasData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>("bias")
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("yyy-theme") || "crimson"
    return "crimson"
  })
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth().then(valid => {
      if (!valid) { clearKey(); router.push("/") }
    })
  }, [])

  useEffect(() => {
    fetchBias()
      .then(setData)
      .catch(() => setError("could not reach the bias engine"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("yyy-theme", theme)
  }, [theme])

  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  })

  const sideW = collapsed ? 56 : 180

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "transparent", position: "relative" }}>
      <GreekBackground />

      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: `${sideW}px`,
        background: "rgba(9,5,10,0.88)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderRight: "1px solid rgba(var(--accent-rgb),0.12)",
        display: "flex", flexDirection: "column", zIndex: 20,
        transition: "width 0.2s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "18px 0" : "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
          {!collapsed && (
            <button onClick={() => router.push("/")}
              style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.3em", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              YYY
            </button>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "14px", padding: "0", fontFamily: "inherit", lineHeight: 1 }}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  width: "100%", padding: collapsed ? "11px 0" : "11px 20px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: "none",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s",
                  fontSize: "13px",
                }}>
                <span style={{ fontSize: "16px", width: "20px", textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
                {!collapsed && <span style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Bottom — theme + time */}
        <div style={{ borderTop: "1px solid var(--border)", padding: collapsed ? "12px 0" : "12px 16px" }}>
          {!collapsed && <p style={{ fontSize: "8px", color: "var(--muted)", marginBottom: "8px", letterSpacing: "0.1em" }}>{now}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!collapsed && THEMES.map(th => (
              <button key={th.id} onClick={() => setTheme(th.id)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "3px 0", fontFamily: "inherit" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme === th.id ? "var(--accent)" : "var(--border)" }} />
                <span style={{ fontSize: "9px", color: theme === th.id ? "var(--accent)" : "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{th.label}</span>
              </button>
            ))}
            {collapsed && (
              <button onClick={() => setCollapsed(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "14px", padding: "4px 0", width: "100%", fontFamily: "inherit" }}>
                ◐
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: `${sideW}px`, flex: 1, minWidth: 0, position: "relative", zIndex: 1, transition: "margin-left 0.2s ease" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "11px", padding: "48px 0" }}>
              <div style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
              pulling live data...
            </div>
          )}
          {error && (
            <div style={{ border: "1px solid rgba(255,68,102,0.3)", background: "rgba(255,68,102,0.04)", padding: "16px", color: "var(--bear)", fontSize: "12px", marginTop: "16px" }}>
              {error}
            </div>
          )}

          {tab === "iv surface" && <IVSurfaceTab />}
          {tab === "probability" && <ProbabilityTab />}
          {tab === "delta" && <DealerDeltaTab />}
          {tab === "flow" && <FlowTab />}
          {tab === "history" && <BiasHistoryTab />}
          {tab === "expected" && <ExpectedMoveTab />}
          {tab === "net iv" && <NetIVTab />}

          {data && !loading && (
            <>
              {tab === "bias"      && <BiasTab bias={data.bias} />}
              {tab === "topology"  && <TopologyTab topology={data.topology} entropy={data.entropy} />}
              {tab === "gex"       && <GexTab gex={data.gex} />}
              {tab === "macro"     && <MacroTab macro={data.macro} />}
            </>
          )}
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "9px", marginTop: "48px", letterSpacing: "0.2em", opacity: 0.4 }}>NOT FINANCIAL ADVICE</p>
        </div>
      </div>
    </div>
  )
}
