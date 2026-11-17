import raw from './generated/indicators.json'
import type { DimensionId, Format, Indicator, Point } from './types'

const all = (raw as unknown as { generated: string; indicators: Indicator[] }).indicators

export const DATA_GENERATED = (raw as { generated: string }).generated

export const INDICATORS: Record<string, Indicator> = Object.fromEntries(all.map((i) => [i.id, i]))

export const DIMENSIONS: Record<DimensionId, { label: string; noun: string }> = {
  immigration: { label: 'Immigration', noun: 'immigration' },
  crime: { label: 'Crime', noun: 'crime' },
  economy: { label: 'Economic growth', noun: 'the economy' },
  housing: { label: 'Housing', noun: 'housing' },
  living: { label: 'Living standards', noun: 'living standards' },
}

export const indicatorsFor = (d: DimensionId) => all.filter((i) => i.dimension === d)

export function series(id: string, geo: string): Point[] {
  const s = INDICATORS[id]?.data[geo]
  if (!s) return []
  return Object.entries(s)
    .map(([y, v]) => ({ year: +y, value: v }))
    .sort((a, b) => a.year - b.year)
}

export function coverage(id: string, geo = 'ES'): [number, number] | null {
  const s = series(id, geo)
  return s.length ? [s[0].year, s[s.length - 1].year] : null
}

const nf = (min: number, max = min) =>
  new Intl.NumberFormat('en-GB', { minimumFractionDigits: min, maximumFractionDigits: max })

export function formatValue(v: number | undefined | null, f: Format, compact = false): string {
  if (v == null || Number.isNaN(v)) return '—'
  switch (f) {
    case 'count':
      if (compact || Math.abs(v) >= 1e6)
        return Math.abs(v) >= 1e6 ? `${nf(1, 1).format(v / 1e6)}m` : `${nf(0).format(Math.round(v / 1e3))}k`
      return nf(0).format(v)
    case 'decimal1':
      return nf(1).format(v)
    case 'decimal2':
      return nf(2).format(v)
    case 'pct1':
      return `${nf(1).format(v)}%`
    case 'bn':
      return `€${nf(0).format(v)}bn`
    case 'mn':
      return `${nf(1).format(v)}m`
    case 'eur':
      return compact ? `€${nf(1).format(v / 1000)}k` : `€${nf(0).format(Math.round(v / 10) * 10)}`
    case 'eur2':
      return `€${nf(2).format(v)}`
    case 'index':
      return nf(0).format(v)
  }
}

export function tickFormat(f: Format): (v: number) => string {
  return (v) => {
    if (f === 'count') return Math.abs(v) >= 1e6 ? `${nf(0, 1).format(v / 1e6)}m` : `${nf(0).format(v / 1e3)}k`
    if (f === 'pct1') return `${nf(0, 1).format(v)}%`
    if (f === 'eur') return `€${nf(0, 1).format(v / 1000)}k`
    if (f === 'eur2') return `€${nf(0, 1).format(v)}`
    if (f === 'bn') return `€${nf(0).format(v)}bn`
    if (f === 'mn') return `${nf(0, 1).format(v)}m`
    if (f === 'decimal2') return nf(1, 2).format(v)
    return nf(0, 1).format(v)
  }
}
