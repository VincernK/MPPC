import {
  ALL_DATES,
  COMMODITY_BY_ID,
  REGION_OF,
  STATES,
} from '../data/commodities'
import type {
  AlertSeverity,
  Filters,
  MarkupBreakdown,
  PriceRecord,
  Region,
} from '../types'
import {
  computeMarkup,
  markupSeverity,
  mean,
  totalMarkupPct,
  volatilityPct,
} from './calculations'
import { formatMonth, formatDateShort } from './format'

// ---------------------------------------------------------------------------
// Derived, filter-aware view models consumed by the components.
// ---------------------------------------------------------------------------

export interface CommodityAggregate {
  commodityId: string
  commodity: string
  category: string
  unit: string
  farmgate: number
  wholesale: number
  retail: number
  markup: MarkupBreakdown
  weeklyChangePct: number
  monthlyChangePct: number
  volatilityPct: number
  highestState: string
  highestStateRetail: number
  supplyVolume: number
  transportCost: number
  storageCost: number
  alertStatus: AlertSeverity
  lastUpdated: string
}

export interface TrendPoint {
  label: string
  date: string
  farmgate: number
  wholesale: number
  retail: number
}

export interface VolatilityPoint {
  label: string
  date: string
  changePct: number
  spike: boolean
}

export interface StateAggregate {
  stateCode: string
  state: string
  region: Region
  retail: number
  totalMarkupPct: number
  volatilityPct: number
  alerts: number
  vsNationalPct: number
}

export interface KpiSet {
  avgFarmgate: number
  avgWholesale: number
  avgRetail: number
  totalMarkupPct: number
  farmToWholesalePct: number
  wholesaleToRetailPct: number
  priceSpread: number
  activeAlerts: number
  criticalAlerts: number
  monitorAlerts: number
}

export interface DerivedData {
  windowDates: string[]
  latestDate: string
  filteredRecords: PriceRecord[]
  commodityAggregates: CommodityAggregate[]
  kpis: KpiSet
  trend: TrendPoint[]
  stateAggregates: StateAggregate[]
}

function inWindow(dates: string[], weeks: number): string[] {
  return dates.slice(Math.max(0, dates.length - weeks))
}

/** Records limited to the selected commodities, states and trailing window. */
export function filterRecords(records: PriceRecord[], filters: Filters): PriceRecord[] {
  const windowDates = new Set(inWindow(ALL_DATES, filters.dateRangeWeeks))
  const commoditySet =
    filters.commodityIds.length > 0 ? new Set(filters.commodityIds) : null
  const stateSet = filters.stateCodes.length > 0 ? new Set(filters.stateCodes) : null

  return records.filter(
    (r) =>
      windowDates.has(r.date) &&
      (!commoditySet || commoditySet.has(r.commodityId)) &&
      (!stateSet || stateSet.has(r.stateCode)),
  )
}

/** Build a per-commodity current aggregate across the selected states. */
export function aggregateCommodity(
  records: PriceRecord[],
  commodityId: string,
  windowDates: string[],
): CommodityAggregate | null {
  const rows = records.filter((r) => r.commodityId === commodityId)
  if (rows.length === 0) return null

  const latestDate = windowDates[windowDates.length - 1]
  const latestRows = rows.filter((r) => r.date === latestDate)
  if (latestRows.length === 0) return null

  const farmgate = mean(latestRows.map((r) => r.farmgate))
  const wholesale = mean(latestRows.map((r) => r.wholesale))
  const retail = mean(latestRows.map((r) => r.retail))
  const weeklyChangePct = mean(latestRows.map((r) => r.weeklyChangePct))
  const monthlyChangePct = mean(latestRows.map((r) => r.monthlyChangePct))

  // Highest-price state at the latest date.
  const highest = latestRows.reduce((a, b) => (b.retail > a.retail ? b : a))

  // Aggregate retail series across states per date for volatility.
  const byDate = new Map<string, number[]>()
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date)!.push(r.retail)
  }
  const series = windowDates
    .map((d) => (byDate.has(d) ? mean(byDate.get(d)!) : null))
    .filter((v): v is number => v !== null)
  const vol = volatilityPct(series)

  const markup = computeMarkup(farmgate, wholesale, retail)
  const meta = COMMODITY_BY_ID[commodityId]

  return {
    commodityId,
    commodity: meta.name,
    category: meta.category,
    unit: meta.unit,
    farmgate,
    wholesale,
    retail,
    markup,
    weeklyChangePct,
    monthlyChangePct,
    volatilityPct: vol,
    highestState: highest.state,
    highestStateRetail: highest.retail,
    supplyVolume: latestRows.reduce((a, r) => a + r.supplyVolume, 0),
    transportCost: mean(latestRows.map((r) => r.transportCost)),
    storageCost: mean(latestRows.map((r) => r.storageCost)),
    alertStatus: markupSeverity(markup.totalMarkupPct),
    lastUpdated: latestDate,
  }
}

/** Time-series trend for the selected commodities/states at the requested granularity. */
export function buildTrend(records: PriceRecord[], filters: Filters): TrendPoint[] {
  // Average across all filtered records grouped by date.
  const byDate = new Map<
    string,
    { fg: number[]; ws: number[]; rt: number[] }
  >()
  for (const r of records) {
    if (!byDate.has(r.date)) byDate.set(r.date, { fg: [], ws: [], rt: [] })
    const b = byDate.get(r.date)!
    b.fg.push(r.farmgate)
    b.ws.push(r.wholesale)
    b.rt.push(r.retail)
  }

  const weekly = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      farmgate: mean(b.fg),
      wholesale: mean(b.ws),
      retail: mean(b.rt),
    }))

  if (filters.granularity === 'weekly') {
    return weekly.map((p) => ({ ...p, label: formatDateShort(p.date) }))
  }

  // Bucket by month or year and average.
  const keyFn =
    filters.granularity === 'monthly'
      ? (d: string) => d.slice(0, 7)
      : (d: string) => d.slice(0, 4)

  const buckets = new Map<
    string,
    { date: string; fg: number[]; ws: number[]; rt: number[] }
  >()
  for (const p of weekly) {
    const k = keyFn(p.date)
    if (!buckets.has(k)) buckets.set(k, { date: p.date, fg: [], ws: [], rt: [] })
    const b = buckets.get(k)!
    b.date = p.date // last date in bucket
    b.fg.push(p.farmgate)
    b.ws.push(p.wholesale)
    b.rt.push(p.retail)
  }

  return Array.from(buckets.values()).map((b) => ({
    date: b.date,
    label:
      filters.granularity === 'monthly' ? formatMonth(b.date) : b.date.slice(0, 4),
    farmgate: mean(b.fg),
    wholesale: mean(b.ws),
    retail: mean(b.rt),
  }))
}

/** Per-state aggregates across the selected commodities (for the regional map). */
export function buildStateAggregates(
  records: PriceRecord[],
  windowDates: string[],
  nationalRetail: number,
): StateAggregate[] {
  const latestDate = windowDates[windowDates.length - 1]

  return STATES.map((st) => {
    const rows = records.filter((r) => r.stateCode === st.code)
    const latestRows = rows.filter((r) => r.date === latestDate)

    if (latestRows.length === 0) {
      return {
        stateCode: st.code,
        state: st.name,
        region: st.region,
        retail: 0,
        totalMarkupPct: 0,
        volatilityPct: 0,
        alerts: 0,
        vsNationalPct: 0,
      }
    }

    const retail = mean(latestRows.map((r) => r.retail))
    const markup = mean(
      latestRows.map((r) => totalMarkupPct(r.farmgate, r.retail)),
    )

    // Volatility: average of each commodity's retail-series volatility.
    const byCommodity = new Map<string, Map<string, number>>()
    for (const r of rows) {
      if (!byCommodity.has(r.commodityId)) byCommodity.set(r.commodityId, new Map())
      byCommodity.get(r.commodityId)!.set(r.date, r.retail)
    }
    const vols: number[] = []
    for (const [, m] of byCommodity) {
      const series = windowDates
        .map((d) => m.get(d))
        .filter((v): v is number => v !== undefined)
      vols.push(volatilityPct(series))
    }

    const alerts = latestRows.filter((r) => r.alertStatus !== 'normal').length

    return {
      stateCode: st.code,
      state: st.name,
      region: REGION_OF[st.code],
      retail,
      totalMarkupPct: markup,
      volatilityPct: mean(vols),
      alerts,
      vsNationalPct:
        nationalRetail > 0 ? ((retail - nationalRetail) / nationalRetail) * 100 : 0,
    }
  })
}

/** Compose the full derived model for a set of filters. */
export function deriveDashboard(records: PriceRecord[], filters: Filters): DerivedData {
  const windowDates = inWindow(ALL_DATES, filters.dateRangeWeeks)
  const latestDate = windowDates[windowDates.length - 1]
  const filtered = filterRecords(records, filters)

  const commodityIds =
    filters.commodityIds.length > 0
      ? filters.commodityIds
      : Array.from(new Set(records.map((r) => r.commodityId)))

  const commodityAggregates = commodityIds
    .map((id) => aggregateCommodity(filtered, id, windowDates))
    .filter((a): a is CommodityAggregate => a !== null)

  const avgFarmgate = mean(commodityAggregates.map((a) => a.farmgate))
  const avgWholesale = mean(commodityAggregates.map((a) => a.wholesale))
  const avgRetail = mean(commodityAggregates.map((a) => a.retail))

  const stateAggregates = buildStateAggregates(filtered, windowDates, avgRetail)

  const trend = buildTrend(filtered, filters)

  const kpis: KpiSet = {
    avgFarmgate,
    avgWholesale,
    avgRetail,
    totalMarkupPct:
      avgFarmgate > 0 ? ((avgRetail - avgFarmgate) / avgFarmgate) * 100 : 0,
    farmToWholesalePct:
      avgFarmgate > 0 ? ((avgWholesale - avgFarmgate) / avgFarmgate) * 100 : 0,
    wholesaleToRetailPct:
      avgWholesale > 0 ? ((avgRetail - avgWholesale) / avgWholesale) * 100 : 0,
    priceSpread: avgRetail - avgFarmgate,
    activeAlerts: 0,
    criticalAlerts: 0,
    monitorAlerts: 0,
  }

  return {
    windowDates,
    latestDate,
    filteredRecords: filtered,
    commodityAggregates,
    kpis,
    trend,
    stateAggregates,
  }
}

/** Build a per-commodity volatility (week-over-week retail % change) series. */
export function buildVolatilitySeries(
  records: PriceRecord[],
  commodityId: string,
  windowDates: string[],
): VolatilityPoint[] {
  const rows = records.filter((r) => r.commodityId === commodityId)
  const byDate = new Map<string, number[]>()
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date)!.push(r.retail)
  }
  const series = windowDates
    .map((d) => ({ date: d, val: byDate.has(d) ? mean(byDate.get(d)!) : null }))
    .filter((p): p is { date: string; val: number } => p.val !== null)

  const points: VolatilityPoint[] = []
  for (let i = 1; i < series.length; i++) {
    const change = ((series[i].val - series[i - 1].val) / series[i - 1].val) * 100
    points.push({
      label: formatDateShort(series[i].date),
      date: series[i].date,
      changePct: change,
      spike: Math.abs(change) >= 5,
    })
  }
  return points
}
