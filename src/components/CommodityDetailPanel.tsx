import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { X, Sprout, Warehouse, Store, TriangleAlert, Lightbulb } from 'lucide-react'
import { SeverityBadge } from './ui/Badge'
import { ChartTooltip } from './charts/ChartTooltip'
import { STAGE_COLORS } from '../lib/theme'
import { formatRM, formatPct, formatDateShort } from '../lib/format'
import { mean } from '../lib/calculations'
import { buildVolatilitySeries } from '../lib/selectors'
import type { CommodityAggregate } from '../lib/selectors'
import type { Alert, PriceRecord } from '../types'

interface Props {
  aggregate: CommodityAggregate | null
  records: PriceRecord[] // filtered records (all commodities in selection)
  windowDates: string[]
  alerts: Alert[]
  onClose: () => void
}

export function CommodityDetailPanel({
  aggregate,
  records,
  windowDates,
  alerts,
  onClose,
}: Props) {
  const open = aggregate !== null

  const rows = useMemo(
    () =>
      aggregate ? records.filter((r) => r.commodityId === aggregate.commodityId) : [],
    [records, aggregate],
  )

  // Historical price series (avg across selected states) for this commodity.
  const history = useMemo(() => {
    if (!aggregate) return []
    const byDate = new Map<string, { fg: number[]; ws: number[]; rt: number[] }>()
    for (const r of rows) {
      if (!byDate.has(r.date)) byDate.set(r.date, { fg: [], ws: [], rt: [] })
      const b = byDate.get(r.date)!
      b.fg.push(r.farmgate)
      b.ws.push(r.wholesale)
      b.rt.push(r.retail)
    }
    return windowDates
      .filter((d) => byDate.has(d))
      .map((d) => {
        const b = byDate.get(d)!
        return {
          label: formatDateShort(d),
          farmgate: Number(mean(b.fg).toFixed(2)),
          wholesale: Number(mean(b.ws).toFixed(2)),
          retail: Number(mean(b.rt).toFixed(2)),
        }
      })
  }, [rows, windowDates, aggregate])

  // Regional comparison: latest retail per state for this commodity.
  const regional = useMemo(() => {
    if (!aggregate || windowDates.length === 0) return []
    const latest = windowDates[windowDates.length - 1]
    return rows
      .filter((r) => r.date === latest)
      .map((r) => ({ name: r.state, retail: Number(r.retail.toFixed(2)) }))
      .sort((a, b) => b.retail - a.retail)
      .slice(0, 8)
  }, [rows, windowDates, aggregate])

  const volatility = useMemo(
    () =>
      aggregate
        ? buildVolatilitySeries(records, aggregate.commodityId, windowDates)
        : [],
    [records, windowDates, aggregate],
  )

  const commodityAlerts = aggregate
    ? alerts.filter((a) => a.commodityId === aggregate.commodityId)
    : []

  const bottleneck =
    aggregate &&
    aggregate.markup.wholesaleToRetailPct >= aggregate.markup.farmToWholesalePct
      ? 'wholesale-to-retail'
      : 'farm-to-wholesale'

  const policyResponse = useMemo(() => {
    if (!aggregate) return []
    const out: string[] = []
    if (aggregate.markup.totalMarkupPct >= 65)
      out.push('Investigate intermediary concentration and margin-stacking.')
    if (bottleneck === 'wholesale-to-retail')
      out.push('Increase direct farmer-to-retailer channels to bypass costly intermediaries.')
    else out.push('Review aggregation, transport and storage between farm and wholesale.')
    if (aggregate.volatilityPct >= 4)
      out.push('Monitor possible supply shortages; assess buffer-stock or import timing.')
    if (aggregate.weeklyChangePct >= 4)
      out.push('Conduct targeted market inspections following the recent retail spike.')
    out.push('Improve cold-chain infrastructure to compress the price spread.')
    return out.slice(0, 4)
  }, [aggregate, bottleneck])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[540px] transform overflow-y-auto bg-slate-50 shadow-2xl transition-transform duration-300 scrollbar-thin ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {aggregate && (
          <div className="min-h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {aggregate.commodity}
                  </h2>
                  <SeverityBadge severity={aggregate.alertStatus} />
                </div>
                <p className="text-xs text-slate-500">
                  {aggregate.category} · {aggregate.unit} · updated{' '}
                  {formatDateShort(aggregate.lastUpdated)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Current prices */}
              <div className="grid grid-cols-3 gap-3">
                <PriceStat
                  icon={<Sprout className="h-4 w-4" />}
                  label="Farm-gate"
                  value={formatRM(aggregate.farmgate)}
                  color={STAGE_COLORS.farmgate}
                />
                <PriceStat
                  icon={<Warehouse className="h-4 w-4" />}
                  label="Wholesale"
                  value={formatRM(aggregate.wholesale)}
                  color={STAGE_COLORS.wholesale}
                />
                <PriceStat
                  icon={<Store className="h-4 w-4" />}
                  label="Retail"
                  value={formatRM(aggregate.retail)}
                  color={STAGE_COLORS.retail}
                />
              </div>

              {/* Markup breakdown */}
              <Section title="Markup breakdown">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <MiniStat
                    label="Farm → Wholesale"
                    value={formatPct(aggregate.markup.farmToWholesalePct)}
                    tint="bg-brand-50 text-brand-700"
                  />
                  <MiniStat
                    label="Wholesale → Retail"
                    value={formatPct(aggregate.markup.wholesaleToRetailPct)}
                    tint="bg-amber-50 text-amber-700"
                  />
                  <MiniStat
                    label="Total markup"
                    value={formatPct(aggregate.markup.totalMarkupPct)}
                    tint="bg-slate-100 text-slate-700"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Price spread{' '}
                  <span className="font-semibold text-slate-700">
                    {formatRM(aggregate.markup.priceSpread)}
                  </span>{' '}
                  · volatility{' '}
                  <span className="font-semibold text-slate-700">
                    {aggregate.volatilityPct.toFixed(1)}%
                  </span>{' '}
                  · supply {aggregate.supplyVolume.toLocaleString('en-MY')} t
                </p>
              </Section>

              {/* Historical price chart */}
              <Section title="Historical prices">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={history} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={STAGE_COLORS.retail} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={STAGE_COLORS.retail} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={28} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} tickFormatter={(v) => `${v}`} />
                    <Tooltip content={<ChartTooltip valueFormat="rm" />} />
                    <Area type="monotone" dataKey="farmgate" name="Farm-gate" stroke={STAGE_COLORS.farmgate} fill="transparent" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="wholesale" name="Wholesale" stroke={STAGE_COLORS.wholesale} fill="transparent" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="retail" name="Retail" stroke={STAGE_COLORS.retail} fill="url(#rtGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>

              {/* Regional comparison */}
              <Section title="Regional comparison (retail)">
                <ResponsiveContainer width="100%" height={Math.max(140, regional.length * 26)}>
                  <BarChart layout="vertical" data={regional} margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `RM${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={92} />
                    <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} content={<ChartTooltip valueFormat="rm" />} />
                    <Bar dataKey="retail" name="Retail" fill={STAGE_COLORS.retail} radius={[0, 3, 3, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              {/* Volatility */}
              <Section title="Price volatility (weekly Δ)">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={volatility} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={28} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<ChartTooltip valueFormat="pct" />} />
                    <Bar dataKey="changePct" name="Weekly change" radius={[2, 2, 0, 0]}>
                      {volatility.map((p, i) => (
                        <Cell
                          key={i}
                          fill={
                            p.spike
                              ? '#dc2626'
                              : p.changePct >= 0
                                ? '#0ea5e9'
                                : '#16a34a'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              {/* Bottleneck */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Possible supply-chain bottleneck
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    The largest price increase occurs at the{' '}
                    <span className="font-semibold">{bottleneck}</span> stage
                    {bottleneck === 'wholesale-to-retail'
                      ? ', suggesting margin pressure from distributors or retailers.'
                      : ', suggesting aggregation, transport or storage cost pressure.'}
                  </p>
                </div>
              </div>

              {/* Current alerts */}
              {commodityAlerts.length > 0 && (
                <Section title={`Current alerts (${commodityAlerts.length})`}>
                  <div className="space-y-2">
                    {commodityAlerts.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-slate-200 bg-white p-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            {a.state} · {a.type}
                          </span>
                          <SeverityBadge severity={a.severity} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{a.issue}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Recommended policy response */}
              <div className="rounded-xl border border-brand-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-semibold text-slate-800">
                    Recommended policy response
                  </p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {policyResponse.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

function PriceStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-1 text-base font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

function MiniStat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className={`rounded-lg py-2 ${tint}`}>
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-medium opacity-80">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  )
}
