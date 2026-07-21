import type {
  CommodityCategory,
  CommodityMeta,
  PriceRecord,
  Region,
  StateInfo,
} from '../types'

// ---------------------------------------------------------------------------
// DEMONSTRATION DATA
//
// This module deterministically generates a realistic weekly price panel for
// Malaysian food commodities across all states, at farm-gate, wholesale and
// retail stages. Values are illustrative only.
//
// To replace with a real source, produce an array of `PriceRecord` from a
// government API or CSV and export it as `priceRecords` — nothing else in the
// app needs to change.
// ---------------------------------------------------------------------------

/** The reference "today" for the dataset. */
export const DATA_AS_OF = '2026-07-16'

/** Number of trailing weekly observations to generate (~2 years). */
const WEEKS = 104

// --- Deterministic PRNG (mulberry32) so the dataset is stable across reloads.
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ---------------------------------------------------------------------------
// States (16 Malaysian states / federal territories) with a cost-of-supply
// multiplier and a regional grouping.
// ---------------------------------------------------------------------------
export const STATES: StateInfo[] = [
  { code: 'JHR', name: 'Johor', region: 'Southern' },
  { code: 'KDH', name: 'Kedah', region: 'Northern' },
  { code: 'KTN', name: 'Kelantan', region: 'East Coast' },
  { code: 'MLK', name: 'Melaka', region: 'Southern' },
  { code: 'NSN', name: 'Negeri Sembilan', region: 'Southern' },
  { code: 'PHG', name: 'Pahang', region: 'East Coast' },
  { code: 'PRK', name: 'Perak', region: 'Northern' },
  { code: 'PLS', name: 'Perlis', region: 'Northern' },
  { code: 'PNG', name: 'Pulau Pinang', region: 'Northern' },
  { code: 'SBH', name: 'Sabah', region: 'East Malaysia' },
  { code: 'SWK', name: 'Sarawak', region: 'East Malaysia' },
  { code: 'SGR', name: 'Selangor', region: 'Central' },
  { code: 'TRG', name: 'Terengganu', region: 'East Coast' },
  { code: 'KUL', name: 'Kuala Lumpur', region: 'Central' },
  { code: 'LBN', name: 'Labuan', region: 'East Malaysia' },
  { code: 'PJY', name: 'Putrajaya', region: 'Central' },
]

export const REGION_OF: Record<string, Region> = Object.fromEntries(
  STATES.map((s) => [s.code, s.region]),
)

// Regional cost multipliers: East Malaysia & East Coast pay more for logistics.
const STATE_COST_MULT: Record<Region, number> = {
  Central: 1.0,
  Northern: 0.97,
  Southern: 0.99,
  'East Coast': 1.05,
  'East Malaysia': 1.14,
}

// A representative district per state (for the data model / table detail).
const STATE_DISTRICT: Record<string, string> = {
  JHR: 'Johor Bahru',
  KDH: 'Alor Setar',
  KTN: 'Kota Bharu',
  MLK: 'Melaka Tengah',
  NSN: 'Seremban',
  PHG: 'Kuantan',
  PRK: 'Ipoh',
  PLS: 'Kangar',
  PNG: 'Seberang Perai',
  SBH: 'Kota Kinabalu',
  SWK: 'Kuching',
  SGR: 'Petaling',
  TRG: 'Kuala Terengganu',
  KUL: 'Kuala Lumpur',
  LBN: 'Labuan',
  PJY: 'Putrajaya',
}

// ---------------------------------------------------------------------------
// Commodity definitions with realistic base economics.
// ---------------------------------------------------------------------------
interface CommoditySpec {
  id: string
  name: string
  category: CommodityCategory
  unit: string
  baseFarmgate: number // RM per unit
  wholesaleMult: number // wholesale / farmgate
  retailMult: number // retail / wholesale
  volatility: number // weekly noise amplitude (fraction)
  seasonalAmp: number // seasonal swing amplitude (fraction)
  trend: number // gentle 2-year drift (fraction total)
  baseVolume: number // tonnes/week national
  transportShare: number // transport cost as fraction of farmgate
  storageShare: number // storage cost as fraction of farmgate
  // Optional engineered supply-chain stress for demonstration alerts.
  stress?: 'chilli-spike' | 'onion-import' | 'fish-monsoon'
}

const COMMODITY_SPECS: CommoditySpec[] = [
  {
    id: 'rice',
    name: 'Rice',
    category: 'Grains',
    unit: 'RM/kg',
    baseFarmgate: 2.6,
    wholesaleMult: 1.12,
    retailMult: 1.18,
    volatility: 0.012,
    seasonalAmp: 0.03,
    trend: 0.06,
    baseVolume: 4200,
    transportShare: 0.06,
    storageShare: 0.05,
  },
  {
    id: 'chicken',
    name: 'Chicken',
    category: 'Poultry',
    unit: 'RM/kg',
    baseFarmgate: 7.1,
    wholesaleMult: 1.14,
    retailMult: 1.22,
    volatility: 0.03,
    seasonalAmp: 0.05,
    trend: 0.04,
    baseVolume: 3100,
    transportShare: 0.05,
    storageShare: 0.06,
  },
  {
    id: 'beef',
    name: 'Beef',
    category: 'Red Meat',
    unit: 'RM/kg',
    baseFarmgate: 26.0,
    wholesaleMult: 1.16,
    retailMult: 1.28,
    volatility: 0.02,
    seasonalAmp: 0.06,
    trend: 0.08,
    baseVolume: 640,
    transportShare: 0.05,
    storageShare: 0.08,
  },
  {
    id: 'fish',
    name: 'Fish',
    category: 'Seafood',
    unit: 'RM/kg',
    baseFarmgate: 11.0,
    wholesaleMult: 1.18,
    retailMult: 1.3,
    volatility: 0.05,
    seasonalAmp: 0.12,
    trend: 0.05,
    baseVolume: 1800,
    transportShare: 0.07,
    storageShare: 0.09,
    stress: 'fish-monsoon',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    category: 'Eggs',
    unit: 'RM/dozen',
    baseFarmgate: 4.5,
    wholesaleMult: 1.13,
    retailMult: 1.2,
    volatility: 0.025,
    seasonalAmp: 0.04,
    trend: 0.05,
    baseVolume: 2600,
    transportShare: 0.05,
    storageShare: 0.05,
  },
  {
    id: 'onions',
    name: 'Onions',
    category: 'Vegetables',
    unit: 'RM/kg',
    baseFarmgate: 3.0,
    wholesaleMult: 1.2,
    retailMult: 1.34,
    volatility: 0.05,
    seasonalAmp: 0.08,
    trend: 0.07,
    baseVolume: 900,
    transportShare: 0.1,
    storageShare: 0.07,
    stress: 'onion-import',
  },
  {
    id: 'garlic',
    name: 'Garlic',
    category: 'Vegetables',
    unit: 'RM/kg',
    baseFarmgate: 7.0,
    wholesaleMult: 1.22,
    retailMult: 1.36,
    volatility: 0.05,
    seasonalAmp: 0.09,
    trend: 0.09,
    baseVolume: 520,
    transportShare: 0.11,
    storageShare: 0.08,
  },
  {
    id: 'chilli',
    name: 'Chilli',
    category: 'Vegetables',
    unit: 'RM/kg',
    baseFarmgate: 8.0,
    wholesaleMult: 1.2,
    retailMult: 1.34,
    volatility: 0.09,
    seasonalAmp: 0.16,
    trend: 0.06,
    baseVolume: 480,
    transportShare: 0.09,
    storageShare: 0.06,
    stress: 'chilli-spike',
  },
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    category: 'Vegetables',
    unit: 'RM/kg',
    baseFarmgate: 3.5,
    wholesaleMult: 1.18,
    retailMult: 1.32,
    volatility: 0.06,
    seasonalAmp: 0.11,
    trend: 0.05,
    baseVolume: 760,
    transportShare: 0.09,
    storageShare: 0.07,
  },
  {
    id: 'leafy',
    name: 'Leafy Vegetables',
    category: 'Vegetables',
    unit: 'RM/kg',
    baseFarmgate: 2.5,
    wholesaleMult: 1.2,
    retailMult: 1.36,
    volatility: 0.07,
    seasonalAmp: 0.14,
    trend: 0.05,
    baseVolume: 1100,
    transportShare: 0.1,
    storageShare: 0.06,
  },
]

export const COMMODITIES: CommodityMeta[] = COMMODITY_SPECS.map((c) => ({
  id: c.id,
  name: c.name,
  category: c.category,
  unit: c.unit,
}))

export const COMMODITY_BY_ID: Record<string, CommodityMeta> = Object.fromEntries(
  COMMODITIES.map((c) => [c.id, c]),
)

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Build the ISO date for the week `weeksAgo` before DATA_AS_OF. */
function weekDate(weeksAgo: number): string {
  const end = new Date(DATA_AS_OF + 'T00:00:00Z')
  end.setUTCDate(end.getUTCDate() - weeksAgo * 7)
  return end.toISOString().slice(0, 10)
}

// Seasonal factor: peaks around monsoon / festive periods for freshness-limited
// commodities. `t` is the week index (0 = oldest).
function seasonal(t: number, amp: number, phase: number): number {
  const yearFrac = (t % 52) / 52
  return 1 + amp * Math.sin(2 * Math.PI * yearFrac + phase)
}

// ---------------------------------------------------------------------------
// Engineered supply-chain stress events.
//
// Real supply shocks are regional, not national, so each event is scoped to
// the regions it plausibly affects. This keeps alert volumes realistic and
// makes the regional map show genuine hotspots rather than uniform colour.
// ---------------------------------------------------------------------------
const STRESS_REGIONS: Record<NonNullable<CommoditySpec['stress']>, Region[]> = {
  // Distribution/margin stress concentrated in the Klang Valley.
  'chilli-spike': ['Central'],
  // Monsoon suppresses east-coast landings.
  'fish-monsoon': ['East Coast'],
  // Import-dependent supply into East Malaysia.
  'onion-import': ['East Malaysia'],
}

function isStressed(spec: CommoditySpec, region: Region): boolean {
  return !!spec.stress && STRESS_REGIONS[spec.stress].includes(region)
}

/** Stress applied at the wholesale stage (drives farm-gate/wholesale divergence). */
function stressWholesale(spec: CommoditySpec, weeksAgo: number, region: Region): number {
  if (!isStressed(spec, region)) return 1
  if (spec.stress === 'chilli-spike') {
    // Wholesale climbs while farm-gate stays flat — the classic signal that
    // the increase originates in distribution, not production.
    if (weeksAgo <= 3) return 1.18
  }
  return 1
}

/** Stress applied at the retail stage. */
function stressRetail(spec: CommoditySpec, weeksAgo: number, region: Region): number {
  if (!isStressed(spec, region)) return 1
  if (spec.stress === 'chilli-spike') {
    // Additional retail margin layered on top of the wholesale increase.
    if (weeksAgo <= 2) return 1.12
    return 1
  }
  if (spec.stress === 'onion-import') {
    // Sustained elevated retail markup over the last ~6 weeks (import supply).
    if (weeksAgo <= 5) return 1.18
    return 1
  }
  if (spec.stress === 'fish-monsoon') {
    // Monsoon landing shortfall lifts retail in the last 4 weeks.
    if (weeksAgo <= 3) return 1.24 - weeksAgo * 0.03
    return 1
  }
  return 1
}

function buildRecords(): PriceRecord[] {
  const records: PriceRecord[] = []

  for (const spec of COMMODITY_SPECS) {
    const phase = (hashSeed(spec.id) % 628) / 100 // stable phase per commodity

    for (const st of STATES) {
      const costMult = STATE_COST_MULT[st.region]
      const rand = mulberry32(hashSeed(spec.id + st.code))
      // Persistent per-state markup character (some states run structurally
      // higher retail markups than others).
      const stateRetailBias = 1 + (rand() - 0.5) * 0.12

      // Generate oldest -> newest so change % can look back.
      const series: {
        farmgate: number
        wholesale: number
        retail: number
      }[] = []

      for (let i = 0; i < WEEKS; i++) {
        const weeksAgo = WEEKS - 1 - i
        const trendFactor = 1 + spec.trend * (i / (WEEKS - 1))
        const seas = seasonal(i, spec.seasonalAmp, phase)

        const fgNoise = 1 + (rand() - 0.5) * spec.volatility * 2
        const farmgate =
          spec.baseFarmgate * costMult * trendFactor * seas * fgNoise

        const wsNoise = 1 + (rand() - 0.5) * spec.volatility
        const wholesale =
          farmgate *
          spec.wholesaleMult *
          wsNoise *
          stressWholesale(spec, weeksAgo, st.region)

        const rtNoise = 1 + (rand() - 0.5) * spec.volatility
        const retail =
          wholesale *
          spec.retailMult *
          stateRetailBias *
          rtNoise *
          stressRetail(spec, weeksAgo, st.region)

        series.push({
          farmgate: round2(farmgate),
          wholesale: round2(wholesale),
          retail: round2(retail),
        })
      }

      // Emit records with change metrics.
      for (let i = 0; i < WEEKS; i++) {
        const weeksAgo = WEEKS - 1 - i
        const cur = series[i]
        const prev = series[i - 1]
        const prevMonth = series[i - 4]
        const weeklyChangePct = prev
          ? ((cur.retail - prev.retail) / prev.retail) * 100
          : 0
        const monthlyChangePct = prevMonth
          ? ((cur.retail - prevMonth.retail) / prevMonth.retail) * 100
          : 0

        const totalMarkup = ((cur.retail - cur.farmgate) / cur.farmgate) * 100
        const alertStatus =
          totalMarkup > 75 || Math.abs(weeklyChangePct) > 9
            ? 'critical'
            : totalMarkup > 55 || Math.abs(weeklyChangePct) > 5
              ? 'monitor'
              : 'normal'

        const volNoise = mulberry32(hashSeed(spec.id + st.code + i))
        const supplyVolume = Math.round(
          (spec.baseVolume / STATES.length) *
            STATE_COST_MULT[st.region] *
            (0.8 + volNoise() * 0.4),
        )

        records.push({
          date: weekDate(weeksAgo),
          commodityId: spec.id,
          commodity: spec.name,
          category: spec.category,
          stateCode: st.code,
          state: st.name,
          district: STATE_DISTRICT[st.code],
          unit: spec.unit,
          farmgate: cur.farmgate,
          wholesale: cur.wholesale,
          retail: cur.retail,
          weeklyChangePct: round2(weeklyChangePct),
          monthlyChangePct: round2(monthlyChangePct),
          supplyVolume,
          transportCost: round2(cur.farmgate * spec.transportShare),
          storageCost: round2(cur.farmgate * spec.storageShare),
          alertStatus,
        })
      }
    }
  }

  return records
}

/** The full weekly price panel (demonstration data). */
export const priceRecords: PriceRecord[] = buildRecords()

/** All distinct week dates present, sorted ascending. */
export const ALL_DATES: string[] = Array.from(
  new Set(priceRecords.map((r) => r.date)),
).sort()
