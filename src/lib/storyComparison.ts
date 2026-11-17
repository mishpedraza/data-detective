import { INDICATORS, series } from '../data/indicators'

export interface StoryComparison {
  caption: string
  takeaway: string
  refs: string[]
  measure: 'index' | 'change'
  from: number
  to: number
  rows: { indicator: string; label: string; endpoint?: 'start' }[]
}

/** Bars share units and a zero baseline. Fall back to prose if a refresh changes the sign or coverage. */
export function storyComparison(visual: StoryComparison) {
  const rows = []
  for (const { indicator, label, endpoint } of visual.rows) {
    const data = INDICATORS[indicator]
    if (!data || visual.from >= visual.to || data.breaks.some(({ year }) => year > visual.from && year <= visual.to)) return null
    const values = series(indicator, 'ES')
    const first = values.find(({ year }) => year === visual.from)
    const last = values.find(({ year }) => year === visual.to)
    if (!first || !last || first.value <= 0) return null
    const indexed = (endpoint === 'start' ? first.value : last.value) / first.value * 100
    const value = visual.measure === 'index' ? Math.round(indexed) : Number((indexed - 100).toFixed(1))
    if (!Number.isFinite(value) || value < 0) return null
    rows.push({ label, value, display: visual.measure === 'index' ? String(value) : `+${value.toFixed(1)}%` })
  }
  return rows.some(({ value }) => value > 0) ? { ...visual, rows } : null
}
