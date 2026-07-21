import type { PriceRecord } from '../types'
import type { CommodityAggregate } from './selectors'

function download(filename: string, content: string, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvEscape(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(row.map(csvEscape).join(','))
  return lines.join('\n')
}

/** Export the current commodity summary table. */
export function exportCommoditySummaryCsv(data: CommodityAggregate[]) {
  const headers = [
    'Commodity',
    'Category',
    'Unit',
    'Farm-gate (RM)',
    'Wholesale (RM)',
    'Retail (RM)',
    'Farm-to-Wholesale %',
    'Wholesale-to-Retail %',
    'Total Markup %',
    'Price Spread (RM)',
    'Weekly Change %',
    'Monthly Change %',
    'Volatility %',
    'Highest-price State',
    'Supply Volume (t)',
    'Alert Status',
    'Last Updated',
  ]
  const rows = data.map((c) => [
    c.commodity,
    c.category,
    c.unit,
    c.farmgate.toFixed(2),
    c.wholesale.toFixed(2),
    c.retail.toFixed(2),
    c.markup.farmToWholesalePct.toFixed(1),
    c.markup.wholesaleToRetailPct.toFixed(1),
    c.markup.totalMarkupPct.toFixed(1),
    c.markup.priceSpread.toFixed(2),
    c.weeklyChangePct.toFixed(1),
    c.monthlyChangePct.toFixed(1),
    c.volatilityPct.toFixed(1),
    c.highestState,
    c.supplyVolume,
    c.alertStatus,
    c.lastUpdated,
  ])
  download(`food-price-commodity-summary-${today()}.csv`, toCsv(headers, rows))
}

/** Export the underlying filtered price records (raw panel). */
export function exportRecordsCsv(records: PriceRecord[]) {
  const headers = [
    'Date',
    'Commodity',
    'Category',
    'State',
    'District',
    'Unit',
    'Farm-gate',
    'Wholesale',
    'Retail',
    'Weekly Change %',
    'Monthly Change %',
    'Supply Volume (t)',
    'Transport Cost',
    'Storage Cost',
    'Alert Status',
  ]
  const rows = records.map((r) => [
    r.date,
    r.commodity,
    r.category,
    r.state,
    r.district,
    r.unit,
    r.farmgate,
    r.wholesale,
    r.retail,
    r.weeklyChangePct,
    r.monthlyChangePct,
    r.supplyVolume,
    r.transportCost,
    r.storageCost,
    r.alertStatus,
  ])
  download(`food-price-records-${today()}.csv`, toCsv(headers, rows))
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
