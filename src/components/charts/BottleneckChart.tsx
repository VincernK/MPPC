import { useState } from 'react'
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
import { Filter } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { ChartTooltip } from './ChartTooltip'
import { STAGE_COLORS } from '../../lib/theme'
import type { CommodityAggregate } from '../../lib/selectors'

type SortMode = 'total' | 'farmToWholesalePct' | 'wholesaleToRetailPct'

const MODE_LABELS: Record<SortMode, string> = {
  total: 'Total markup',
  farmToWholesalePct: 'Farm → Wholesale',
  wholesaleToRetailPct: 'Wholesale → Retail',
}

interface Props {
  data: CommodityAggregate[]
  onSelect: (commodityId: string) => void
}

export function BottleneckChart({ data, onSelect }: Props) {
  const [mode, setMode] = useState<SortMode>('total')

  const rows = data
    .map((c) => ({
      id: c.commodityId,
      name: c.commodity,
      fw: Number(c.markup.farmToWholesalePct.toFixed(1)),
      wr: Number(c.markup.wholesaleToRetailPct.toFixed(1)),
      total: Number(c.markup.totalMarkupPct.toFixed(1)),
    }))
    .sort((a, b) =>
      mode === 'total'
        ? b.total - a.total
        : mode === 'farmToWholesalePct'
          ? b.fw - a.fw
          : b.wr - a.wr,
    )

  return (
    <Card>
      <CardHeader
        title="Supply-chain bottleneck analysis"
        subtitle="Commodities ranked by markup — where price is added along the chain"
        icon={<Filter className="h-4 w-4" />}
        action={
          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            {(Object.keys(MODE_LABELS) as SortMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs font-medium transition ${
                  mode === m
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        }
      />
      <div className="px-3 py-4">
        <ResponsiveContainer width="100%" height={Math.max(280, rows.length * 34)}>
          <BarChart
            layout="vertical"
            data={rows}
            margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
            barCategoryGap="28%"
            onClick={(state) => {
              const id = (state?.activePayload?.[0]?.payload as { id?: string })?.id
              if (id) onSelect(id)
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#475569' }}
              width={96}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              content={<ChartTooltip valueFormat="pct" />}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} iconType="circle" iconSize={9} />
            <Bar
              dataKey="fw"
              stackId="m"
              name="Farm → Wholesale"
              fill={STAGE_COLORS.farmgate}
              cursor="pointer"
            />
            <Bar
              dataKey="wr"
              stackId="m"
              name="Wholesale → Retail"
              fill={STAGE_COLORS.retail}
              radius={[0, 3, 3, 0]}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
