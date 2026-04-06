"use client"
import { useEffect, useState } from "react"

const QUOTES: Record<string, string[]> = {
  gex: [
    "> scanning options chain...",
    "> calculating dealer gamma exposure...",
    "> cross-referencing GEX walls...",
    "> gamma flip level confirmed...",
    "> vol trigger located...",
    "> spot is dangerously close to it...",
    "> verifying GEX regime...",
    "> dealers are short gamma...",
    "> moves will be amplified...",
    "> do not fade this...",
    "> seriously, do not fade this...",
    "> someone bought a lot of puts...",
    "> like, a LOT of puts...",
    "> options sellers have no feelings...",
    "> this is fine...",
  ],
  topology: [
    "> reading phase space topology...",
    "> running PCA decomposition...",
    "> manifold learning in progress...",
    "> topology confirmed, probably...",
    "> running entropy manifold...",
    "> signal noise ratio: acceptable...",
    "> pulling historical topology...",
    "> 200 sessions of data loaded...",
    "> orange dot is almost off the chart...",
    "> that is not great...",
    "> entropy check complete...",
  ],
  iv_surface: [
    "> interpolating IV surface...",
    "> left wing steepening...",
    "> puts are expensive, shocking...",
    "> skew regime: elevated fear...",
    "> analyzing term structure...",
    "> backwardation detected...",
    "> something is brewing further out...",
    "> computing 1-sigma brackets...",
    "> IV surface loaded, probably accurate...",
  ],
  probability: [
    "> computing 1-sigma brackets...",
    "> calculating expected move...",
    "> market will probably ignore it...",
    "> 68% confidence interval locked...",
    "> the math checks out...",
    "> probably...",
  ],
  delta: [
    "> dealer hedging flows detected...",
    "> calculating delta exposure...",
    "> tracking dealer positioning...",
    "> flow type confirmed...",
    "> someone is very directional right now...",
    "> delta levels assessed...",
  ],
  flow: [
    "> scanning options flow...",
    "> checking PCR ratio...",
    "> everyone is hedged or everyone is wrong...",
    "> or both...",
    "> 0DTE gang is at it again...",
    "> scanning for max pain level...",
    "> options sellers are rooting against you...",
    "> nothing personal, just business...",
    "> OAS looking kinda spicy...",
  ],
  macro: [
    "> pulling fed balance sheet...",
    "> checking reserve balances...",
    "> cross-referencing WALCL...",
    "> fed is doing fed things...",
    "> pulling RRP data...",
    "> liquidity conditions assessed...",
    "> running auction risk check...",
    "> bond market is being weird again...",
    "> it is always a tariff day...",
    "> size down just in case...",
  ],
  net_iv: [
    "> pulling IV history...",
    "> computing net IV drift...",
    "> cross-referencing term structure...",
    "> vol regime shift detected...",
    "> tracking IV trend...",
  ],
  bias: [
    "> loading bias score...",
    "> six layers of signal...",
    "> three of them agree...",
    "> that is enough probably...",
    "> size rule calculated...",
    "> finalizing conviction score...",
    "> the machine has spoken...",
    "> you probably should not full size this...",
    "> just saying...",
    "> trust the system...",
    "> or do not, it is your money...",
    "> loading complete...",
    "> probably...",
  ],
  expected: [
    "> computing 1-sigma brackets...",
    "> calculating expected move...",
    "> pulling VIX daily range...",
    "> cross-referencing ATM IV...",
    "> methods agree, high confidence...",
    "> or they do not, use caution...",
    "> market will probably ignore it anyway...",
    "> the range is the range...",
  ],
  default: [
    "> scanning options chain...",
    "> calculating dealer gamma exposure...",
    "> reading phase space topology...",
    "> entropy check complete...",
    "> pulling fed balance sheet...",
    "> analyzing vol trigger proximity...",
    "> running PCA decomposition...",
    "> dealer hedging flows detected...",
    "> signal noise ratio: acceptable...",
    "> loading bias score...",
    "> six layers of signal...",
    "> the machine has spoken...",
    "> probably...",
  ],
}

export default function TerminalLoader({ tab, label }: { tab?: string; label?: string }) {
  const pool = QUOTES[tab ?? "default"] ?? QUOTES["default"]
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * pool.length))
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % pool.length)
        setFade(true)
      }, 300)
    }, 1800)
    return () => clearInterval(interval)
  }, [pool])

  return (
    <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", minHeight: "60vh", gap: "16px" }}>
      <div style={{ position: "relative", width: "48px", height: "48px" }}>
        <svg
          viewBox="0 0 100 100"
          style={{ width: "48px", height: "48px", animation: "spin 3s linear infinite", color: "var(--accent)" }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 5 L53 47 L95 50 L53 53 L50 95 L47 53 L5 50 L47 47 Z" fill="var(--accent)" opacity="0.9"/>
          <path d="M50 20 L51.5 48.5 L80 50 L51.5 51.5 L50 80 L48.5 51.5 L20 50 L48.5 48.5 Z" fill="var(--accent)" opacity="0.5"/>
        </svg>
      </div>
      <span style={{
        fontSize: "9px",
        color: "var(--muted)",
        letterSpacing: "0.15em",
        fontFamily: "JetBrains Mono",
        opacity: fade ? 1 : 0,
        transition: "opacity 0.3s ease",
        minHeight: "14px",
      }}>
        {pool[idx]}
      </span>
    </div>
  )
}
