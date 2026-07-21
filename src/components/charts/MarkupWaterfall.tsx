import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Layers } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { STAGE_COLORS } from '../../lib/theme'
import { formatRM, formatPct } from '../../lib/format'
import {
  farmToWholesalePct,
  wholesaleToRetailPct,
  totalMarkupPct,
} from '../../lib/calculations'

interface Props {
  farmgate: number
  wholesale: number
  retail: number
  label: string
}

interface Step {
  name: string
  base: number
  value: number
  fill: string
  cumulative: number
  delta: number
  pct: number
}

function WaterfallTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: Step }[]
}) {
  if (!active || !payload || !payload.length) return null
  const s = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-700">{s.name}</p>
      <p className="mt-1 text-slate-600">
        Stage value:{' '}
        <span className="font-semibold text-slate-800">{formatRM(s.delta)}</span>
      </p>
      <p className="text-slate-600">
        Cumulative:{' '}
        <span className="font-semibold text-slate-800">{formatRM(s.cumulative)}</span>
      </p>
      {s.pct > 0 && (
        <p className="text-slate-600">
          Markup added:{' '}
          <span className="font-semibold text-slate-800">{formatPct(s.pct)}</span>
        </p>
      )}
    </div>
  )
}

export function MarkupWaterfall({ farmgate, wholesale, retail, label }: Props) {
  const fwPct = farmToWholesalePct(farmgate, wholesale)
  const wrPct = wholesaleToRetailPct(wholesale, retail)
  const totalPct = totalMarkupPct(farmgate, retail)

  const steps: Step[] = [
    {
      name: 'Farm-gate',
      base: 0,
      value: farmgate,
      fill: STAGE_COLORS.farmgate,
      cumulative: farmgate,
      delta: farmgate,
      pct: 0,
    },
    {
      name: 'Wholesale markup',
      base: farmgate,
      value: wholesale - farmgate,
      fill: STAGE_COLORS.wholesale,
      cumulative: wholesale,
      delta: wholesale - farmgate,
      pct: fwPct,
    },
    {
      name: 'Retail markup',
      base: wholesale,
      value: retail - wholesale,
      fill: STAGE_COLORS.retail,
      cumulative: retail,
      delta: retail - wholesale,
      pct: wrPct,
    },
    {
      name: 'Retail price',
      base: 0,
      value: retail,
      fill: '#475569',
      cumulative: retail,
      delta: retail,
      pct: 0,
    },
  ]

  const biggest = wrPct >= fwPct ? 'wholesale-to-retail' : 'farm-to-wholesale'

  return (
    <Card>
      <CardHeader
        title="Markup waterfall"
        subtitle={`How ${label} builds from farm-gate to retail`}
        icon={<Layers className="h-4 w-4" />}
        action={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Total markup {formatPct(totalPct)}
          </span>
        }
      />
      <div className="px-3 py-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={steps} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={0}
              height={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `RM${v}`}
              width={54}
            />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} content={<WaterfallTooltip />} />
            <Bar dataKey="base" stackId="w" fill="transparent" />
            <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]}>
              {steps.map((s, i) => (
                <Cell key={i} fill={s.fill} />
              ))}
              <LabelList
                dataKey="delta"
                position="top"
                formatter={(v: number) => formatRM(v)}
                style={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 grid grid-cols-3 gap-2 px-2 text-center text-xs">
          <div className="rounded-lg bg-brand-50 py-2">
            <p className="font-semibold text-brand-700">{formatPct(fwPct)}</p>
            <p className="text-slate-500">Farm → Wholesale</p>
          </div>
          <div className="rounded-lg bg-amber-50 py-2">
            <p className="font-semibold text-amber-700">{formatPct(wrPct)}</p>
            <p className="text-slate-500">Wholesale → Retail</p>
          </div>
          <div className="rounded-lg bg-slate-100 py-2">
            <p className="font-semibold text-slate-700">{formatPct(totalPct)}</p>
            <p className="text-slate-500">Total markup</p>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Largest price increase at the{' '}
          <span className="font-semibold text-slate-700">{biggest}</span> stage.
        </p>
      </div>
    </Card>
  )
}
