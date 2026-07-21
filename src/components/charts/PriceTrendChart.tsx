import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart as LineIcon } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { ChartTooltip } from './ChartTooltip'
import { STAGE_COLORS, STAGE_LABELS } from '../../lib/theme'
import type { TrendPoint } from '../../lib/selectors'
import type { TimeGranularity } from '../../types'

interface Props {
  data: TrendPoint[]
  granularity: TimeGranularity
  onGranularityChange: (g: TimeGranularity) => void
}

const GRANULARITIES: TimeGranularity[] = ['weekly', 'monthly', 'yearly']

export function PriceTrendChart({ data, granularity, onGranularityChange }: Props) {
  // A single bucket (e.g. "yearly" over a 6-month range) has no line to draw,
  // so show markers and tell the user how to get a meaningful trend.
  const sparse = data.length < 2
  const showDots = data.length <= 14

  return (
    <Card>
      <CardHeader
        title="Price trend over time"
        subtitle="Average price movement across the supply chain for the current selection"
        icon={<LineIcon className="h-4 w-4" />}
        action={
          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                onClick={() => onGranularityChange(g)}
                className={`px-2.5 py-1 text-xs font-medium capitalize transition ${
                  granularity === g
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        }
      />
      <div className="px-3 py-4">
        {sparse && (
          <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The selected date range covers only one {granularity.replace('ly', '')}{' '}
            period. Widen the date range to see a {granularity} trend.
          </div>
        )}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={24}
              height={30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `RM${v}`}
              width={54}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<ChartTooltip valueFormat="rm" />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="plainline"
            />
            <Line
              type="monotone"
              dataKey="farmgate"
              name={STAGE_LABELS.farmgate}
              stroke={STAGE_COLORS.farmgate}
              strokeWidth={2}
              dot={showDots ? { r: 3 } : false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="wholesale"
              name={STAGE_LABELS.wholesale}
              stroke={STAGE_COLORS.wholesale}
              strokeWidth={2}
              dot={showDots ? { r: 3 } : false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="retail"
              name={STAGE_LABELS.retail}
              stroke={STAGE_COLORS.retail}
              strokeWidth={2}
              dot={showDots ? { r: 3 } : false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
