import { Sprout, Warehouse, Store, TrendingUp, BellRing } from 'lucide-react'
import type { KpiSet } from '../lib/selectors'
import { formatPct, formatRM } from '../lib/format'
import { STAGE_COLORS } from '../lib/theme'
import { MARKUP_THRESHOLDS } from '../lib/calculations'

interface KpiCardsProps {
  kpis: KpiSet
  retailWeeklyChange: number
  criticalAlerts: number
  monitorAlerts: number
}

function Trend({ value }: { value: number }) {
  const up = value > 0.05
  const down = value < -0.05
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        up ? 'text-red-600' : down ? 'text-brand-700' : 'text-slate-400'
      }`}
    >
      {up ? '▲' : down ? '▼' : '—'} {Math.abs(value).toFixed(1)}% wk
    </span>
  )
}

export function KpiCards({
  kpis,
  retailWeeklyChange,
  criticalAlerts,
  monitorAlerts,
}: KpiCardsProps) {
  const markupSeverity =
    kpis.totalMarkupPct >= MARKUP_THRESHOLDS.critical
      ? 'critical'
      : kpis.totalMarkupPct >= MARKUP_THRESHOLDS.monitor
        ? 'monitor'
        : 'normal'

  const cards = [
    {
      key: 'farmgate',
      label: 'Avg Farm-gate Price',
      value: formatRM(kpis.avgFarmgate),
      sub: 'Weighted RM per unit',
      icon: <Sprout className="h-5 w-5" />,
      accent: STAGE_COLORS.farmgate,
      tint: 'bg-brand-50',
      footer: <span className="text-xs text-slate-400">Producer price</span>,
    },
    {
      key: 'wholesale',
      label: 'Avg Wholesale Price',
      value: formatRM(kpis.avgWholesale),
      sub: `+${kpis.farmToWholesalePct.toFixed(0)}% vs farm-gate`,
      icon: <Warehouse className="h-5 w-5" />,
      accent: STAGE_COLORS.wholesale,
      tint: 'bg-sky-50',
      footer: <span className="text-xs text-slate-400">Distribution stage</span>,
    },
    {
      key: 'retail',
      label: 'Avg Retail Price',
      value: formatRM(kpis.avgRetail),
      sub: `+${kpis.wholesaleToRetailPct.toFixed(0)}% vs wholesale`,
      icon: <Store className="h-5 w-5" />,
      accent: STAGE_COLORS.retail,
      tint: 'bg-amber-50',
      footer: <Trend value={retailWeeklyChange} />,
    },
    {
      key: 'markup',
      label: 'Farm-to-Retail Markup',
      value: formatPct(kpis.totalMarkupPct),
      sub: `Spread ${formatRM(kpis.priceSpread)}`,
      icon: <TrendingUp className="h-5 w-5" />,
      accent:
        markupSeverity === 'critical'
          ? '#dc2626'
          : markupSeverity === 'monitor'
            ? '#d97706'
            : '#16a34a',
      tint:
        markupSeverity === 'critical'
          ? 'bg-red-50'
          : markupSeverity === 'monitor'
            ? 'bg-amber-50'
            : 'bg-brand-50',
      footer: (
        <span
          className={`text-xs font-semibold ${
            markupSeverity === 'critical'
              ? 'text-red-600'
              : markupSeverity === 'monitor'
                ? 'text-amber-600'
                : 'text-brand-700'
          }`}
        >
          {markupSeverity === 'critical'
            ? 'Above critical threshold'
            : markupSeverity === 'monitor'
              ? 'Above monitor threshold'
              : 'Within normal range'}
        </span>
      ),
    },
    {
      key: 'alerts',
      label: 'Active Price Alerts',
      value: String(criticalAlerts + monitorAlerts),
      sub: `${criticalAlerts} critical · ${monitorAlerts} monitor`,
      icon: <BellRing className="h-5 w-5" />,
      accent: criticalAlerts > 0 ? '#dc2626' : monitorAlerts > 0 ? '#d97706' : '#16a34a',
      tint: criticalAlerts > 0 ? 'bg-red-50' : monitorAlerts > 0 ? 'bg-amber-50' : 'bg-brand-50',
      footer: (
        <span className="text-xs text-slate-400">Across current selection</span>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.key}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <span
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: c.accent }}
          />
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.tint}`}
              style={{ color: c.accent }}
            >
              {c.icon}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
            {c.value}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>
          <div className="mt-3 border-t border-slate-100 pt-2">{c.footer}</div>
        </div>
      ))}
    </div>
  )
}
