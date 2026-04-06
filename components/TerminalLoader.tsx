"use client"
import { useEffect, useState } from "react"

const LINES = [
  "> scanning options chain...",
  "> calculating dealer gamma exposure...",
  "> reading phase space topology...",
  "> cross-referencing GEX walls...",
  "> entropy check complete...",
  "> pulling fed balance sheet...",
  "> checking reserve balances...",
  "> analyzing vol trigger proximity...",
  "> computing 1-sigma brackets...",
  "> reading the tape...",
  "> asking the market nicely...",
  "> the market said no...",
  "> recalibrating after that...",
  "> checking if jerome powell tweeted...",
  "> he did not tweet...",
  "> running PCA decomposition...",
  "> manifold learning in progress...",
  "> topology confirmed, probably...",
  "> dealer hedging flows detected...",
  "> someone bought a lot of puts...",
  "> like, a LOT of puts...",
  "> checking credit spreads...",
  "> OAS looking kinda spicy...",
  "> querying treasury auction results...",
  "> bond market is being weird again...",
  "> 0DTE gang is at it again...",
  "> gamma flip level confirmed...",
  "> vol trigger located...",
  "> spot is dangerously close to it...",
  "> this is fine...",
  "> interpolating IV surface...",
  "> left wing steepening...",
  "> puts are expensive, shocking...",
  "> call sellers crying in the corner...",
  "> skew regime: FEAR...",
  "> no surprise there honestly...",
  "> pulling RRP data...",
  "> liquidity conditions assessed...",
  "> cash leaving safety box...",
  "> or entering it, depends on the day...",
  "> running entropy manifold...",
  "> signal noise ratio: acceptable...",
  "> size rule calculated...",
  "> you probably shouldn't full size this...",
  "> just saying...",
  "> cross-referencing WALCL...",
  "> fed is doing fed things...",
  "> calculating expected move...",
  "> market will probably ignore it...",
  "> checking if it's a tariff day...",
  "> it's always a tariff day...",
  "> VIX regime: elevated...",
  "> understatement of the year...",
  "> running monte carlo simulation...",
  "> 5000 paths calculated...",
  "> most of them were not good...",
  "> checking PCR ratio...",
  "> everyone is hedged or everyone is wrong...",
  "> or both...",
  "> scanning for max pain level...",
  "> options sellers are rooting against you...",
  "> nothing personal, just business...",
  "> verifying GEX regime...",
  "> dealers are short gamma...",
  "> moves will be amplified...",
  "> do not fade this...",
  "> seriously, do not fade this...",
  "> loading bias score...",
  "> six layers of signal...",
  "> three of them agree...",
  "> that's enough probably...",
  "> checking FOMC calendar...",
  "> rates unchanged, for now...",
  "> until they're not...",
  "> pulling historical topology...",
  "> 200 sessions of data loaded...",
  "> orange dot is almost off the chart...",
  "> that's not great...",
  "> running auction risk check...",
  "> 10 year up tomorrow...",
  "> size down just in case...",
  "> analyzing term structure...",
  "> backwardation detected...",
  "> something is brewing further out...",
  "> not touching that with a 10 foot pole...",
  "> finalizing conviction score...",
  "> 27%...",
  "> quarter size...",
  "> the machine has spoken...",
  "> loading complete...",
  "> probably...",
]

export default function TerminalLoader({ label }: { label?: string }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LINES.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % LINES.length)
        setVisible(true)
      }, 300)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
        <span style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {label || "loading"}
        </span>
      </div>
      <p style={{
        fontSize: "11px", color: "var(--accent)", fontFamily: "JetBrains Mono",
        opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
        minHeight: "18px"
      }}>
        {LINES[index]}
      </p>
    </div>
  )
}
