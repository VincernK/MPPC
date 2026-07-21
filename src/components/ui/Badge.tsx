import type { AlertSeverity } from '../../types'
import { SEVERITY_BG, SEVERITY_LABEL } from '../../lib/theme'

export function SeverityBadge({
  severity,
  showDot = true,
}: {
  severity: AlertSeverity
  showDot?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_BG[severity]}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            severity === 'critical'
              ? 'bg-red-500'
              : severity === 'monitor'
                ? 'bg-amber-500'
                : 'bg-brand-500'
          }`}
        />
      )}
      {SEVERITY_LABEL[severity]}
    </span>
  )
}

export function ChangeBadge({ value }: { value: number }) {
  const up = value > 0.05
  const down = value < -0.05
  const cls = up
    ? 'text-red-600 bg-red-50'
    : down
      ? 'text-brand-700 bg-brand-50'
      : 'text-slate-500 bg-slate-100'
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums ${cls}`}
    >
      {up ? '▲' : down ? '▼' : '—'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}
