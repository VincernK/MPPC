import { Menu, FileDown, RefreshCw, Clock } from 'lucide-react'
import { formatDate } from '../lib/format'

interface HeaderProps {
  lastUpdated: string
  onExportReport: () => void
  onOpenMobile: () => void
}

export function Header({ lastUpdated, onExportReport, onOpenMobile }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-start gap-3">
          <button
            onClick={onOpenMobile}
            className="mt-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
              Malaysia Food Price Transparency Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Monitoring price movements and markups across Malaysia&rsquo;s food
              supply chain
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:flex">
            <Clock className="h-3.5 w-3.5 text-brand-600" />
            <span>
              Last updated{' '}
              <span className="font-semibold text-slate-700">
                {formatDate(lastUpdated)}
              </span>
            </span>
            <span className="ml-1 flex items-center gap-1 text-brand-600">
              <RefreshCw className="h-3 w-3" />
              Live
            </span>
          </div>
          <button
            onClick={onExportReport}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <FileDown className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>
    </header>
  )
}
