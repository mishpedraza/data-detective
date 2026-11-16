import type { Point } from '../data/types'

export function inRange(s: Point[], from: number, to: number) {
  return s.filter((p) => p.year >= from && p.year <= to)
}

export function changes(s: Point[], mode: 'pct' | 'abs'): Point[] {
  const out: Point[] = []
  for (let i = 1; i < s.length; i++) {
    if (s[i].year !== s[i - 1].year + 1) continue
    const prev = s[i - 1].value
    out.push({ year: s[i].year, value: mode === 'pct' ? ((s[i].value - prev) / prev) * 100 : s[i].value - prev })
  }
  return out
}

export function align(a: Point[], b: Point[]) {
  const m = new Map(b.map((p) => [p.year, p.value]))
  return a.filter((p) => m.has(p.year)).map((p) => ({ year: p.year, x: p.value, y: m.get(p.year)! }))
}

export function pearson(pts: { x: number; y: number }[]): number | null {
  const n = pts.length
  if (n < 4) return null
  const mx = pts.reduce((s, p) => s + p.x, 0) / n
  const my = pts.reduce((s, p) => s + p.y, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my)
    sxx += (p.x - mx) ** 2
    syy += (p.y - my) ** 2
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null
}

export function describeR(r: number | null): string {
  if (r == null) return 'too few years to measure'
  const a = Math.abs(r)
  const strength = a < 0.2 ? 'no clear' : a < 0.4 ? 'a weak' : a < 0.7 ? 'a moderate' : 'a strong'
  if (a < 0.2) return 'no clear relationship'
  return `${strength} ${r > 0 ? 'positive' : 'negative'} relationship`
}
