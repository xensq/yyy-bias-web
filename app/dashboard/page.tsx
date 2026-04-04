"use client"
import { useEffect, useState } from "react"
import { fetchBias, BiasData } from "@/lib/api"
import BiasTab from "@/components/tabs/BiasTab"
import TopologyTab from "@/components/tabs/TopologyTab"
import GexTab from "@/components/tabs/GexTab"
import NetIVTab from "@/components/tabs/NetIVTab"
import ZeroDTETab from "@/components/tabs/ZeroDTETab"
import ProbabilityTab from "@/components/tabs/ProbabilityTab"
import DealerDeltaTab from "@/components/tabs/DealerDeltaTab"
import FlowTab from "@/components/tabs/FlowTab"
import IVSurfaceTab from "@/components/tabs/IVSurfaceTab"
import MacroTab from "@/components/tabs/MacroTab"
import { useRouter } from "next/navigation"

const TABS = ["bias", "topology", "gex", "net iv", "iv surface", "probability", "delta", "flow", "macro"] as const
type Tab = typeof TABS[number]

const THEMES = [
  { id: "default", label: "default" },
  { id: "crimson", label: "crimson" },
  { id: "gold", label: "gold" },
  { id: "blue", label: "blue" },
  { id: "silver", label: "silver" },
]

export default function Dashboard() {
  const [data, setData] = useState<BiasData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("bias")
  const [theme, setTheme] = useState("default")
  const [showThemes, setShowThemes] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchBias()
      .then(setData)
      .catch(() => setError("could not reach the bias engine"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  })

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div style={{ borderBottom: "0.5px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 10 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <button onClick={() => router.push("/")}
                style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                yyy
              </button>
              <nav style={{ display: "flex", gap: "2px" }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{
                      padding: "12px 10px", fontSize: "10px", letterSpacing: "0.08em",
                      textTransform: "uppercase", background: "none", border: "none",
                      borderBottom: tab === t ? "1px solid var(--text)" : "1px solid transparent",
                      color: tab === t ? "var(--text)" : "#3a3a3a",
                      cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s",
                    }}>
                    {t}
                  </button>
                ))}
              </nav>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <p style={{ fontSize: "10px", color: "var(--muted)" }}>{now}</p>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowThemes(!showThemes)}
                  style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--muted)", background: "none", border: "0.5px solid #1f1f1f", padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase" }}>
                  theme
                </button>
                {showThemes && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--border)", border: "0.5px solid #1f1f1f", minWidth: "120px", zIndex: 50 }}>
                    {THEMES.map(th => (
                      <button key={th.id} onClick={() => { setTheme(th.id); setShowThemes(false) }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", background: theme === th.id ? "rgba(255,255,255,0.03)" : "none", color: theme === th.id ? "var(--accent)" : "var(--dim)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        {th.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 32px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--dim)", fontSize: "12px", marginTop: "48px" }}>
            <div style={{ width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%" }} />
            pulling live data...
          </div>
        )}
        {error && (
          <div style={{ border: "0.5px solid rgba(255,85,85,0.3)", background: "rgba(255,85,85,0.05)", borderRadius: "8px", padding: "16px", color: "#ff5555", fontSize: "12px", marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* IV Surface doesn't need bias data */}
        {tab === "iv surface" && <IVSurfaceTab />}
        {tab === "probability" && <ProbabilityTab />}
        {tab === "delta" && <DealerDeltaTab />}
        {tab === "flow" && <FlowTab />}

        {data && !loading && (
          <>
            {tab === "bias"      && <BiasTab bias={data.bias} />}
            {tab === "topology"  && <TopologyTab topology={data.topology} entropy={data.entropy} />}
            {tab === "gex"       && <GexTab gex={data.gex} />}
            {tab === "net iv"    && <NetIVTab />}
            {tab === "macro"     && <MacroTab macro={data.macro} />}
          </>
        )}
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "11px", marginTop: "48px", letterSpacing: "0.1em" }}>not financial advice</p>
      </div>
    </main>
  )
}
