import type { MarkupBreakdown } from '../types'

// ---------------------------------------------------------------------------
// Core markup calculations. These implement the formulas defined in the
// dashboard specification exactly.
// ---------------------------------------------------------------------------

/** Farm-to-wholesale markup %: ((wholesale − farmgate) / farmgate) × 100 */
export function farmToWholesalePct(farmgate: number, wholesale: number): number {
  if (farmgate <= 0) return 0
  return ((wholesale - farmgate) / farmgate) * 100
}

/** Wholesale-to-retail markup %: ((retail − wholesale) / wholesale) × 100 */
export function wholesaleToRetailPct(wholesale: number, retail: number): number {
  if (wholesale <= 0) return 0
  return ((retail - wholesale) / wholesale) * 100
}

/** Total farm-to-retail markup %: ((retail − farmgate) / farmgate) × 100 */
export function totalMarkupPct(farmgate: number, retail: number): number {
  if (farmgate <= 0) return 0
  return ((retail - farmgate) / farmgate) * 100
}

/** Price spread: retail − farmgate (absolute RM). */
export function priceSpread(farmgate: number, retail: number): number {
  return retail - farmgate
}

export function computeMarkup(
  farmgate: number,
  wholesale: number,
  retail: number,
): MarkupBreakdown {
  return {
    farmgate,
    wholesale,
    retail,
    farmToWholesalePct: farmToWholesalePct(farmgate, wholesale),
    wholesaleToRetailPct: wholesaleToRetailPct(wholesale, retail),
    totalMarkupPct: totalMarkupPct(farmgate, retail),
    priceSpread: priceSpread(farmgate, retail),
  }
}

export const mean = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

/**
 * Volatility as the standard deviation of week-over-week percentage changes
 * of a price series — expressed as a percentage.
 */
export function volatilityPct(series: number[]): number {
  if (series.length < 2) return 0
  const changes: number[] = []
  for (let i = 1; i < series.length; i++) {
    if (series[i - 1] > 0) {
      changes.push(((series[i] - series[i - 1]) / series[i - 1]) * 100)
    }
  }
  if (changes.length === 0) return 0
  const m = mean(changes)
  const variance = mean(changes.map((c) => (c - m) ** 2))
  return Math.sqrt(variance)
}

// Markup severity thresholds (total farm-to-retail markup %).
// Calibrated so typical grains/poultry sit in "normal", structurally
// higher-markup vegetables sit in "monitor", and only genuine anomalies
// (supply shocks, distribution stress) reach "critical".
export const MARKUP_THRESHOLDS = {
  monitor: 55,
  critical: 75,
}

export function markupSeverity(total: number): 'normal' | 'monitor' | 'critical' {
  if (total >= MARKUP_THRESHOLDS.critical) return 'critical'
  if (total >= MARKUP_THRESHOLDS.monitor) return 'monitor'
  return 'normal'
}
