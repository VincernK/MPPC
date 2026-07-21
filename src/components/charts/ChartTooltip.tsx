import type { TooltipProps } from 'recharts'
import { formatRM, formatPct } from '../../lib/format'

type ValueFormat = 'rm' | 'pct' | 'raw'

interface Props extends TooltipProps<number, string> {
  valueFormat?: ValueFormat
  unit?: string
}

export function ChartTooltip({ active, payload, label, valueFormat = 'rm', unit }: Props) {
  if (!active || !payload || payload.length === 0) return null

  const fmt = (v: number) =>
    valueFormat === 'rm'
      ? formatRM(v, unit)
      : valueFormat === 'pct'
        ? formatPct(v, true)
        : v.toLocaleString('en-MY')

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-slate-700">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-800">
              {fmt(p.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
