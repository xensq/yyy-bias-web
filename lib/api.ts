const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchBias() {
  const res = await fetch(`${API}/bias`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error("failed")
  return res.json()
}

export async function fetchIV() {
  const res = await fetch(`${API}/iv`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed")
  return res.json()
}

export async function fetchOutlook() {
  const res = await fetch(`${API}/outlook`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed")
  return res.json()
}

export interface StrikeData {
  strike: number; call_gex: number; put_gex: number; call_oi: number; put_oi: number
}

export interface BiasData {
  bias: { direction: string; conviction: number; size_rule: string; size_factor: number; score: number; narrative: string; killed: boolean; kill_reason: string | null; votes: Record<string, number> }
  topology: { pca1: number; pca2: number; vol_z: number; regime: string; dist: number; aligned: boolean; size_factor: number; price: number; error: string | null }
  entropy: { entropy: number; threshold: number; rho: number; status: string; size_factor: number; trend: string; error: string | null }
  gex: { spot: number; vol_trigger: number; call_wall: number; put_wall: number; max_pain: number; net_gex_bn: number; above_vol_trigger: boolean; positive_gamma: boolean; gamma_env: string; pain_pts: number; strike_data: StrikeData[]; error: string | null }
  macro: { walcl: { direction: number; note: string; value: number; change_pct: number }; reserves_rrp: { direction: number; strength: number; note: string; res_chg: number; rrp_chg: number }; oas: { direction: number; note: string; value: number; stress: string; wk_change: number }; auctions: { warning: boolean; note: string; auctions: string[] } }
}

export interface IVData {
  spot: number; expirations: string[]
  table: Array<{ strike: number; values: Record<string, number | null> }>
  baseline_time: string; error: string | null
}
