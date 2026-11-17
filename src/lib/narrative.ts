import { COUNTRIES } from '../data/countries'
import { INDICATORS, formatValue, series } from '../data/indicators'
import type { Point } from '../data/types'
import { align, changes, describeR, inRange, pearson } from './stats'

export interface Sentence {
  text: string
  refs: string[]
}

function trend(points: Point[]) {
  const first = points[0]
  const last = points[points.length - 1]
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a))
  const low = points.reduce((a, b) => (b.value < a.value ? b : a))
  const rel = (last.value - first.value) / Math.abs(first.value || 1)
  return { first, last, peak, low, rel }
}

const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)

export function describeSeries(id: string, geo: string, from: number, to: number): Sentence | null {
  const ind = INDICATORS[id]
  const pts = inRange(series(id, geo), from, to)
  if (pts.length < 2) return null
  const { first, last, peak, low, rel } = trend(pts)
  const f = (v: number) => formatValue(v, ind.format)
  const where = geo === 'ES' ? 'In Spain, ' : `In ${COUNTRIES[geo].name}, `
  const verb = Math.abs(rel) < 0.05 ? 'was broadly stable, moving' : rel > 0 ? 'rose' : 'fell'
  let text = `${where}${lc(ind.short)} ${verb} from ${f(first.value)} in ${first.year} to ${f(last.value)} in ${last.year}`
  const span = Math.abs(peak.value - low.value) || 1
  if (peak.year !== first.year && peak.year !== last.year && (peak.value - Math.max(first.value, last.value)) / span > 0.2)
    text += `, after peaking at ${f(peak.value)} in ${peak.year}`
  else if (low.year !== first.year && low.year !== last.year && (Math.min(first.value, last.value) - low.value) / span > 0.2)
    text += `, after a low of ${f(low.value)} in ${low.year}`
  text += ` (${ind.unit}).`
  return { text, refs: [`data:${id}`] }
}

export function changeMode(id: string): 'pct' | 'abs' {
  const f = INDICATORS[id].format
  return f === 'pct1' || id === 'net_migration_rate' || INDICATORS[id].unit === '% a year' ? 'abs' : 'pct'
}

export function correlations(a: string, b: string, geo: string, from: number, to: number) {
  const sa = inRange(series(a, geo), from, to)
  const sb = inRange(series(b, geo), from, to)
  const levels = align(sa, sb)
  const ch = align(changes(sa, changeMode(a)), changes(sb, changeMode(b)))
  return { levels, changes: ch, rLevels: pearson(levels), rChanges: pearson(ch) }
}

export function describeCorrelation(a: string, b: string, geo: string, from: number, to: number): Sentence | null {
  const c = correlations(a, b, geo, from, to)
  if (c.levels.length < 4) return null
  const y0 = c.levels[0].year
  const y1 = c.levels[c.levels.length - 1].year
  const r = (v: number | null) => (v == null ? 'n/a' : v.toFixed(2).replace('-', '−'))
  return {
    text: `Over the ${c.levels.length} years where both are available (${y0}–${y1}), the two series show ${describeR(c.rLevels)} in their levels (r = ${r(c.rLevels)}) and ${describeR(c.rChanges)} in their year-to-year changes (r = ${r(c.rChanges)}).`,
    refs: [`data:${a}`, `data:${b}`],
  }
}
