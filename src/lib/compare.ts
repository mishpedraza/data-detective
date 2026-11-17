import { series } from '../data/indicators'
import type { Indicator, Point } from '../data/types'
import { inRange } from './stats'

export interface Change {
  first: Point
  last: Point
  /** Difference in the indicator's own unit. */
  abs: number
  /** Total % change; null when % is not meaningful (rates, or values at or below zero). */
  pct: number | null
  /** Compound annual % change; null when pct is null. */
  cagr: number | null
  /** Spain series breaks inside the period. */
  breaks: number[]
}

/** Shares and rates are compared in points, not %. */
export const usesPoints = (ind: Indicator) => ind.format === 'pct1' || /rate|share|%|per 1,000/i.test(ind.unit)

export function change(ind: Indicator, geo: string, from: number, to: number): Change | null {
  const pts = inRange(series(ind.id, geo), from, to)
  if (pts.length < 2) return null
  const first = pts[0]
  const last = pts[pts.length - 1]
  const abs = last.value - first.value
  const ok = !usesPoints(ind) && pts.every((p) => p.value > 0)
  const pct = ok ? (last.value / first.value - 1) * 100 : null
  const n = last.year - first.year
  const cagr = pct != null && n > 0 ? (Math.pow(last.value / first.value, 1 / n) - 1) * 100 : null
  const breaks = geo === 'ES' ? ind.breaks.map((b) => b.year).filter((y) => y > first.year && y <= last.year) : (ind.geoBreaks?.[geo] ?? []).filter((y) => y > first.year && y <= last.year)
  return { first, last, abs, pct, cagr, breaks }
}

export interface PairComparison {
  /** Years covered by both indicators within the selection. */
  window: [number, number] | null
  a: Change | null
  b: Change | null
  /** A's % change minus B's, in percentage points; null when not comparable. */
  gap: number | null
  /** Why the gap is not shown, when it isn't. */
  reason?: string
}

/** Changes of two indicators over the same years, and the gap between them. */
export function comparePair(A: Indicator, B: Indicator, geo: string, from: number, to: number): PairComparison {
  const ya = new Set(inRange(series(A.id, geo), from, to).map((p) => p.year))
  const common = inRange(series(B.id, geo), from, to).map((p) => p.year).filter((y) => ya.has(y))
  if (common.length < 2) return { window: null, a: null, b: null, gap: null, reason: 'The two indicators share fewer than two years of data in this period.' }
  const w: [number, number] = [Math.min(...common), Math.max(...common)]
  const a = change(A, geo, w[0], w[1])
  const b = change(B, geo, w[0], w[1])
  let reason: string | undefined
  if (!a || !b) reason = 'Not enough data.'
  else if (a.pct == null || b.pct == null) reason = 'One indicator is a rate or share, so its change is in points and cannot be set against a % change.'
  else if (a.breaks.length || b.breaks.length) reason = `A series break in ${[...a.breaks, ...b.breaks].sort().join(', ')} means values before and after are not fully comparable.`
  const gap = reason || !a || !b || a.pct == null || b.pct == null ? null : a.pct - b.pct
  return { window: w, a, b, gap, reason }
}
