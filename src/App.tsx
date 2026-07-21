import { useEffect, useMemo, useRef, useState } from 'react'
import { priceRecords } from './data/commodities'
import type { AlertSeverity, Filters } from './types'
import { deriveDashboard } from './lib/selectors'
import { generateAlerts } from './lib/alerts'
import { generateInsights } from './lib/insights'
import { exportCommoditySummaryCsv, exportRecordsCsv } from './lib/export'
import { mean } from './lib/calculations'

import { Sidebar, NAV_ITEMS } from './components/Sidebar'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { KpiCards } from './components/KpiCards'
import { PriceComparisonChart } from './components/charts/PriceComparisonChart'
import { PriceTrendChart } from './components/charts/PriceTrendChart'
import { MarkupWaterfall } from './components/charts/MarkupWaterfall'
import { BottleneckChart } from './components/charts/BottleneckChart'
import { PriceVolatilityChart } from './components/charts/PriceVolatilityChart'
import { RegionalHeatmap } from './components/RegionalHeatmap'
import { AlertPanel } from './components/AlertPanel'
import { CommodityTable } from './components/CommodityTable'
import { CommodityDetailPanel } from './components/CommodityDetailPanel'
import { PolicyInsightPanel } from './components/PolicyInsightPanel'
import { buildVolatilitySeries } from './lib/selectors'

const DEFAULT_FILTERS: Filters = {
  commodityIds: [],
  stateCodes: [],
  granularity: 'weekly',
  dateRangeWeeks: 26,
  severities: ['critical', 'monitor', 'normal'],
}

const SECTION_IDS = NAV_ITEMS.map((n) => n.id)

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedCommodityId, setSelectedCommodityId] = useState<string | null>(null)
  const [focusCommodityId, setFocusCommodityId] = useState<string | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const updateFilters = (next: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...next }))

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const isDefault = useMemo(
    () =>
      filters.commodityIds.length === 0 &&
      filters.stateCodes.length === 0 &&
      filters.granularity === 'weekly' &&
      filters.dateRangeWeeks === 26 &&
      filters.severities.length === 3,
    [filters],
  )

  // --- Derived dashboard model (recomputed whenever filters change).
  const derived = useMemo(() => deriveDashboard(priceRecords, filters), [filters])

  // National retail per commodity (all states) at the latest date — used by
  // the alert engine to flag regions above the national average.
  const nationalRetailByCommodity = useMemo(() => {
    const latest = derived.latestDate
    const byCommodity = new Map<string, number[]>()
    for (const r of priceRecords) {
      if (r.date !== latest) continue
      if (!byCommodity.has(r.commodityId)) byCommodity.set(r.commodityId, [])
      byCommodity.get(r.commodityId)!.push(r.retail)
    }
    const out = new Map<string, number>()
    for (const [id, arr] of byCommodity) out.set(id, mean(arr))
    return out
  }, [derived.latestDate])

  const allAlerts = useMemo(
    () =>
      generateAlerts(
        derived.filteredRecords,
        derived.windowDates,
        nationalRetailByCommodity,
      ),
    [derived.filteredRecords, derived.windowDates, nationalRetailByCommodity],
  )

  const activeSeverities: AlertSeverity[] =
    filters.severities.length > 0 ? filters.severities : ['critical', 'monitor', 'normal']

  const visibleAlerts = useMemo(
    () => allAlerts.filter((a) => activeSeverities.includes(a.severity)),
    [allAlerts, activeSeverities],
  )

  const alertCounts = useMemo(
    () => ({
      critical: allAlerts.filter((a) => a.severity === 'critical').length,
      monitor: allAlerts.filter((a) => a.severity === 'monitor').length,
      normal: 0,
    }),
    [allAlerts],
  )

  const insights = useMemo(
    () => generateInsights(derived.commodityAggregates, derived.stateAggregates),
    [derived.commodityAggregates, derived.stateAggregates],
  )

  const retailWeeklyChange = useMemo(
    () => mean(derived.commodityAggregates.map((c) => c.weeklyChangePct)),
    [derived.commodityAggregates],
  )

  // --- Focus commodity for the waterfall & volatility charts.
  const focusAggregate = useMemo(() => {
    const aggs = derived.commodityAggregates
    if (aggs.length === 0) return null
    const found = aggs.find((a) => a.commodityId === focusCommodityId)
    if (found) return found
    // Default: highest total markup.
    return [...aggs].sort(
      (a, b) => b.markup.totalMarkupPct - a.markup.totalMarkupPct,
    )[0]
  }, [derived.commodityAggregates, focusCommodityId])

  const focusVolatility = useMemo(
    () =>
      focusAggregate
        ? buildVolatilitySeries(
            derived.filteredRecords,
            focusAggregate.commodityId,
            derived.windowDates,
          )
        : [],
    [derived.filteredRecords, derived.windowDates, focusAggregate],
  )

  const selectedAggregate = useMemo(
    () =>
      derived.commodityAggregates.find(
        (c) => c.commodityId === selectedCommodityId,
      ) ?? null,
    [derived.commodityAggregates, selectedCommodityId],
  )

  // --- Scroll navigation + scroll-spy.
  const scrollTo = (id: string) => {
    setActiveSection(id)
    setMobileNav(false)
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    )
    SECTION_IDS.forEach((id) => {
      const el = sectionRefs.current[id]
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  const focusSelect = focusAggregate && (
    <select
      value={focusAggregate.commodityId}
      onChange={(e) => setFocusCommodityId(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
    >
      {derived.commodityAggregates.map((c) => (
        <option key={c.commodityId} value={c.commodityId}>
          {c.commodity}
        </option>
      ))}
    </select>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        active={activeSection}
        onNavigate={scrollTo}
        alertCount={alertCounts.critical + alertCounts.monitor}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />

      <div className="lg:pl-64">
        <Header
          lastUpdated={derived.latestDate}
          onExportReport={() => window.print()}
          onOpenMobile={() => setMobileNav(true)}
        />

        <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6 md:px-8">
          <FilterBar
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            onExportData={() => exportRecordsCsv(derived.filteredRecords)}
            isDefault={isDefault}
          />

          {/* Overview */}
          <section
            id="overview"
            ref={setSectionRef('overview')}
            className="scroll-mt-24 space-y-6"
          >
            <KpiCards
              kpis={derived.kpis}
              retailWeeklyChange={retailWeeklyChange}
              criticalAlerts={alertCounts.critical}
              monitorAlerts={alertCounts.monitor}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <PriceComparisonChart
                data={derived.commodityAggregates}
                onSelect={setSelectedCommodityId}
              />
              <PriceTrendChart
                data={derived.trend}
                granularity={filters.granularity}
                onGranularityChange={(g) => updateFilters({ granularity: g })}
              />
            </div>
          </section>

          {/* Supply chain */}
          <section
            id="supply-chain"
            ref={setSectionRef('supply-chain')}
            className="scroll-mt-24 space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {focusAggregate && (
                <MarkupWaterfall
                  farmgate={focusAggregate.farmgate}
                  wholesale={focusAggregate.wholesale}
                  retail={focusAggregate.retail}
                  label={focusAggregate.commodity}
                />
              )}
              <BottleneckChart
                data={derived.commodityAggregates}
                onSelect={setSelectedCommodityId}
              />
            </div>
            <PriceVolatilityChart
              points={focusVolatility}
              action={focusSelect}
              subtitle={
                focusAggregate
                  ? `Week-on-week retail price change for ${focusAggregate.commodity}`
                  : 'Week-on-week retail price change'
              }
            />
          </section>

          {/* Regional + alerts */}
          <section
            id="regional"
            ref={setSectionRef('regional')}
            className="scroll-mt-24"
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <RegionalHeatmap
                  states={derived.stateAggregates}
                  selectedStateCodes={filters.stateCodes}
                  onToggleState={(code) =>
                    updateFilters({
                      stateCodes: filters.stateCodes.includes(code)
                        ? filters.stateCodes.filter((c) => c !== code)
                        : [...filters.stateCodes, code],
                    })
                  }
                />
              </div>
              <div id="alerts" ref={setSectionRef('alerts')} className="scroll-mt-24">
                <AlertPanel
                  alerts={visibleAlerts}
                  counts={alertCounts}
                  onSelectCommodity={setSelectedCommodityId}
                />
              </div>
            </div>
          </section>

          {/* Commodities */}
          <section
            id="commodities"
            ref={setSectionRef('commodities')}
            className="scroll-mt-24"
          >
            <CommodityTable
              data={derived.commodityAggregates}
              onSelect={setSelectedCommodityId}
              onDownloadCsv={() =>
                exportCommoditySummaryCsv(derived.commodityAggregates)
              }
            />
          </section>

          {/* Insights */}
          <section
            id="insights"
            ref={setSectionRef('insights')}
            className="scroll-mt-24"
          >
            <PolicyInsightPanel insights={insights} />
          </section>

          <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            Malaysia Food Price Transparency Dashboard · Demonstration data only —
            not official statistics. Designed for replacement by a government API or
            CSV dataset.
          </footer>
        </main>
      </div>

      <CommodityDetailPanel
        aggregate={selectedAggregate}
        records={derived.filteredRecords}
        windowDates={derived.windowDates}
        alerts={allAlerts}
        onClose={() => setSelectedCommodityId(null)}
      />
    </div>
  )
}
