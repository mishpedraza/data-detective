import { COUNTRIES } from '../data/countries'
import { INDICATORS, series } from '../data/indicators'
import { change, comparePair } from './compare'
import { inRange } from './stats'

export interface Answer {
  /** Short finding shown as the page headline. */
  headline: string
  /** Optional line under the headline, e.g. what the figures cannot show. */
  dek?: string
  /** The figures behind the finding, with their interpretation. */
  text: string
  /** Indicators the answer already quantifies. */
  covered: string[]
}

const place = (geo: string) => (geo === 'ES' ? 'Spain' : COUNTRIES[geo]?.name ?? geo)
const moved = (v: number) => (Math.abs(v) < 0.05 ? 'was unchanged' : `${v > 0 ? 'rose' : 'fell'} ${Math.abs(v).toFixed(1)}%`)
const pts = (v: number) => `${Math.abs(v).toFixed(1)} percentage points`

/** First and last year in [from, to] where every series has data. */
function window(ids: string[], geo: string, from: number, to: number): [number, number] | null {
  const sets = ids.map((id) => new Set(inRange(series(id, geo), from, to).map((p) => p.year)))
  const years = [...sets[0]].filter((y) => sets.every((s) => s.has(y))).sort((x, y) => x - y)
  return years.length >= 2 ? [years[0], years[years.length - 1]] : null
}
const pct = (id: string, geo: string, w: [number, number]) => change(INDICATORS[id], geo, w[0], w[1])?.pct ?? null

type Built = { headline: string; text: string } | null
const cagr = (id: string, geo: string, w: [number, number]) => change(INDICATORS[id], geo, w[0], w[1])?.cagr ?? null
/** Below 0.2% a year either way counts as barely changed. */
const FLAT = 0.2

function growthWages(geo: string, from: number, to: number, short: boolean): Built {
  const w = window(['gdp_pc_real', 'median_earnings_real'], geo, from, to)
  if (!w) {
    if (short) return null
    const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
    const a = wa ? pct('real_wage', geo, wa) : null
    const g = wa ? pct('gdp_pc_real', geo, wa) : null
    return {
      headline: `The available data cannot establish whether typical workers in ${place(geo)} became poorer in ${from}–${to}`,
      text: `Median pay, the best measure of the typical worker, is only surveyed in 2006, 2010, 2014, 2018 and 2022, and this period does not include two of those years.${wa && a != null && g != null ? ` For context only: real GDP per person ${moved(g)} and real average wages, which high earners pull up, ${moved(a)} over ${wa[0]}–${wa[1]}.` : ''}`,
    }
  }
  const g = pct('gdp_pc_real', geo, w)
  const p = pct('median_earnings_real', geo, w)
  const gy = cagr('gdp_pc_real', geo, w)
  const py = cagr('median_earnings_real', geo, w)
  if (g == null || p == null || gy == null || py == null) return null
  if (short) return { headline: '', text: `In ${place(geo)} over the same years, real GDP per person ${moved(g)} and real median hourly pay ${moved(p)}.` }
  const gap = g - p
  const econ = gy > FLAT ? 'grew' : gy < -FLAT ? 'shrank' : 'stalled'
  const pay = py > FLAT ? 'rose' : py < -FLAT ? 'fell' : 'barely changed'
  const P = place(geo)
  const headline =
    pay === 'rose'
      ? econ === 'grew'
        ? gap > 2 ? `Typical workers’ real pay rose in ${P}, but less than the economy` : gap < -2 ? `Typical workers’ real pay in ${P} grew faster than the economy` : `${P}’s economy and typical workers’ real pay grew together`
        : `Typical workers’ real pay rose in ${P} while the economy ${econ}`
      : econ === 'grew'
        ? `${P}’s economy grew, but typical workers’ real pay ${pay}`
        : `${P}’s economy ${econ} and typical workers’ real pay ${pay}`
  const meaning =
    pay === 'fell'
      ? 'Typical workers lost wage purchasing power.'
      : pay === 'barely changed'
        ? `Typical workers neither gained nor lost much wage purchasing power${econ === 'grew' ? ', while the economy grew' : ''}.`
        : gap > 2 ? 'Typical workers gained wage purchasing power, but less than the economy grew.' : 'Typical workers gained wage purchasing power.'
  const yr = (v: number) => `about ${Math.abs(v) < 0.05 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`}% a year`
  const out = [`Between ${w[0]} and ${w[1]}, real GDP per person ${moved(g)} (${yr(gy)}) and real median hourly pay ${moved(p)} (${yr(py)}). ${meaning}`]
  const avg = pct('real_wage', geo, w)
  if (avg != null) out.push(`Average wages, which high earners pull up, ${moved(avg)}${avg - p > 2 ? ', so pay in the middle grew more slowly than the average' : avg - p < -2 ? ', so pay in the middle grew faster than the average' : ''}.`)
  if (w[0] > from || w[1] < to) out.push(`Median pay is surveyed every four years, so the comparison uses ${w[0]}–${w[1]}.`)
  return { headline, text: out.join(' ') }
}

function productivityWages(geo: string, from: number, to: number, short: boolean): Built {
  const w = window(['productivity', 'real_wage'], geo, from, to)
  if (!w) return null
  const q = pct('productivity', geo, w)
  const p = pct('real_wage', geo, w)
  if (q == null || p == null) return null
  if (short) return { headline: '', text: `In ${place(geo)} over the same years, output per hour ${moved(q)} and real average wages ${moved(p)}.` }
  const gap = q - p
  const headline = Math.abs(gap) <= 2 ? `In ${place(geo)}, average wages kept pace with productivity` : gap > 0 ? `In ${place(geo)}, average wages fell behind productivity` : `In ${place(geo)}, average wages grew faster than productivity`
  return { headline, text: `Between ${w[0]} and ${w[1]}, output per hour worked ${moved(q)} and real average wages ${moved(p)}${Math.abs(gap) > 2 ? `, a gap of ${pts(gap)}` : ''}. Output per hour is not GDP per person, and average wages are not what the typical worker earns.` }
}

function affordability(geo: string, from: number, to: number, short: boolean): Built {
  const w = window(['house_price_real', 'disp_income_real'], geo, from, to)
  if (!w) return null
  const h = pct('house_price_real', geo, w)
  const i = pct('disp_income_real', geo, w)
  if (h == null || i == null) return null
  if (short) return { headline: '', text: `In ${place(geo)} over the same years, real house prices ${moved(h)} and real household income ${moved(i)}.` }
  const gap = h - i
  const rel = gap > 0
    ? h > 0 ? `house prices rose ${i > 0 ? 'faster than incomes' : 'while incomes fell'}` : 'incomes fell more than house prices'
    : i > 0 ? `incomes ${h > 0 ? 'grew faster than house prices' : 'rose while house prices fell'}` : 'house prices fell more than incomes'
  const headline = Math.abs(gap) <= 2 ? `In ${place(geo)}, house prices and incomes moved roughly together` : `In ${place(geo)}, ${rel}`
  const meaning = Math.abs(gap) <= 2 ? 'Affordability relative to incomes barely changed.' : `Buying a home became ${gap > 0 ? 'less' : 'more'} affordable relative to incomes.`
  return { headline, text: `Between ${w[0]} and ${w[1]}, real house prices ${moved(h)} and real household income per person ${moved(i)}${Math.abs(gap) > 2 ? `, a gap of ${pts(gap)}` : ''}. ${meaning}` }
}

function europeUs(geo: string, from: number, to: number, short: boolean): Built {
  const lvl = (id: string) => {
    const s = inRange(series(id, geo), from, to)
    return s.length >= 2 ? { a: s[0], b: s[s.length - 1] } : null
  }
  const g = lvl('gdp_pc_vs_us'), c = lvl('aic_vs_us'), wg = lvl('wage_vs_us')
  if (!g && !c && !wg) return null
  const items = ([[g, 'GDP per person'], [c, 'consumption per person'], [wg, 'average wages']] as const).filter(([x]) => x)
  const parts = items.map(([x, what], k) => (k === 0 ? `${what} went from ${x!.a.value.toFixed(0)}% of the US level in ${x!.a.year} to ${x!.b.value.toFixed(0)}% in ${x!.b.year}` : `${what} from ${x!.a.value.toFixed(0)}% to ${x!.b.value.toFixed(0)}% (${x!.a.year}–${x!.b.year})`))
  if (short) return { headline: '', text: `In ${place(geo)}, ${parts.join('; ')}.` }
  const d = (x: ReturnType<typeof lvl>) => (x ? x.b.value - x.a.value : 0)
  const behind = items.filter(([x]) => d(x) < -1).map(([, w]) => w)
  const ahead = items.filter(([x]) => d(x) > 1).map(([, w]) => w)
  const list = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0])
  const headline = behind.length && ahead.length
    ? `${place(geo)} caught up with the US in ${list(ahead)} but fell further behind in ${list(behind)}`
    : behind.length
      ? `${place(geo)} fell further behind the US in ${list(behind)}`
      : ahead.length
        ? `${place(geo)} caught up with the US in ${list(ahead)}`
        : `${place(geo)}’s position relative to the US barely changed`
  const out = [`In ${place(geo)}, ${parts.join('; ')}.`]
  const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
  if (wa) {
    const a = pct('gdp_pc_real', geo, wa), b = pct('real_wage', geo, wa)
    if (a != null && b != null) out.push(`Falling behind is not the same as getting poorer: in absolute terms, real GDP per person ${moved(a)} and real average wages ${moved(b)} over ${wa[0]}–${wa[1]}.`)
  }
  return { headline, text: out.join(' ') }
}

const DRIVER_Q: Record<string, string> = {
  'immigration-crime': 'immigration increased crime',
  'immigration-housing': 'immigration made housing more expensive',
  'immigration-growth': 'immigration contributed to economic growth',
  'immigration-employment': 'immigration took jobs from locals',
  'unemployment-crime': 'unemployment drove crime',
  'inequality-crime': 'inequality increased crime',
}

const BUILT: Record<string, { fn: (geo: string, from: number, to: number, short: boolean) => Built; covered: string[]; none: [string, string] }> = {
  'growth-wages': { fn: growthWages, covered: ['gdp_pc_real', 'median_earnings_real', 'real_wage'], none: ['The available data cannot establish whether typical workers became poorer in these years', 'There is not enough GDP and wage data. Widen the period.'] },
  'productivity-wages': { fn: productivityWages, covered: ['productivity', 'real_wage'], none: ['Not enough data to compare productivity and wages in these years', 'Widen the period.'] },
  'housing-affordability': { fn: affordability, covered: ['house_price_real', 'disp_income_real'], none: ['Not enough data to compare house prices and incomes in these years', 'Widen the period.'] },
  'europe-us': { fn: europeUs, covered: ['gdp_pc_vs_us', 'aic_vs_us', 'wage_vs_us'], none: ['Not enough data to compare with the US in these years', 'Widen the period.'] },
}

const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)

/** Which way two selected indicators moved over the years both cover, e.g. "the foreign-born share rose while recorded robbery fell, 2008–2024". */
function describePair(a: string, b: string, from: number, to: number): string | null {
  const p = comparePair(INDICATORS[a], INDICATORS[b], 'ES', from, to)
  if (!p.window || !p.a || !p.b) return null
  const name = (id: string) => {
    const ind = INDICATORS[id]
    const short = lc(ind.short.replace(/\s*\(.*?\)/g, ''))
    return `${/(share|rate)$/.test(short) ? 'the ' : ''}${ind.dimension === 'crime' ? 'recorded ' : ''}${short}`
  }
  const dir = (c: NonNullable<typeof p.a>) => ((c.pct != null ? Math.abs(c.pct) < 2 : Math.abs(c.abs) < 0.2) ? 'was little changed' : (c.pct ?? c.abs) > 0 ? 'rose' : 'fell')
  const da = dir(p.a), db = dir(p.b)
  const years = `${p.window[0]}–${p.window[1]}`
  if (da === db && da !== 'was little changed') return `${name(a)} and ${name(b)} both ${da}, ${years}`
  return `${name(a)} ${da} while ${name(b)} ${db}, ${years}`
}

/** A direct, data-based finding for the investigation, or a statement that the data cannot give one. */
export function answerFor(relId: string, a: string, b: string, compare: string | null, from: number, to: number): Answer | null {
  const bt = BUILT[relId]
  if (bt) {
    const main = bt.fn('ES', from, to, false)
    if (!main) return { headline: bt.none[0], text: bt.none[1], covered: [] }
    const other = compare && compare !== 'none' ? bt.fn(compare, from, to, true) : null
    return { headline: main.headline, text: other ? `${main.text} ${other.text}` : main.text, covered: bt.covered }
  }
  const d = describePair(a, b, from, to)
  const q = DRIVER_Q[relId]
  if (!d) return q ? { headline: `Too little overlapping data in ${from}–${to}`, dek: `Even with more data, national figures alone could not show whether ${q}.`, text: '', covered: [] } : null
  const headline = `In Spain, ${d}`
  return q ? { headline, dek: `These figures alone cannot show whether ${q}; the research below weighs the evidence.`, text: '', covered: [] } : { headline, text: '', covered: [] }
}
export const isDriverQuestion = (relId: string) => relId in DRIVER_Q
