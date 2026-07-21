// Formatting helpers — Malaysian Ringgit and dashboard-friendly numbers.

export function formatRM(value: number, unit?: string): string {
  const rm = `RM ${value.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
  if (!unit) return rm
  // unit like "RM/kg" -> append "/kg"; otherwise append unit as-is.
  const suffix = unit.startsWith('RM') ? unit.slice(2) : ` ${unit}`
  return `${rm}${suffix}`
}

export function formatPct(value: number, withSign = false): string {
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-MY')
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function formatMonth(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-MY', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}
