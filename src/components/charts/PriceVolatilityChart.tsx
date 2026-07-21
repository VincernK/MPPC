import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { ChartTooltip } from './ChartTooltip'
import type { VolatilityPoint } from '../../lib/selectors'
import type { ReactNode } from 'react'

interface Props {
  points: VolatilityPoint[]
  action?: ReactNode
  subtitle: string
}

export function PriceVolatilityChart({ points, action, subtitle }: Props) {
  const spikes = points.filter((p) => p.spike).length

  return (
    <Card>
      <CardHeader
        title="Price volatility"
        subtitle={subtitle}
        icon={<Activity className="h-4 w-4" />}
        action={action}
      />
      <div className="px-3 py-4">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={20}
              height={30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
              width={44}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              content={<ChartTooltip valueFormat="pct" />}
            />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <ReferenceLine
              y={5}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <ReferenceLine
              y={-5}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Bar dataKey="changePct" name="Weekly change" radius={[2, 2, 0, 0]}>
              {points.map((p, i) => (
                <Cell
                  key={i}
                  fill={p.spike ? '#dc2626' : p.changePct >= 0 ? '#0ea5e9' : '#16a34a'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-1 text-center text-xs text-slate-500">
          Dashed lines mark the &plusmn;5% normal range.{' '}
          <span className="font-semibold text-red-600">{spikes}</span> spike
          {spikes === 1 ? '' : 's'} detected in this window.
        </p>
      </div>
    </Card>
  )
}
