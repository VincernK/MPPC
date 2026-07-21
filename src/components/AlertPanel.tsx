import { Bell, ArrowRight, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from './ui/Card'
import { SeverityBadge } from './ui/Badge'
import { SEVERITY_COLORS } from '../lib/theme'
import { formatDate } from '../lib/format'
import type { Alert } from '../types'

interface Props {
  alerts: Alert[]
  counts: { critical: number; monitor: number; normal: number }
  onSelectCommodity: (id: string) => void
}

export function AlertPanel({ alerts, counts, onSelectCommodity }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Price-alert system"
        subtitle="Automated surveillance across the current selection"
        icon={<Bell className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
              {counts.critical} critical
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              {counts.monitor} monitor
            </span>
          </div>
        }
      />

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4 scrollbar-thin" style={{ maxHeight: 520 }}>
        {alerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">All clear</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              No monitor or critical alerts for the current commodity, region and
              severity selection.
            </p>
          </div>
        ) : (
          alerts.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectCommodity(a.commodityId)}
              className="group block w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-brand-300 hover:bg-slate-50"
              style={{ borderLeft: `3px solid ${SEVERITY_COLORS[a.severity]}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {a.commodity}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-500">{a.state}</span>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
              <p className="mt-1 text-xs font-medium text-slate-600">{a.type}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{a.issue}</p>
              <div className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                  Recommended action
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{a.recommendedAction}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Detected {formatDate(a.detectedDate)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
                  View commodity <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  )
}
