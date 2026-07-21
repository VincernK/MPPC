import type { AlertSeverity } from '../types'

// Supply-chain stage colours (used consistently across every chart).
export const STAGE_COLORS = {
  farmgate: '#16a34a', // brand green
  wholesale: '#0ea5e9', // sky
  retail: '#f59e0b', // amber
}

export const STAGE_LABELS = {
  farmgate: 'Farm-gate',
  wholesale: 'Wholesale',
  retail: 'Retail',
}

// Severity colours — accessible on a light background.
export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  normal: '#16a34a',
  monitor: '#d97706',
  critical: '#dc2626',
}

export const SEVERITY_BG: Record<AlertSeverity, string> = {
  normal: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  monitor: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  critical: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  normal: 'Normal',
  monitor: 'Monitor',
  critical: 'Critical',
}

// Sequential green scale for the choropleth-style regional panel.
export const HEAT_SCALE = [
  '#f0fdf4',
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#166534',
]

export function heatColor(value: number, min: number, max: number): string {
  if (max <= min) return HEAT_SCALE[0]
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const idx = Math.round(t * (HEAT_SCALE.length - 1))
  return HEAT_SCALE[idx]
}
