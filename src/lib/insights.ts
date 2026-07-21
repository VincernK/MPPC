import type { PolicyInsight } from '../types'
import type { CommodityAggregate, StateAggregate } from './selectors'

// ---------------------------------------------------------------------------
// Evidence-based policy insight generation. Insights are derived purely from
// the currently displayed aggregates so they always reflect the active filters.
// ---------------------------------------------------------------------------

export function generateInsights(
  commodityAggregates: CommodityAggregate[],
  stateAggregates: StateAggregate[],
): PolicyInsight[] {
  const insights: PolicyInsight[] = []
  if (commodityAggregates.length === 0) return insights

  // 1. Where is markup concentrated — wholesale-to-retail vs farm-to-wholesale?
  const avgFW =
    commodityAggregates.reduce((a, c) => a + c.markup.farmToWholesalePct, 0) /
    commodityAggregates.length
  const avgWR =
    commodityAggregates.reduce((a, c) => a + c.markup.wholesaleToRetailPct, 0) /
    commodityAggregates.length
  if (avgWR > avgFW * 1.15) {
    insights.push({
      id: 'markup-stage',
      title: 'Markups concentrated at the wholesale-to-retail stage',
      detail: `Across selected commodities, retail-stage markup averages ${avgWR.toFixed(0)}% versus ${avgFW.toFixed(0)}% at the wholesale stage.`,
      recommendation:
        'Investigate intermediary concentration and increase direct farmer-to-retailer channels.',
      severity: avgWR > 40 ? 'critical' : 'monitor',
    })
  } else if (avgFW > avgWR * 1.15) {
    insights.push({
      id: 'markup-stage',
      title: 'Markups concentrated at the farm-to-wholesale stage',
      detail: `Wholesale-stage markup averages ${avgFW.toFixed(0)}% versus ${avgWR.toFixed(0)}% at retail.`,
      recommendation:
        'Review aggregation, transport and storage costs between farm and wholesale markets.',
      severity: avgFW > 30 ? 'monitor' : 'normal',
    })
  }

  // 2. Stable farm-gate but rising retail — a classic divergence signal.
  const divergent = commodityAggregates
    .filter((c) => c.weeklyChangePct >= 4 && c.markup.totalMarkupPct >= 45)
    .sort((a, b) => b.weeklyChangePct - a.weeklyChangePct)[0]
  if (divergent) {
    insights.push({
      id: 'divergence',
      title: `Farm-gate stable despite sharp retail rise in ${divergent.commodity}`,
      detail: `${divergent.commodity} retail rose ${divergent.weeklyChangePct.toFixed(1)}% week-on-week with a total markup of ${divergent.markup.totalMarkupPct.toFixed(0)}%.`,
      recommendation:
        'Conduct targeted market inspections and review wholesale distribution and transport costs.',
      severity: 'critical',
    })
  }

  // 3. Regional dispersion — states well above the national average.
  const active = stateAggregates.filter((s) => s.retail > 0)
  const aboveNational = active
    .filter((s) => s.vsNationalPct >= 8)
    .sort((a, b) => b.vsNationalPct - a.vsNationalPct)
  if (aboveNational.length > 0) {
    const top = aboveNational[0]
    const regions = Array.from(new Set(aboveNational.slice(0, 3).map((s) => s.region)))
    insights.push({
      id: 'regional',
      title: `${top.region} retail prices above the national average`,
      detail: `${top.state} is ${top.vsNationalPct.toFixed(0)}% above the national average retail price. Elevated regions: ${regions.join(', ')}.`,
      recommendation:
        'Review logistics and transport costs and improve cold-chain infrastructure in affected regions.',
      severity: top.vsNationalPct >= 15 ? 'critical' : 'monitor',
    })
  }

  // 4. Volatility — commodities with unusually unstable prices.
  const volatile = commodityAggregates
    .filter((c) => c.volatilityPct >= 4)
    .sort((a, b) => b.volatilityPct - a.volatilityPct)[0]
  if (volatile) {
    insights.push({
      id: 'volatility',
      title: `${volatile.commodity} shows elevated price volatility`,
      detail: `Weekly price volatility for ${volatile.commodity} is ${volatile.volatilityPct.toFixed(1)}%, above the normal range.`,
      recommendation:
        'Monitor possible supply shortages and assess buffer-stock or import-timing responses.',
      severity: volatile.volatilityPct >= 6 ? 'critical' : 'monitor',
    })
  }

  // 5. Transport/storage cost pressure.
  const costPressured = commodityAggregates
    .map((c) => ({
      c,
      share: (c.transportCost + c.storageCost) / Math.max(c.farmgate, 0.01),
    }))
    .filter((x) => x.share >= 0.16)
    .sort((a, b) => b.share - a.share)[0]
  if (costPressured) {
    insights.push({
      id: 'logistics',
      title: 'Transport and storage costs may be widening price spreads',
      detail: `${costPressured.c.commodity} carries transport + storage costs equal to ${(costPressured.share * 100).toFixed(0)}% of its farm-gate price.`,
      recommendation:
        'Improve cold-chain infrastructure and review logistics costs to compress the price spread.',
      severity: 'monitor',
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'stable',
      title: 'Prices and markups within normal ranges',
      detail:
        'No unusual markups, regional gaps or volatility detected across the current selection.',
      recommendation: 'Maintain routine market surveillance.',
      severity: 'normal',
    })
  }

  return insights
}
