import { Boxes, MapPin, CalendarRange, RotateCcw, Download, ShieldAlert } from 'lucide-react'
import { MultiSelect } from './ui/MultiSelect'
import type { Option } from './ui/MultiSelect'
import { COMMODITIES, STATES } from '../data/commodities'
import type { AlertSeverity, Filters, TimeGranularity } from '../types'
import { SEVERITY_LABEL } from '../lib/theme'

const COMMODITY_OPTIONS: Option[] = COMMODITIES.map((c) => ({
  value: c.id,
  label: c.name,
  hint: c.unit.replace('RM/', ''),
}))

const STATE_OPTIONS: Option[] = STATES.map((s) => ({
  value: s.code,
  label: s.name,
  hint: s.region,
}))

const RANGE_OPTIONS: { value: number; label: string }[] = [
  { value: 8, label: 'Last 8 weeks' },
  { value: 12, label: 'Last 12 weeks' },
  { value: 26, label: 'Last 6 months' },
  { value: 52, label: 'Last 12 months' },
  { value: 104, label: 'Last 24 months' },
]

const GRANULARITIES: TimeGranularity[] = ['weekly', 'monthly', 'yearly']
const SEVERITIES: AlertSeverity[] = ['critical', 'monitor', 'normal']

interface FilterBarProps {
  filters: Filters
  onChange: (next: Partial<Filters>) => void
  onReset: () => void
  onExportData: () => void
  isDefault: boolean
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  onExportData,
  isDefault,
}: FilterBarProps) {
  return (
    <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelect
          label="Commodity"
          icon={<Boxes className="h-4 w-4" />}
          options={COMMODITY_OPTIONS}
          selected={filters.commodityIds}
          onChange={(v) => onChange({ commodityIds: v })}
          allLabel="All commodities"
        />
        <MultiSelect
          label="State / Region"
          icon={<MapPin className="h-4 w-4" />}
          options={STATE_OPTIONS}
          selected={filters.stateCodes}
          onChange={(v) => onChange({ stateCodes: v })}
          allLabel="All Malaysia"
        />

        {/* Date range */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Date range
          </label>
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filters.dateRangeWeeks}
              onChange={(e) => onChange({ dateRangeWeeks: Number(e.target.value) })}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Severity filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Alert severity
          </label>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 shadow-sm">
            {SEVERITIES.map((s) => {
              const on = filters.severities.includes(s)
              return (
                <button
                  key={s}
                  onClick={() =>
                    onChange({
                      severities: on
                        ? filters.severities.filter((x) => x !== s)
                        : [...filters.severities, s],
                    })
                  }
                  className={`flex items-center gap-1.5 border-r border-slate-200 px-3 py-2 text-xs font-medium capitalize transition last:border-r-0 ${
                    on
                      ? s === 'critical'
                        ? 'bg-red-50 text-red-700'
                        : s === 'monitor'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-brand-50 text-brand-700'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                  title={`Toggle ${SEVERITY_LABEL[s]} alerts`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {SEVERITY_LABEL[s]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Granularity segmented control */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Trend view
          </label>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 shadow-sm">
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                onClick={() => onChange({ granularity: g })}
                className={`border-r border-slate-200 px-3 py-2 text-xs font-medium capitalize transition last:border-r-0 ${
                  filters.granularity === g
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <button
            onClick={onExportData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700"
          >
            <Download className="h-4 w-4" />
            Export data
          </button>
          <button
            onClick={onReset}
            disabled={isDefault}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
