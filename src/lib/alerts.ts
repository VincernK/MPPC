import type { Alert, AlertSeverity, PriceRecord } from '../types'
import { MARKUP_THRESHOLDS, totalMarkupPct } from './calculations'

// ---------------------------------------------------------------------------
// Alert engine. Generates policy-relevant alerts from the price panel using
// the rules defined in the dashboard specification.
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 3,
  monitor: 2,
  normal: 1,
}

function highest(a: AlertSeverity, b: AlertSeverity): AlertSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b
}

interface SeriesKey {
  farmgate: number[]
  wholesale: number[]
  retail: number[]
}

/**
 * Generate alerts for the latest observation of each commodity/state pair.
 * `records` should already be limited to the active window; `windowDates`
 * are the ordered dates in that window.
 */
export function generateAlerts(
  records: PriceRecord[],
  windowDates: string[],
  nationalRetailByCommodity: Map<string, number>,
): Alert[] {
  const latestDate = windowDates[windowDates.length - 1]

  // Build ordered series per commodity+state to reason about recent movement.
  const seriesMap = new Map<string, SeriesKey>()
  const indexByDate = new Map(windowDates.map((d, i) => [d, i]))

  for (const r of records) {
    const key = r.commodityId + '|' + r.stateCode
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        farmgate: new Array(windowDates.length).fill(NaN),
        wholesale: new Array(windowDates.length).fill(NaN),
        retail: new Array(windowDates.length).fill(NaN),
      })
    }
    const idx = indexByDate.get(r.date)
    if (idx === undefined) continue
    const s = seriesMap.get(key)!
    s.farmgate[idx] = r.farmgate
    s.wholesale[idx] = r.wholesale
    s.retail[idx] = r.retail
  }

  const alerts: Alert[] = []
  const latestRows = records.filter((r) => r.date === latestDate)

  for (const r of latestRows) {
    const key = r.commodityId + '|' + r.stateCode
    const s = seriesMap.get(key)
    if (!s) continue
    const n = windowDates.length
    const lastRetail = r.retail
    const wk1Retail = s.retail[n - 2]
    const wk4Retail = s.retail[n - 5]
    const wk4Farm = s.farmgate[n - 5]
    const wk4Whole = s.wholesale[n - 5]

    const retailChange4wk =
      isFinite(wk4Retail) && wk4Retail > 0
        ? ((lastRetail - wk4Retail) / wk4Retail) * 100
        : 0
    const retailChange1wk =
      isFinite(wk1Retail) && wk1Retail > 0
        ? ((lastRetail - wk1Retail) / wk1Retail) * 100
        : 0
    const farmChange4wk =
      isFinite(wk4Farm) && wk4Farm > 0
        ? ((r.farmgate - wk4Farm) / wk4Farm) * 100
        : 0
    const wholeChange4wk =
      isFinite(wk4Whole) && wk4Whole > 0
        ? ((r.wholesale - wk4Whole) / wk4Whole) * 100
        : 0

    const markup = totalMarkupPct(r.farmgate, r.retail)
    const national = nationalRetailByCommodity.get(r.commodityId) ?? lastRetail
    const vsNational = national > 0 ? ((lastRetail - national) / national) * 100 : 0

    // Each rule contributes a candidate reason with its own severity. The
    // emitted alert takes the maximum severity, and its message is drawn from
    // the highest-priority reason *at that severity* — so the displayed reason
    // always justifies the shown severity (no "1% rise" flagged as critical).
    const reasons: {
      severity: AlertSeverity
      priority: number
      type: string
      issue: string
      action: string
    }[] = []

    // Rule 1 — excessive total markup.
    if (markup >= MARKUP_THRESHOLDS.critical) {
      reasons.push({
        severity: 'critical',
        priority: 2,
        type: 'Excessive markup',
        issue: `Total farm-to-retail markup is ${markup.toFixed(0)}%, above the ${MARKUP_THRESHOLDS.critical}% critical threshold.`,
        action: 'Investigate intermediary concentration and margin-stacking along the chain.',
      })
    } else if (markup >= MARKUP_THRESHOLDS.monitor) {
      reasons.push({
        severity: 'monitor',
        priority: 2,
        type: 'Elevated markup',
        issue: `Total farm-to-retail markup is ${markup.toFixed(0)}%, above the ${MARKUP_THRESHOLDS.monitor}% monitoring threshold.`,
        action: 'Review distribution margins and monitor for further increases.',
      })
    }

    // Rule 2 — sharp short-term retail rise (distinguish a one-week spike from
    // a sustained multi-week climb so the wording matches the trigger).
    if (retailChange1wk >= 8) {
      // Only cite the 4-week figure when it corroborates the weekly jump;
      // a negative 4-week move alongside a spike reads as a rebound, not a trend.
      const context =
        retailChange4wk >= 0
          ? ` (${retailChange4wk.toFixed(0)}% over 4 weeks).`
          : `, partially reversing a decline over the preceding weeks.`
      reasons.push({
        severity: retailChange1wk >= 12 ? 'critical' : 'monitor',
        priority: 4,
        type: 'Sharp retail increase',
        issue: `Retail price jumped ${retailChange1wk.toFixed(0)}% in a single week${context}`,
        action: 'Conduct targeted market inspections and verify against supply availability.',
      })
    } else if (retailChange4wk >= 15) {
      reasons.push({
        severity: retailChange4wk >= 22 ? 'critical' : 'monitor',
        priority: 3,
        type: 'Sustained retail increase',
        issue: `Retail price climbed ${retailChange4wk.toFixed(0)}% over the past 4 weeks.`,
        action: 'Review supply availability and distribution margins driving the sustained rise.',
      })
    }

    // Rule 3 — wholesale rising without matching farm-gate move.
    if (wholeChange4wk - farmChange4wk >= 8 && wholeChange4wk >= 8) {
      reasons.push({
        severity: 'critical',
        priority: 5,
        type: 'Wholesale–farmgate divergence',
        issue: `Wholesale rose ${wholeChange4wk.toFixed(0)}% over 4 weeks while farm-gate moved only ${farmChange4wk.toFixed(0)}%.`,
        action: 'Investigate wholesale distribution, transport and intermediary costs.',
      })
    }

    // Rule 4 — region priced well above national average.
    if (vsNational >= 12) {
      reasons.push({
        severity: vsNational >= 20 ? 'critical' : 'monitor',
        priority: 1,
        type: 'Regional price gap',
        issue: `${r.state} retail price is ${vsNational.toFixed(0)}% above the national average for ${r.commodity}.`,
        action: 'Review logistics and cold-chain costs; assess supply routing to this region.',
      })
    }

    if (reasons.length === 0) continue

    const severity = reasons.reduce<AlertSeverity>(
      (acc, rr) => highest(acc, rr.severity),
      'normal',
    )
    // Prefer the most specific reason that justifies the emitted severity.
    const chosen = reasons
      .filter((rr) => rr.severity === severity)
      .sort((a, b) => b.priority - a.priority)[0]

    alerts.push({
      id: `${r.commodityId}-${r.stateCode}`,
      commodityId: r.commodityId,
      commodity: r.commodity,
      stateCode: r.stateCode,
      state: r.state,
      type: chosen.type,
      severity,
      issue: chosen.issue,
      recommendedAction: chosen.action,
      detectedDate: latestDate,
    })
  }

  // Most severe, then largest markup first.
  alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  return alerts
}
