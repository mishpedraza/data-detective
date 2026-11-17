import { COUNTRIES } from '../data/countries'
import { INDICATORS, series } from '../data/indicators'
import { change } from './compare'
import { inRange } from './stats'

export interface Answer {
  /** Sentences answering the investigation's question from the data. */
  text: string
  /** Indicators the answer already quantifies. */
  covered: string[]
}

const place = (geo: string) => (geo === 'ES' ? 'Spain' : COUNTRIES[geo]?.name ?? geo)
const poss = (geo: string) => `${place(geo)}’s`
const moved = (v: number) => (Math.abs(v) < 0.05 ? 'was unchanged' : `${v > 0 ? 'rose' : 'fell'} ${Math.abs(v).toFixed(1)}%`)
const pts = (v: number) => `${Math.abs(v).toFixed(1)} percentage points`

/** First and last year in [from, to] where every series has data. */
function window(ids: string[], geo: string, from: number, to: number): [number, number] | null {
  const sets = ids.map((id) => new Set(inRange(series(id, geo), from, to).map((p) => p.year)))
  const years = [...sets[0]].filter((y) => sets.every((s) => s.has(y))).sort((x, y) => x - y)
  return years.length >= 2 ? [years[0], years[years.length - 1]] : null
}
const pct = (id: string, geo: string, w: [number, number]) => change(INDICATORS[id], geo, w[0], w[1])?.pct ?? null

function growthWages(geo: string, from: number, to: number, short: boolean): string | null {
  let wage = 'median_earnings_real'
  let w = window(['gdp_pc_real', wage], geo, from, to)
  if (!w) {
    wage = 'real_wage'
    w = window(['gdp_pc_real', wage], geo, from, to)
  }
  if (!w) return null
  const g = pct('gdp_pc_real', geo, w)
  const p = pct(wage, geo, w)
  if (g == null || p == null) return null
  const median = wage === 'median_earnings_real'
  const label = median ? 'real median hourly pay' : 'real average wages'
  if (short) return `In ${place(geo)} over the same years, real GDP per person ${moved(g)} and ${label} ${moved(p)}.`
  const off = p > 1 ? 'better off' : p < -1 ? 'worse off' : 'neither better nor worse off'
  const gap = g - p
  const pace = Math.abs(gap) <= 2 ? 'kept pace with economic growth' : gap > 0 ? `fell behind economic growth by ${pts(gap)}` : `grew faster than the economy by ${pts(-gap)}`
  const join = (p > 1 && gap > 2) || (p < -1 && gap < -2) ? 'but' : 'and'
  const out = [`Between ${w[0]} and ${w[1]}, ${poss(geo)} real GDP per person ${moved(g)}, while ${label} ${moved(p)}. Workers became ${off} in terms of real ${median ? '' : 'average '}wages, ${join} their pay ${pace}.`]
  if (median) {
    const avg = pct('real_wage', geo, w)
    if (avg != null) out.push(`Average wages, which high earners pull up, ${moved(avg)}${avg - p > 2 ? ', so pay in the middle grew more slowly than the average' : avg - p < -2 ? ', so pay in the middle grew faster than the average' : ''}.`)
    if (w[0] > from || w[1] < to) out.push(`Median pay is surveyed every four years, so the comparison uses ${w[0]}–${w[1]}.`)
  } else {
    out.push('Median pay, surveyed every four years from 2006, does not cover two years in this period, so this uses average wages, which high earners pull up.')
  }
  return out.join(' ')
}

function productivityWages(geo: string, from: number, to: number, short: boolean): string | null {
  const w = window(['productivity', 'real_wage'], geo, from, to)
  if (!w) return null
  const q = pct('productivity', geo, w)
  const p = pct('real_wage', geo, w)
  if (q == null || p == null) return null
  if (short) return `In ${place(geo)} over the same years, output per hour ${moved(q)} and real average wages ${moved(p)}.`
  const gap = q - p
  const pace = Math.abs(gap) <= 2 ? 'kept pace with productivity' : gap > 0 ? `fell behind productivity by ${pts(gap)}` : `grew faster than productivity by ${pts(-gap)}`
  return `Between ${w[0]} and ${w[1]}, output per hour worked in ${place(geo)} ${moved(q)}, while real average wages ${moved(p)}: wages ${pace}. Output per hour is not the same as GDP per person, and average wages are not what the typical worker earns.`
}

function affordability(geo: string, from: number, to: number, short: boolean): string | null {
  const w = window(['house_price_real', 'disp_income_real'], geo, from, to)
  if (!w) return null
  const h = pct('house_price_real', geo, w)
  const i = pct('disp_income_real', geo, w)
  if (h == null || i == null) return null
  if (short) return `In ${place(geo)} over the same years, real house prices ${moved(h)} and real household income ${moved(i)}.`
  const gap = h - i
  const verdict = gap > 2 ? 'less affordable relative to incomes' : gap < -2 ? 'more affordable relative to incomes' : 'about as affordable relative to incomes'
  return `Between ${w[0]} and ${w[1]}, ${poss(geo)} real house prices ${moved(h)}, while real household income per person ${moved(i)}, so buying a home became ${verdict}${Math.abs(gap) > 2 ? ` (a gap of ${pts(gap)})` : ''}.`
}

function europeUs(geo: string, from: number, to: number, short: boolean): string | null {
  const lvl = (id: string) => {
    const s = inRange(series(id, geo), from, to)
    return s.length >= 2 ? { a: s[0], b: s[s.length - 1] } : null
  }
  const g = lvl('gdp_pc_vs_us'), c = lvl('aic_vs_us'), wg = lvl('wage_vs_us')
  if (!g && !c && !wg) return null
  const items = ([[g, 'GDP per person'], [c, 'consumption per person'], [wg, 'average wages']] as const).filter(([x]) => x)
  const parts = items.map(([x, what], k) => (k === 0 ? `${what} went from ${x!.a.value.toFixed(0)}% of the US level in ${x!.a.year} to ${x!.b.value.toFixed(0)}% in ${x!.b.year}` : `${what} from ${x!.a.value.toFixed(0)}% to ${x!.b.value.toFixed(0)}% (${x!.a.year}–${x!.b.year})`))
  if (short) return `In ${place(geo)}, ${parts.join('; ')}.`
  const dir = (x: ReturnType<typeof lvl>, what: string) => (x ? `${x.b.value - x.a.value > 1 ? 'narrowed the gap' : x.b.value - x.a.value < -1 ? 'fell further behind' : 'held steady'} in ${what}` : null)
  const dirs = [dir(g, 'GDP per person'), dir(c, 'consumption'), dir(wg, 'average wages')].filter(Boolean) as string[]
  const out = [`In ${place(geo)}, ${parts.join('; ')}. Relative to Americans, ${place(geo)} ${dirs.length > 1 ? `${dirs.slice(0, -1).join(', ')} and ${dirs[dirs.length - 1]}` : dirs[0]}.`]
  const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
  if (wa) {
    const a = pct('gdp_pc_real', geo, wa), b = pct('real_wage', geo, wa)
    if (a != null && b != null) out.push(`A falling share is not the same as getting poorer: in absolute terms, real GDP per person ${moved(a)} and real average wages ${moved(b)} over ${wa[0]}–${wa[1]}.`)
  }
  return out.join(' ')
}

const DRIVER_Q: Record<string, string> = {
  'immigration-crime': 'immigration increased crime',
  'immigration-housing': 'immigration made housing more expensive',
  'immigration-growth': 'immigration contributed to economic growth',
  'immigration-employment': 'immigration took jobs from locals',
  'unemployment-crime': 'unemployment drove crime',
  'inequality-crime': 'inequality increased crime',
}

const BUILT: Record<string, { fn: (geo: string, from: number, to: number, short: boolean) => string | null; covered: string[]; none: string }> = {
  'growth-wages': { fn: growthWages, covered: ['gdp_pc_real', 'median_earnings_real', 'real_wage'], none: 'The selected years do not include at least two years of both GDP and wage data, so the question cannot be answered for this period. Widen the period.' },
  'productivity-wages': { fn: productivityWages, covered: ['productivity', 'real_wage'], none: 'The selected years do not include enough productivity and wage data to answer this. Widen the period.' },
  'housing-affordability': { fn: affordability, covered: ['house_price_real', 'disp_income_real'], none: 'The selected years do not include enough house-price and income data to answer this. Widen the period.' },
  'europe-us': { fn: europeUs, covered: ['gdp_pc_vs_us', 'aic_vs_us', 'wage_vs_us'], none: 'The selected years do not include enough data compared with the US to answer this. Widen the period.' },
}

/** A direct, data-based answer to the investigation's question, or a note on why the data cannot give one. */
export function answerFor(relId: string, compare: string | null, from: number, to: number): Answer | null {
  const b = BUILT[relId]
  if (b) {
    const main = b.fn('ES', from, to, false)
    if (!main) return { text: b.none, covered: [] }
    const other = compare && compare !== 'none' ? b.fn(compare, from, to, true) : null
    return { text: other ? `${main} ${other}` : main, covered: b.covered }
  }
  const q = DRIVER_Q[relId]
  return q ? { text: `National figures moving together, or apart, cannot by themselves show whether ${q}. The research below is the better guide.`, covered: [] } : null
}

export const isDriverQuestion = (relId: string) => relId in DRIVER_Q
