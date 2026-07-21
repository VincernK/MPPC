import { Lightbulb, ArrowRight } from 'lucide-react'
import { Card, CardHeader } from './ui/Card'
import { SEVERITY_COLORS } from '../lib/theme'
import type { PolicyInsight } from '../types'

interface Props {
  insights: PolicyInsight[]
}

export function PolicyInsightPanel({ insights }: Props) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Policy insight panel"
        subtitle="Evidence-based signals and recommended responses from the current view"
        icon={<Lightbulb className="h-4 w-4" />}
      />
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
            style={{ borderLeft: `3px solid ${SEVERITY_COLORS[ins.severity]}` }}
          >
            <p className="text-sm font-semibold text-slate-800">{ins.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{ins.detail}</p>
            <div className="mt-2.5 flex items-start gap-1.5 rounded-md bg-white px-2.5 py-2 ring-1 ring-slate-100">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <p className="text-xs font-medium text-slate-700">{ins.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
