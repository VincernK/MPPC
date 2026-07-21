import { useState } from 'react'
import { Map as MapIcon, Info } from 'lucide-react'
import { Card, CardHeader } from './ui/Card'
import { heatColor, HEAT_SCALE } from '../lib/theme'
import type { StateAggregate } from '../lib/selectors'
import { formatRM } from '../lib/format'

type Metric = 'retail' | 'totalMarkupPct' | 'volatilityPct' | 'alerts'

const METRIC_LABELS: Record<Metric, string> = {
  retail: 'Retail price',
  totalMarkupPct: 'Total markup',
  volatilityPct: 'Volatility',
  alerts: 'Active alerts',
}

// Rough geographic grouping so the panel reads like a map of Malaysia.
const PENINSULAR = ['PLS', 'KDH', 'PNG', 'PRK', 'KTN', 'TRG', 'SGR', 'KUL', 'PJY', 'NSN', 'MLK', 'PHG', 'JHR']
const EAST = ['SBH', 'LBN', 'SWK']

interface Props {
  states: StateAggregate[]
  selectedStateCodes: string[]
  onToggleState: (code: string) => void
}

function metricValue(s: StateAggregate, m: Metric): number {
  return m === 'retail'
    ? s.retail
    : m === 'totalMarkupPct'
      ? s.totalMarkupPct
      : m === 'volatilityPct'
        ? s.volatilityPct
        : s.alerts
}

function formatMetric(v: number, m: Metric): string {
  if (m === 'retail') return formatRM(v)
  if (m === 'alerts') return String(v)
  return `${v.toFixed(1)}%`
}

export function RegionalHeatmap({ states, selectedStateCodes, onToggleState }: Props) {
  const [metric, setMetric] = useState<Metric>('retail')

  const active = states.filter((s) => s.retail > 0)
  const values = active.map((s) => metricValue(s, metric))
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const byCode = new Map(states.map((s) => [s.stateCode, s]))

  const renderTile = (code: string) => {
    const s = byCode.get(code)
    if (!s) return null
    const v = metricValue(s, metric)
    const hasData = s.retail > 0
    const bg = hasData ? heatColor(v, min, max) : '#f1f5f9'
    const selected = selectedStateCodes.includes(code)
    const dark = hasData && (v - min) / (max - min || 1) > 0.55
    return (
      <button
        key={code}
        onClick={() => onToggleState(code)}
        title={`${s.state} — ${METRIC_LABELS[metric]}: ${formatMetric(v, metric)}`}
        className={`relative flex flex-col items-start justify-between rounded-lg p-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          selected ? 'ring-2 ring-brand-600 ring-offset-1' : 'hover:ring-2 hover:ring-brand-300'
        }`}
        style={{ backgroundColor: bg, minHeight: 68 }}
      >
        <span className={`text-[11px] font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>
          {s.state}
        </span>
        <span className={`text-sm font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-800'}`}>
          {hasData ? formatMetric(v, metric) : '—'}
        </span>
        {s.alerts > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {s.alerts}
          </span>
        )}
      </button>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Malaysia regional price map"
        subtitle="Colour intensity shows the selected metric by state — click to filter"
        icon={<MapIcon className="h-4 w-4" />}
        action={
          <div className="flex flex-wrap overflow-hidden rounded-lg border border-slate-200">
            {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2.5 py-1 text-xs font-medium transition ${
                  metric === m
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
        }
      />
      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Peninsular Malaysia
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {PENINSULAR.map(renderTile)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              East Malaysia
            </p>
            <div className="grid grid-cols-3 gap-2">{EAST.map(renderTile)}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Low</span>
            <div className="flex h-3 overflow-hidden rounded">
              {HEAT_SCALE.map((c) => (
                <span key={c} className="h-3 w-5" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-slate-500">High</span>
            <span className="ml-1 text-xs font-medium text-slate-600">
              {METRIC_LABELS[metric]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="h-3.5 w-3.5" />
            Red badge = active alerts in that state
          </div>
        </div>
      </div>
    </Card>
  )
}
