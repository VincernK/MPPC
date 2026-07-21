import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GitCompareArrows } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { ChartTooltip } from './ChartTooltip'
import { STAGE_COLORS, STAGE_LABELS } from '../../lib/theme'
import type { CommodityAggregate } from '../../lib/selectors'

interface Props {
  data: CommodityAggregate[]
  onSelect: (commodityId: string) => void
}

export function PriceComparisonChart({ data, onSelect }: Props) {
  const chartData = data.map((c) => ({
    id: c.commodityId,
    name: c.commodity,
    farmgate: Number(c.farmgate.toFixed(2)),
    wholesale: Number(c.wholesale.toFixed(2)),
    retail: Number(c.retail.toFixed(2)),
  }))

  return (
    <Card>
      <CardHeader
        title="Supply-chain price comparison"
        subtitle="Farm-gate, wholesale and retail prices by commodity (RM per unit)"
        icon={<GitCompareArrows className="h-4 w-4" />}
      />
      <div className="px-3 py-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            barGap={2}
            barCategoryGap="22%"
            onClick={(state) => {
              const id = (state?.activePayload?.[0]?.payload as { id?: string })?.id
              if (id) onSelect(id)
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              angle={-18}
              textAnchor="end"
              height={54}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `RM${v}`}
              width={54}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              content={<ChartTooltip valueFormat="rm" />}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={9}
            />
            <Bar
              dataKey="farmgate"
              name={STAGE_LABELS.farmgate}
              fill={STAGE_COLORS.farmgate}
              radius={[3, 3, 0, 0]}
              cursor="pointer"
            />
            <Bar
              dataKey="wholesale"
              name={STAGE_LABELS.wholesale}
              fill={STAGE_COLORS.wholesale}
              radius={[3, 3, 0, 0]}
              cursor="pointer"
            />
            <Bar
              dataKey="retail"
              name={STAGE_LABELS.retail}
              fill={STAGE_COLORS.retail}
              radius={[3, 3, 0, 0]}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="px-3 text-center text-xs text-slate-400">
          Tip: click a commodity&rsquo;s bars to open its detailed view.
        </p>
      </div>
    </Card>
  )
}
