import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface Option {
  value: string
  label: string
  hint?: string
}

interface MultiSelectProps {
  label: string
  icon?: React.ReactNode
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  allLabel?: string // when empty selection means "all"
  placeholder?: string
}

export function MultiSelect({
  label,
  icon,
  options,
  selected,
  onChange,
  allLabel = 'All',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? '1 selected'
        : `${selected.length} selected`

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="truncate">{summary}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-full min-w-[14rem] overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg scrollbar-thin">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            <span className="font-medium">{allLabel}</span>
            {selected.length === 0 && <Check className="h-4 w-4 text-brand-600" />}
          </button>
          <div className="my-1 border-t border-slate-100" />
          {options.map((o) => {
            const isSel = selected.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      isSel
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSel && <Check className="h-3 w-3" />}
                  </span>
                  {o.label}
                </span>
                {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
