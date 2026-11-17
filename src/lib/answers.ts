import { COUNTRIES } from '../data/countries'
import { INDICATORS, series } from '../data/indicators'
import { change, comparePair, type Change } from './compare'
import { inRange } from './stats'

export interface Stat {
  value: string
  label: string
}

export interface Answer {
  /** Short finding shown as the page headline. */
  headline: string
  /** Optional line under the headline, e.g. what the figures cannot show. */
  dek?: string
  /** Years the key statistics cover. */
  period?: string
  /** Two to four key statistics behind the headline. */
  stats: Stat[]
  /** One sentence on what the statistics mean. */
  meaning: string
  /** Secondary figures, shown on request. */
  detail: string[]
  /** Indicators the answer already quantifies. */
  covered: string[]
}

const place = (geo: string) => (geo === 'ES' ? 'Spain' : COUNTRIES[geo]?.name ?? geo)
const moved = (v: number) => (Math.abs(v) < 0.05 ? 'was unchanged' : `${v > 0 ? 'rose' : 'fell'} ${Math.abs(v).toFixed(1)}%`)
const pts = (v: number) => `${Math.abs(v).toFixed(1)} percentage points`
const signed = (v: number, unit = '%') => `${Math.abs(v) < 0.05 ? '' : v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}${unit}`
const span = (w: [number, number]) => `${w[0]}–${w[1]}`

/** First and last year in [from, to] where every series has data. */
function window(ids: string[], geo: string, from: number, to: number): [number, number] | null {
  const sets = ids.map((id) => new Set(inRange(series(id, geo), from, to).map((p) => p.year)))
  const years = [...sets[0]].filter((y) => sets.every((s) => s.has(y))).sort((x, y) => x - y)
  return years.length >= 2 ? [years[0], years[years.length - 1]] : null
}
const pct = (id: string, geo: string, w: [number, number]) => change(INDICATORS[id], geo, w[0], w[1])?.pct ?? null
const cagr = (id: string, geo: string, w: [number, number]) => change(INDICATORS[id], geo, w[0], w[1])?.cagr ?? null
/** Below 0.2% a year either way counts as barely changed. */
const FLAT = 0.2

type Built = { headline: string; period?: string; stats: Stat[]; meaning: string; detail: string[] }
type Short = string
type Fn = { (geo: string, from: number, to: number, short: true): Short | null; (geo: string, from: number, to: number, short: false): Built | null }

function growthWages(geo: string, from: number, to: number, short: boolean): Built | Short | null {
  const w = window(['gdp_pc_real', 'median_earnings_real'], geo, from, to)
  if (!w) {
    if (short) return null
    const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
    const a = wa ? pct('real_wage', geo, wa) : null
    const g = wa ? pct('gdp_pc_real', geo, wa) : null
    return {
      headline: `The available data cannot establish whether typical workers in ${place(geo)} became poorer in ${from}–${to}`,
      stats: [],
      meaning: 'Median pay, the measure of the typical worker, is surveyed only in 2006, 2010, 2014, 2018 and 2022, and this period includes fewer than two of those years.',
      detail: wa && a != null && g != null ? [`For context only, not the typical worker: real GDP per person ${moved(g)} and real average wages, which high earners pull up, ${moved(a)} over ${span(wa)}.`] : [],
    }
  }
  const g = pct('gdp_pc_real', geo, w)
  const p = pct('median_earnings_real', geo, w)
  const gy = cagr('gdp_pc_real', geo, w)
  const py = cagr('median_earnings_real', geo, w)
  if (g == null || p == null || gy == null || py == null) return null
  if (short) return `In ${place(geo)} in ${span(w)}, real GDP per person ${moved(g)} and real median ${INDICATORS.median_earnings_real.geoUnits?.[geo] ? 'weekly pay of full-time workers' : 'hourly pay'} ${moved(p)}.`
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
  const avg = pct('real_wage', geo, w)
  const meaning =
    pay === 'fell'
      ? `Typical workers lost purchasing power${econ === 'grew' ? ', a real decline, not just a smaller share of growth' : ''}.`
      : pay === 'barely changed'
        ? `Typical workers did not become poorer${econ === 'grew' ? ', but the growth did not reach their pay' : ''}.`
        : gap > 2 ? 'Typical workers became better off, but by less than the economy grew.' : 'Typical workers became better off.'
  const yr = (v: number) => `${signed(v)} a year`
  const detail = [`Per year: GDP per person ${yr(gy)}, median pay ${yr(py)}.`]
  if (avg != null && Math.abs(avg - p) > 2) detail.push(`Average wages, which high earners pull up, changed ${signed(avg)} against ${signed(p)} for median pay, so pay ${avg > p ? 'at the top did better than in the middle' : 'in the middle did better than the average'}.`)
  if (w[0] > from || w[1] < to) detail.push(`Median pay is surveyed every four years, so these figures cover ${span(w)}.`)
  const stats = [
    { value: signed(g), label: 'real GDP per person' },
    { value: signed(p), label: 'real median hourly pay' },
    ...(avg != null ? [{ value: signed(avg), label: 'real average wages' }] : []),
  ]
  return { headline, period: span(w), stats, meaning, detail }
}

function productivityWages(geo: string, from: number, to: number, short: boolean): Built | Short | null {
  const w = window(['productivity', 'real_wage'], geo, from, to)
  if (!w) return null
  const q = pct('productivity', geo, w)
  const p = pct('real_wage', geo, w)
  if (q == null || p == null) return null
  if (short) return `In ${place(geo)} in ${span(w)}, output per hour ${moved(q)} and real average wages ${moved(p)}.`
  const gap = q - p
  const headline = Math.abs(gap) <= 2 ? `In ${place(geo)}, average wages kept pace with productivity` : gap > 0 ? `In ${place(geo)}, average wages fell behind productivity` : `In ${place(geo)}, average wages grew faster than productivity`
  const meaning = Math.abs(gap) <= 2
    ? 'Average pay changed about as much as the output of an hour’s work.'
    : `The change in average pay was ${pts(gap)} ${gap > 0 ? 'below' : 'above'} the change in output per hour${p < 0 ? ', and pay fell after inflation' : ''}.`
  return {
    headline, period: span(w), meaning,
    stats: [{ value: signed(q), label: 'output per hour worked' }, { value: signed(p), label: 'real average wages' }],
    detail: ['Output per hour is not GDP per person, and average wages are not what the typical worker earns.'],
  }
}

function affordability(geo: string, from: number, to: number, short: boolean): Built | Short | null {
  const w = window(['house_price_real', 'disp_income_real'], geo, from, to)
  if (!w) return null
  const h = pct('house_price_real', geo, w)
  const i = pct('disp_income_real', geo, w)
  if (h == null || i == null) return null
  if (short) return `In ${place(geo)} in ${span(w)}, real house prices ${moved(h)} and real household income ${moved(i)}.`
  const gap = h - i
  const rel = gap > 0
    ? h > 0 ? `house prices rose ${i > 0 ? 'faster than incomes' : 'while incomes fell'}` : 'incomes fell more than house prices'
    : i > 0 ? `incomes ${h > 0 ? 'grew faster than house prices' : 'rose while house prices fell'}` : 'house prices fell more than incomes'
  const headline = Math.abs(gap) <= 2 ? `In ${place(geo)}, house prices and incomes moved roughly together` : `In ${place(geo)}, ${rel}`
  const meaning = Math.abs(gap) <= 2 ? 'Affordability relative to incomes barely changed.' : `Buying a home became ${gap > 0 ? 'less' : 'more'} affordable relative to incomes.`
  return {
    headline, period: span(w), meaning,
    stats: [{ value: signed(h), label: 'real house prices' }, { value: signed(i), label: 'real household income per person' }],
    detail: [],
  }
}

function europeUs(geo: string, from: number, to: number, short: boolean): Built | Short | null {
  const lvl = (id: string) => {
    const s = inRange(series(id, geo), from, to)
    return s.length >= 2 ? { a: s[0], b: s[s.length - 1] } : null
  }
  const g = lvl('gdp_pc_vs_us'), c = lvl('aic_vs_us'), wg = lvl('wage_vs_us')
  if (!g && !c && !wg) return null
  const items = ([[g, 'GDP per person'], [c, 'consumption per person'], [wg, 'average wages']] as const).filter(([x]) => x)
  if (short) return `In ${place(geo)}, ${items.map(([x, what]) => `${what} went from ${x!.a.value.toFixed(0)}% to ${x!.b.value.toFixed(0)}% of the US level (${x!.a.year}–${x!.b.year})`).join('; ')}.`
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
  const stats = items.map(([x, what]) => ({ value: `${x!.a.value.toFixed(0)} → ${x!.b.value.toFixed(0)}`, label: `${what}, US = 100 (${x!.a.year}–${x!.b.year})` }))
  const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
  const a = wa ? pct('gdp_pc_real', geo, wa) : null, b = wa ? pct('real_wage', geo, wa) : null
  const meaning = wa && a != null && b != null
    ? `Falling behind is not getting poorer: in absolute terms, real GDP per person ${moved(a)} and real average wages ${moved(b)} over ${span(wa)}.`
    : 'Falling behind the US is not the same as getting poorer.'
  return { headline, stats, meaning, detail: [] }
}

const DRIVER_Q: Record<string, string> = {
  'immigration-crime': 'immigration increased crime',
  'immigration-housing': 'immigration made housing more expensive',
  'immigration-growth': 'immigration contributed to economic growth',
  'immigration-employment': 'immigration took jobs from locals',
  'unemployment-crime': 'unemployment drove crime',
  'inequality-crime': 'inequality increased crime',
}

const BUILT: Record<string, { fn: Fn; covered: string[]; none: [string, string] }> = {
  'growth-wages': { fn: growthWages as Fn, covered: ['gdp_pc_real', 'median_earnings_real', 'real_wage'], none: ['The available data cannot establish whether typical workers became poorer in these years', 'There is not enough GDP and wage data. Widen the period.'] },
  'productivity-wages': { fn: productivityWages as Fn, covered: ['productivity', 'real_wage'], none: ['Not enough data to compare productivity and wages in these years', 'Widen the period.'] },
  'housing-affordability': { fn: affordability as Fn, covered: ['house_price_real', 'disp_income_real'], none: ['Not enough data to compare house prices and incomes in these years', 'Widen the period.'] },
  'europe-us': { fn: europeUs as Fn, covered: ['gdp_pc_vs_us', 'aic_vs_us', 'wage_vs_us'], none: ['Not enough data to compare with the US in these years', 'Widen the period.'] },
}

const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const plain = (id: string) => lc(INDICATORS[id].short.replace(/\s*\(.*?\)/g, ''))

/** One indicator's change as a key statistic. */
export function statFor(id: string, c: Change, withYears = false): Stat {
  const ind = INDICATORS[id]
  const value = c.pct != null ? signed(c.pct) : signed(c.abs, ind.format === 'pct1' ? ' pts' : '')
  const unit = c.pct == null && ind.format !== 'pct1' ? `, ${ind.unit}` : ''
  const label = `${ind.dimension === 'crime' ? 'recorded ' : ''}${plain(id)}${unit}${withYears ? `, ${c.first.year}–${c.last.year}` : ''}${c.breaks.length ? ' (series break)' : ''}`
  return { value, label }
}

/** Which way two selected indicators moved over the years both cover, e.g. "the foreign-born share rose while recorded robbery fell, 2008–2024". */
function describePair(a: string, b: string, from: number, to: number) {
  const p = comparePair(INDICATORS[a], INDICATORS[b], 'ES', from, to)
  if (!p.window || !p.a || !p.b) return null
  const name = (id: string) => `${/(share|rate)$/.test(plain(id)) ? 'the ' : ''}${INDICATORS[id].dimension === 'crime' ? 'recorded ' : ''}${plain(id)}`
  const dir = (c: Change) => ((c.pct != null ? Math.abs(c.pct) < 2 : Math.abs(c.abs) < 0.2) ? 'was little changed' : (c.pct ?? c.abs) > 0 ? 'rose' : 'fell')
  const da = dir(p.a), db = dir(p.b)
  const years = span(p.window)
  const text = da === db && da !== 'was little changed' ? `${name(a)} and ${name(b)} both ${da}, ${years}` : `${name(a)} ${da} while ${name(b)} ${db}, ${years}`
  return { text, period: years, stats: [statFor(a, p.a), statFor(b, p.b)] }
}

/** A direct, data-based finding for the investigation, or a statement that the data cannot give one. */
export function answerFor(relId: string, a: string, b: string, compare: string | null, from: number, to: number): Answer | null {
  const bt = BUILT[relId]
  if (bt) {
    const main = bt.fn('ES', from, to, false)
    if (!main) return { headline: bt.none[0], stats: [], meaning: bt.none[1], detail: [], covered: [] }
    const [f, t] = main.period ? main.period.split('–').map(Number) : [from, to]
    const other = compare && compare !== 'none' ? bt.fn(compare, f, t, true) : null
    return { ...main, detail: other ? [...main.detail, other] : main.detail, covered: bt.covered }
  }
  const d = describePair(a, b, from, to)
  const q = DRIVER_Q[relId]
  const dek = q ? `These figures alone cannot show whether ${q}; the research below weighs the evidence.` : undefined
  if (!d) return q ? { headline: `Too little overlapping data in ${from}–${to}`, dek: `Even with more data, national figures alone could not show whether ${q}.`, stats: [], meaning: '', detail: [], covered: [] } : null
  return { headline: `In Spain, ${d.text}`, dek, period: d.period, stats: d.stats, meaning: '', detail: [], covered: [a, b] }
}

export const isDriverQuestion = (relId: string) => relId in DRIVER_Q
export const isBuiltAnswer = (relId: string) => relId in BUILT
