# Malaysia Food Price Transparency Dashboard

A policymaker-facing dashboard for monitoring price movements and markups across
Malaysia's food supply chain — farm-gate, wholesale and retail.

> **Demonstration data.** All figures are deterministically generated for
> demonstration purposes and are **not official statistics**. See
> [Replacing the mock data](#replacing-the-mock-data) to connect a real source.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production bundle to dist/
npm run preview  # serve the production build
```

## Stack

React 18 · TypeScript (strict) · Tailwind CSS · Recharts · Lucide icons.
No backend required — the dashboard runs entirely on embedded data.

## What it answers

The dashboard is built around the questions a market-surveillance team actually
asks, rather than consumer price browsing:

- **Where is margin being added?** Markup waterfall + bottleneck ranking isolate
  whether price is added farm→wholesale or wholesale→retail.
- **Which commodities and regions need investigation?** The alert engine and
  regional map surface hotspots instead of uniform national averages.
- **Is a retail rise justified by production costs?** Farm-gate/wholesale
  divergence detection flags increases that originate in distribution.

## Calculations

All markup formulas live in [`src/lib/calculations.ts`](src/lib/calculations.ts):

| Metric | Formula |
| --- | --- |
| Farm-to-wholesale markup | `((wholesale − farmgate) / farmgate) × 100` |
| Wholesale-to-retail markup | `((retail − wholesale) / wholesale) × 100` |
| Total farm-to-retail markup | `((retail − farmgate) / farmgate) × 100` |
| Price spread | `retail − farmgate` |
| Volatility | standard deviation of week-over-week % change |

Severity thresholds are centralised in `MARKUP_THRESHOLDS` (monitor ≥ 55%,
critical ≥ 75%) and consumed by the KPI cards, table and alert engine, so
changing them updates the whole dashboard consistently.

## Alert engine

[`src/lib/alerts.ts`](src/lib/alerts.ts) evaluates five rules per
commodity/state pair:

1. Total markup exceeds the monitor/critical threshold
2. Sharp retail increase (one-week spike)
3. Sustained retail increase (four-week climb)
4. Wholesale rising without a matching farm-gate move
5. Region priced significantly above the national average

Each rule contributes a *candidate reason* with its own severity. The emitted
alert takes the maximum severity and displays the highest-priority reason **at
that severity** — so the message shown always justifies the badge, rather than
a minor trigger being labelled critical.

## Architecture

```
src/
  data/commodities.ts   # deterministic mock panel (the swap point)
  lib/
    calculations.ts     # markup + volatility formulas
    selectors.ts        # filter-aware derived view models
    alerts.ts           # alert rule engine
    insights.ts         # evidence-based policy insights
    export.ts           # CSV export
    theme.ts / format.ts
  components/           # Header, Sidebar, FilterBar, KPI cards, charts, table…
  App.tsx               # filter state + composition
```

`deriveDashboard(records, filters)` is the single source of truth for everything
rendered. Every KPI, chart, map tile, alert and table row is recomputed from it,
so all views stay consistent when filters change.

## Replacing the mock data

The UI depends only on the `PriceRecord[]` contract in
[`src/types.ts`](src/types.ts) — one row per commodity, state and week, carrying
all three supply-chain prices.

To connect a government API or CSV, produce that array and export it as
`priceRecords` from `src/data/commodities.ts`. Nothing else needs to change:

```ts
export const priceRecords: PriceRecord[] = await loadFromGovApi()
```

Keep `COMMODITIES`, `STATES` and `ALL_DATES` exports in place (they drive the
filter options and the trailing-window logic).

## Notes on the demonstration data

Prices are anchored to plausible Malaysian levels (RM/kg, eggs in RM/dozen) with
regional cost multipliers — East Malaysia and the East Coast carry higher
logistics costs. Three supply-chain stress events are modelled **regionally**,
because real shocks are not national:

| Event | Region | Signal produced |
| --- | --- | --- |
| Chilli distribution stress | Central (Klang Valley) | Wholesale rises while farm-gate stays flat |
| Monsoon landing shortfall | East Coast | Sustained fish retail increase |
| Import supply pressure | East Malaysia | Elevated onion retail markup |

Data is generated from a seeded PRNG, so figures are stable across reloads.
