import {
  LayoutDashboard,
  GitCompareArrows,
  Map,
  Bell,
  Table2,
  Lightbulb,
  Sprout,
  X,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'supply-chain', label: 'Supply Chain', icon: <GitCompareArrows className="h-5 w-5" /> },
  { id: 'regional', label: 'Regional Map', icon: <Map className="h-5 w-5" /> },
  { id: 'alerts', label: 'Price Alerts', icon: <Bell className="h-5 w-5" /> },
  { id: 'commodities', label: 'Commodities', icon: <Table2 className="h-5 w-5" /> },
  { id: 'insights', label: 'Policy Insights', icon: <Lightbulb className="h-5 w-5" /> },
]

interface SidebarProps {
  active: string
  onNavigate: (id: string) => void
  alertCount: number
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  active,
  onNavigate,
  alertCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">Food Price</p>
              <p className="text-xs font-medium text-brand-600">Transparency MY</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={active === item.id ? 'text-brand-600' : 'text-slate-400'}
                >
                  {item.icon}
                </span>
                {item.label}
              </span>
              {item.id === 'alerts' && alertCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Demonstration data</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              All figures are illustrative and generated for demonstration. Replace
              with a government API or CSV feed for production use.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
