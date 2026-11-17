import { COUNTRIES } from '../data/countries'
import { INDICATORS, series } from '../data/indicators'
import { change, comparePair, type Change } from './compare'
import { inRange } from './stats'
import type { Point } from '../data/types'

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

type Built = { headline: string; period?: string; stats: Stat[]; meaning: string; detail: string[]; covered?: string[] }
type Short = string
type Fn = { (geo: string, from: number, to: number, short: true, a?: string, b?: string): Short | null; (geo: string, from: number, to: number, short: false, a?: string, b?: string): Built | null }

/** Measures of how the typical person fared, in order of preference for the growth question. */
const TYPICAL: Record<string, { who: string; what: string; label: (geo: string) => string }> = {
  median_earnings_real: { who: 'typical workers', what: 'typical workers’ real pay', label: (geo) => (INDICATORS.median_earnings_real.geoUnits?.[geo] ? 'real median weekly pay of full-time workers' : 'real median hourly pay') },
  median_income_real: { who: 'typical households', what: 'typical household income', label: () => 'real median household income' },
}
const uc1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function growthWages(geo: string, from: number, to: number, short: boolean, _a?: string, b?: string): Built | Short | null {
  const order = b === 'median_income_real' ? ['median_income_real', 'median_earnings_real'] : ['median_earnings_real', 'median_income_real']
  const m = order.find((id) => window(['gdp_pc_real', id], geo, from, to))
  const P = place(geo)
  if (!m) {
    if (short) return null
    const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
    const a = wa ? pct('real_wage', geo, wa) : null
    const g = wa ? pct('gdp_pc_real', geo, wa) : null
    return {
      headline: `The available data cannot establish whether typical workers or households in ${P} became poorer in ${from}–${to}`,
      stats: [],
      meaning: 'Median pay is surveyed only in 2006, 2010, 2014, 2018 and 2022, and median household income only from 2004; this period includes fewer than two years of either.',
      detail: wa && a != null && g != null ? [`For context only, not the typical person: real GDP per person ${moved(g)} and real average wages, which high earners pull up, ${moved(a)} over ${span(wa)}.`] : [],
      covered: [],
    }
  }
  const T = TYPICAL[m]
  const w = window(['gdp_pc_real', m], geo, from, to)!
  const g = pct('gdp_pc_real', geo, w)
  const p = pct(m, geo, w)
  const gy = cagr('gdp_pc_real', geo, w)
  const py = cagr(m, geo, w)
  if (g == null || p == null || gy == null || py == null) return null
  if (short) return `In ${P} in ${span(w)}, real GDP per person ${moved(g)} and ${T.label(geo)} ${moved(p)}.`
  const gap = g - p
  const econ = gy > FLAT ? 'grew' : gy < -FLAT ? 'shrank' : 'stalled'
  const pay = py > FLAT ? 'rose' : py < -FLAT ? 'fell' : 'barely changed'
  const headline =
    pay === 'rose'
      ? econ === 'grew'
        ? gap > 2 ? `${uc1(T.what)} rose in ${P}, but less than the economy` : gap < -2 ? `${uc1(T.what)} in ${P} grew faster than the economy` : `${P}’s economy and ${T.what} grew together`
        : `${uc1(T.what)} rose in ${P} while the economy ${econ}`
      : econ === 'grew'
        ? `${P}’s economy grew, but ${T.what} ${pay}`
        : `${P}’s economy ${econ} and ${T.what} ${pay}`
  const meaning =
    pay === 'fell'
      ? `${uc1(T.who)} lost purchasing power${econ === 'grew' ? ', a real decline, not just a smaller share of growth' : ''}.`
      : pay === 'barely changed'
        ? `${uc1(T.who)} did not become poorer${econ === 'grew' ? ', but the growth did not reach them' : ''}.`
        : gap > 2 ? `${uc1(T.who)} became better off, but by less than the economy grew.` : `${uc1(T.who)} became better off.`
  const other = order.find((id) => id !== m)!
  const spans = (id: string) => w.every((y) => series(id, geo).some((x) => x.year === y))
  const po = spans(other) ? pct(other, geo, w) : null
  const avg = spans('real_wage') ? pct('real_wage', geo, w) : null
  const yr = (v: number) => `${signed(v)} a year`
  const detail = [`Per year: GDP per person ${yr(gy)}, ${T.label(geo).replace(/^real /, '')} ${yr(py)}.`]
  if (m !== order[0]) detail.push(`${uc1(TYPICAL[order[0]].label(geo))} has fewer than two observations in these years, so the answer uses ${T.label(geo)}.`)
  if (m === 'median_income_real' || (po != null && other === 'median_income_real')) detail.push('Median household income is income after taxes and benefits, adjusted for household size, from the EU-SILC survey; each survey year reports the previous year’s income.')
  if (avg != null && Math.abs(avg - p) > 2 && m === 'median_earnings_real') detail.push(`Average wages, which high earners pull up, changed ${signed(avg)} against ${signed(p)} for median pay, so pay ${avg > p ? 'at the top did better than in the middle' : 'in the middle did better than the average'}.`)
  if (w[0] > from || w[1] < to) detail.push(`These figures cover ${span(w)}, the years within your selection with data for both measures.`)
  const stats = [
    { value: signed(g), label: 'real GDP per person' },
    { value: signed(p), label: T.label(geo) },
    ...(avg != null && (b === 'real_wage' || po == null) ? [{ value: signed(avg), label: 'real average wages' }] : po != null ? [{ value: signed(po), label: TYPICAL[other].label(geo) }] : []),
  ]
  return { headline, period: span(w), stats, meaning, detail, covered: ['gdp_pc_real', m, ...(avg != null && (b === 'real_wage' || po == null) ? ['real_wage'] : po != null ? [other] : [])] }
}

const WAGE: Record<string, { noun: string; label: string }> = {
  real_wage: { noun: 'average wages', label: 'real average wages' },
  median_earnings_real: { noun: 'median pay', label: 'real median hourly pay' },
}

function productivityWages(geo: string, from: number, to: number, short: boolean, _a?: string, b?: string): Built | Short | null {
  const wid = b && b in WAGE ? b : 'real_wage'
  const W = { ...WAGE[wid], label: wid === 'median_earnings_real' ? TYPICAL.median_earnings_real.label(geo) : WAGE[wid].label }
  const w = window(['productivity', wid], geo, from, to)
  if (!w) return null
  const q = pct('productivity', geo, w)
  const p = pct(wid, geo, w)
  if (q == null || p == null) return null
  if (short) return `In ${place(geo)} in ${span(w)}, output per hour ${moved(q)} and ${W.label} ${moved(p)}.`
  const gap = q - p
  const headline = Math.abs(gap) <= 2 ? `In ${place(geo)}, ${W.noun} kept pace with productivity` : gap > 0 ? `In ${place(geo)}, ${W.noun} fell behind productivity` : `In ${place(geo)}, ${W.noun} grew faster than productivity`
  const meaning = Math.abs(gap) <= 2
    ? `${uc1(W.noun)} changed about as much as the output of an hour’s work.`
    : `The change in ${W.noun} was ${pts(gap)} ${gap > 0 ? 'below' : 'above'} the change in output per hour${p < 0 ? ', and pay fell after inflation' : ''}.`
  const detail = ['Output per hour is adjusted for the prices of everything the economy produces, wages for consumer prices, so part of any gap can reflect differences between those prices rather than pay.']
  if (wid === 'real_wage') detail.push('Average wages are not what the typical worker earns; select median pay to compare the middle of the distribution.')
  if (w[0] > from || w[1] < to) detail.push(`These figures cover ${span(w)}, the years within your selection with data for both measures.`)
  return {
    headline, period: span(w), meaning,
    stats: [{ value: signed(q), label: 'output per hour worked' }, { value: signed(p), label: W.label }],
    detail, covered: ['productivity', wid],
  }
}

/** Years where a series turns, ignoring swings smaller than `th` (15%). */
function turningPoints(pts: Point[], th = 0.15): Point[] {
  if (pts.length < 3) return []
  const out: Point[] = []
  let dir = 0, cand = pts[0], lo = pts[0], hi = pts[0]
  for (const p of pts.slice(1)) {
    if (dir === 0) {
      if (p.value > hi.value) hi = p
      if (p.value < lo.value) lo = p
      if (hi.value >= lo.value * (1 + th) && hi.year > lo.year) { dir = 1; cand = hi; if (lo.year > pts[0].year) out.push(lo) }
      else if (lo.value <= hi.value * (1 - th) && lo.year > hi.year) { dir = -1; cand = lo; if (hi.year > pts[0].year) out.push(hi) }
    } else if (dir === 1) {
      if (p.value > cand.value) cand = p
      else if (p.value <= cand.value * (1 - th)) { out.push(cand); cand = p; dir = -1 }
    } else {
      if (p.value < cand.value) cand = p
      else if (p.value >= cand.value * (1 + th)) { out.push(cand); cand = p; dir = 1 }
    }
  }
  return out.filter((p) => p.year < pts[pts.length - 1].year)
}

/** Monthly payment per unit borrowed on a 25-year loan at an annual rate in %. */
const annuity = (rate: number) => { const m = rate / 1200; return m === 0 ? 1 / 300 : m / (1 - (1 + m) ** -300) }
/** Change in a ratio, in %, from the % changes of its numerator and denominator. */
const ratioPct = (num: number, den: number) => ((1 + num / 100) / (1 + den / 100) - 1) * 100

const HOUSING_REAL: Record<string, string> = { house_price_real: 'house prices', rent_real: 'rents' }
const INCOME_REAL: Record<string, { noun: string; label: string }> = {
  disp_income_real: { noun: 'incomes', label: 'real household income per person' },
  median_income_real: { noun: 'incomes', label: 'real median household income' },
  real_wage: { noun: 'wages', label: 'real average wages' },
}

function affordability(geo: string, from: number, to: number, short: boolean, a?: string, b?: string): Built | Short | null {
  const hid = a && a in HOUSING_REAL ? a : 'house_price_real'
  const iid = b && b in INCOME_REAL ? b : 'disp_income_real'
  const hn = HOUSING_REAL[hid], I = INCOME_REAL[iid], inc = I.noun
  const w = window([hid, iid], geo, from, to)
  if (!w) return null
  const h = pct(hid, geo, w)
  const i = pct(iid, geo, w)
  if (h == null || i == null) return null
  const r = ratioPct(h, i)
  if (short) return `In ${place(geo)} in ${span(w)}, real ${hn} ${moved(h)} and ${I.label} ${moved(i)}, so ${hn} relative to ${inc} ${moved(r)}.`
  const gap = h - i
  const rel = gap > 0
    ? h > 0 ? `${hn} rose ${i > 0 ? `faster than ${inc}` : `while ${inc} fell`}` : `${inc} fell more than ${hn}`
    : i > 0 ? `${inc} ${h > 0 ? `grew faster than ${hn}` : `rose while ${hn} fell`}` : `${hn} fell more than ${inc}`
  const flat = Math.abs(r) <= 2
  const headline = flat ? `In ${place(geo)}, ${hn} and ${inc} moved roughly together` : `In ${place(geo)}, ${rel}`
  const isHouse = hid === 'house_price_real'
  const meaning = isHouse
    ? flat
      ? `Measured by purchase price, affordability relative to ${inc} barely changed; monthly mortgage payments also depend on interest rates.`
      : `Measured by purchase price, a home cost ${Math.abs(r).toFixed(0)}% ${r > 0 ? 'more' : 'less'} relative to ${inc} in ${w[1]} than in ${w[0]}; monthly mortgage payments also depend on interest rates.`
    : flat
      ? `Rents relative to ${inc} barely changed.`
      : `Relative to ${inc}, rents were ${Math.abs(r).toFixed(0)}% ${r > 0 ? 'higher' : 'lower'} in ${w[1]} than in ${w[0]}.`
  const detail: string[] = []
  const prices = inRange(series(hid, geo), w[0], w[1])
  const cuts = [w[0], ...turningPoints(prices).map((p) => p.year), w[1]]
  if (cuts.length > 2) {
    const parts = cuts.slice(1).map((y, k) => {
      const s: [number, number] = [cuts[k], y]
      const x = pct(hid, geo, s), z = pct(iid, geo, s)
      return x != null && z != null ? `${span(s)}, ${hn} ${signed(x)} and ${inc} ${signed(z)}` : null
    })
    if (parts.every(Boolean)) detail.push(`By phase: ${parts.join('; ')}.`)
    const peak = prices.reduce((m, p) => (p.value > m.value ? p : m), prices[0])
    const end = prices[prices.length - 1]
    if (peak.year < end.year && end.value < peak.value) detail.push(`Real ${hn} in ${end.year} were still ${((1 - end.value / peak.value) * 100).toFixed(0)}% below their ${peak.year} peak.`)
  }
  if (isHouse) {
    const wm = window([hid, iid, 'mortgage_rate'], geo, w[0], w[1])
    if (wm) {
      const r0 = series('mortgage_rate', geo).find((p) => p.year === wm[0])!.value
      const r1 = series('mortgage_rate', geo).find((p) => p.year === wm[1])!.value
      const hm = pct(hid, geo, wm), im = pct(iid, geo, wm)
      if (hm != null && im != null) {
        const pay = ratioPct((1 + hm / 100) * (annuity(r1) / annuity(r0)) * 100 - 100, im)
        detail.push(`Mortgage payments: the average rate on new home loans went from ${r0.toFixed(1)}% in ${wm[0]} to ${r1.toFixed(1)}% in ${wm[1]}. For a 25-year loan covering the same share of the price, the monthly payment relative to ${inc} ${moved(pay)}, against ${signed(ratioPct(hm, im))} for the purchase price relative to ${inc}.`)
      }
    }
    const oecd = pct('price_to_income', geo, w)
    if (oecd != null) detail.push(`OECD’s price-to-income ratio, which divides nominal prices by nominal disposable income per person, changed ${signed(oecd)} over the same years; it measures income slightly differently.`)
  }
  if (iid === 'median_income_real') detail.push('Median household income comes from the EU-SILC survey; each survey year reports the previous year’s income.')
  if (a && a !== hid) detail.push(`The headline compares real house prices with ${I.label}; ${INDICATORS[a].short.toLowerCase()} is shown separately because it is not an inflation-adjusted price.`)
  if (w[0] > from || w[1] < to) detail.push(`These figures cover ${span(w)}, the years within your selection with data for both measures.`)
  return {
    headline, period: span(w), meaning,
    stats: [
      { value: signed(h), label: `real ${hn}` },
      { value: signed(i), label: I.label },
      { value: signed(r), label: `${hn} relative to ${inc}` },
    ],
    detail, covered: [hid, iid],
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
    const main = bt.fn('ES', from, to, false, a, b)
    if (!main) return { headline: bt.none[0], stats: [], meaning: bt.none[1], detail: [], covered: [] }
    const [f, t] = main.period ? main.period.split('–').map(Number) : [from, to]
    const other = compare && compare !== 'none' ? bt.fn(compare, f, t, true, a, b) : null
    return { ...main, detail: other ? [...main.detail, other] : main.detail, covered: main.covered ?? bt.covered }
  }
  const d = describePair(a, b, from, to)
  const q = DRIVER_Q[relId]
  const dek = q ? `These figures alone cannot show whether ${q}; the research below weighs the evidence.` : undefined
  if (!d) return q ? { headline: `Too little overlapping data in ${from}–${to}`, dek: `Even with more data, national figures alone could not show whether ${q}.`, stats: [], meaning: '', detail: [], covered: [] } : null
  return { headline: `In Spain, ${d.text}`, dek, period: d.period, stats: d.stats, meaning: '', detail: [], covered: [a, b] }
}

export const isDriverQuestion = (relId: string) => relId in DRIVER_Q
export const isBuiltAnswer = (relId: string) => relId in BUILT

export { window as commonWindow, signed, span, place, moved }
