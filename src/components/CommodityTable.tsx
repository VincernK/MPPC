import { Fragment, useMemo, useState } from 'react'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Download,
  Table2,
  Eye,
} from 'lucide-react'
import { Card, CardHeader } from './ui/Card'
import { SeverityBadge, ChangeBadge } from './ui/Badge'
import { formatRM, formatPct, formatDate, formatNumber } from '../lib/format'
import { MARKUP_THRESHOLDS } from '../lib/calculations'
import type { CommodityAggregate } from '../lib/selectors'

type SortKey =
  | 'commodity'
  | 'category'
  | 'farmgate'
  | 'wholesale'
  | 'retail'
  | 'total'
  | 'weekly'
  | 'alert'

interface Props {
  data: CommodityAggregate[]
  onSelect: (id: string) => void
  onDownloadCsv: () => void
}

const PAGE_SIZE = 6
const SEVERITY_ORDER = { critical: 3, monitor: 2, normal: 1 }

export function CommodityTable({ data, onSelect, onDownloadCsv }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = data.filter(
      (c) =>
        !q ||
        c.commodity.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.highestState.toLowerCase().includes(q),
    )
    const dir = sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      switch (sortKey) {
        case 'commodity':
          return a.commodity.localeCompare(b.commodity) * dir
        case 'category':
          return a.category.localeCompare(b.category) * dir
        case 'farmgate':
          return (a.farmgate - b.farmgate) * dir
        case 'wholesale':
          return (a.wholesale - b.wholesale) * dir
        case 'retail':
          return (a.retail - b.retail) * dir
        case 'total':
          return (a.markup.totalMarkupPct - b.markup.totalMarkupPct) * dir
        case 'weekly':
          return (a.weeklyChangePct - b.weeklyChangePct) * dir
        case 'alert':
          return (SEVERITY_ORDER[a.alertStatus] - SEVERITY_ORDER[b.alertStatus]) * dir
        default:
          return 0
      }
    })
    return rows
  }, [data, query, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'commodity' || key === 'category' ? 'asc' : 'desc')
    }
    setPage(0)
  }

  const SortHeader = ({
    label,
    keyName,
    align = 'left',
  }: {
    label: string
    keyName: SortKey
    align?: 'left' | 'right'
  }) => (
    <th className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => toggleSort(keyName)}
        className={`inline-flex items-center gap-1 font-semibold text-slate-600 transition hover:text-brand-700 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        {label}
        {sortKey === keyName ? (
          sortDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-slate-300" />
        )}
      </button>
    </th>
  )

  return (
    <Card>
      <CardHeader
        title="Commodity price table"
        subtitle="Search, sort, filter and export commodity-level figures"
        icon={<Table2 className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Search commodity, category, state…"
                className="w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <button
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        }
      />

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[880px] text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500">
            <tr>
              <th className="w-8 px-2 py-2.5"></th>
              <SortHeader label="Commodity" keyName="commodity" />
              <SortHeader label="Category" keyName="category" />
              <SortHeader label="Farm-gate" keyName="farmgate" align="right" />
              <SortHeader label="Wholesale" keyName="wholesale" align="right" />
              <SortHeader label="Retail" keyName="retail" align="right" />
              <SortHeader label="Total markup" keyName="total" align="right" />
              <SortHeader label="Weekly Δ" keyName="weekly" align="right" />
              <th className="px-3 py-2.5 text-left font-semibold text-slate-600">
                Highest state
              </th>
              <SortHeader label="Alert" keyName="alert" />
              <th className="px-3 py-2.5 text-left font-semibold text-slate-600">
                Updated
              </th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((c) => {
              const isOpen = expanded === c.commodityId
              const markupCls =
                c.markup.totalMarkupPct >= MARKUP_THRESHOLDS.critical
                  ? 'text-red-600'
                  : c.markup.totalMarkupPct >= MARKUP_THRESHOLDS.monitor
                    ? 'text-amber-600'
                    : 'text-slate-700'
              return (
                <Fragment key={c.commodityId}>
                  <tr className="group transition hover:bg-slate-50/70">
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() =>
                          setExpanded(isOpen ? null : c.commodityId)
                        }
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        aria-label="Expand row"
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">
                      {c.commodity}
                      <span className="ml-1 text-[10px] font-normal text-slate-400">
                        {c.unit.replace('RM/', '/')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{c.category}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {formatRM(c.farmgate)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {formatRM(c.wholesale)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-slate-800">
                      {formatRM(c.retail)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-semibold tabular-nums ${markupCls}`}
                    >
                      {formatPct(c.markup.totalMarkupPct)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ChangeBadge value={c.weeklyChangePct} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{c.highestState}</td>
                    <td className="px-3 py-2.5">
                      <SeverityBadge severity={c.alertStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {formatDate(c.lastUpdated)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => onSelect(c.commodityId)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-brand-700 opacity-0 transition hover:bg-brand-50 group-hover:opacity-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={12} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                          <Detail
                            label="Farm → Wholesale"
                            value={formatPct(c.markup.farmToWholesalePct)}
                          />
                          <Detail
                            label="Wholesale → Retail"
                            value={formatPct(c.markup.wholesaleToRetailPct)}
                          />
                          <Detail
                            label="Price spread"
                            value={formatRM(c.markup.priceSpread)}
                          />
                          <Detail
                            label="Volatility"
                            value={`${c.volatilityPct.toFixed(1)}%`}
                          />
                          <Detail
                            label="Monthly Δ"
                            value={formatPct(c.monthlyChangePct, true)}
                          />
                          <Detail
                            label="Supply volume"
                            value={`${formatNumber(c.supplyVolume)} t`}
                          />
                          <Detail
                            label="Transport cost"
                            value={formatRM(c.transportCost)}
                          />
                          <Detail
                            label="Storage cost"
                            value={formatRM(c.storageCost)}
                          />
                        </div>
                        <button
                          onClick={() => onSelect(c.commodityId)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open full commodity detail
                        </button>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-slate-400">
                  No commodities match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing{' '}
          <span className="font-semibold text-slate-700">
            {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-700">{filtered.length}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 transition hover:border-brand-400 disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-7 w-7 rounded-md border text-center font-medium transition ${
                i === safePage
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-brand-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 transition hover:border-brand-400 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">{value}</p>
    </div>
  )
}
