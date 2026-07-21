// ---------------------------------------------------------------------------
// Domain types for the Malaysia Food Price Transparency Dashboard.
//
// The data model is intentionally shaped so that the embedded mock data can
// later be swapped for a government API or CSV feed without changing the UI:
// a data source only needs to produce `PriceRecord[]` (see data/commodities.ts).
// ---------------------------------------------------------------------------

export type AlertSeverity = 'normal' | 'monitor' | 'critical'

export type CommodityCategory =
  | 'Grains'
  | 'Poultry'
  | 'Red Meat'
  | 'Seafood'
  | 'Eggs'
  | 'Vegetables'

export type TimeGranularity = 'weekly' | 'monthly' | 'yearly'

export type SupplyChainStage = 'farmgate' | 'wholesale' | 'retail'

/** Malaysian region grouping used for the policy insight panel. */
export type Region = 'Central' | 'Northern' | 'Southern' | 'East Coast' | 'East Malaysia'

export interface StateInfo {
  code: string
  name: string
  region: Region
}

/**
 * A single observation: one commodity, in one state/district, on one date,
 * at all three supply-chain stages. This mirrors what a government dataset
 * row would look like.
 */
export interface PriceRecord {
  date: string // ISO date (YYYY-MM-DD), weekly cadence
  commodityId: string
  commodity: string
  category: CommodityCategory
  stateCode: string
  state: string
  district: string
  unit: string
  farmgate: number
  wholesale: number
  retail: number
  weeklyChangePct: number
  monthlyChangePct: number
  supplyVolume: number // tonnes
  transportCost: number // RM per unit
  storageCost: number // RM per unit
  alertStatus: AlertSeverity
}

export interface CommodityMeta {
  id: string
  name: string
  category: CommodityCategory
  unit: string
}

/** Derived markup figures for a single price point (or aggregate). */
export interface MarkupBreakdown {
  farmgate: number
  wholesale: number
  retail: number
  farmToWholesalePct: number
  wholesaleToRetailPct: number
  totalMarkupPct: number
  priceSpread: number
}

export interface Alert {
  id: string
  commodityId: string
  commodity: string
  stateCode: string
  state: string
  type: string
  severity: AlertSeverity
  issue: string
  recommendedAction: string
  detectedDate: string
}

export interface PolicyInsight {
  id: string
  title: string
  detail: string
  recommendation: string
  severity: AlertSeverity
}

export interface Filters {
  commodityIds: string[]
  stateCodes: string[] // empty = all states (national)
  granularity: TimeGranularity
  dateRangeWeeks: number // trailing window length in weeks
  severities: AlertSeverity[] // empty = all severities
}
