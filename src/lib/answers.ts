import { COUNTRIES } from '../data/countries'
import { INDICATORS, series } from '../data/indicators'
import { change } from './compare'
import { inRange } from './stats'

export interface Answer {
  /** One plain-English sentence answering the question. */
  verdict: string
  /** The figures behind the verdict. */
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

type Built = { verdict: string; text: string } | null

function growthWages(geo: string, from: number, to: number, short: boolean): Built {
  const w = window(['gdp_pc_real', 'median_earnings_real'], geo, from, to)
  if (!w) {
    if (short) return null
    const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
    const a = wa ? pct('real_wage', geo, wa) : null
    const g = wa ? pct('gdp_pc_real', geo, wa) : null
    return {
      verdict: `The available data cannot establish whether typical workers in ${place(geo)} became poorer in ${from}–${to}.`,
      text: `Median pay, the best measure of the typical worker, is only surveyed in 2006, 2010, 2014, 2018 and 2022, and this period does not include two of those years.${wa && a != null && g != null ? ` For context only: real GDP per person ${moved(g)} and real average wages, which high earners pull up, ${moved(a)} over ${wa[0]}–${wa[1]}.` : ''}`,
    }
  }
  const g = pct('gdp_pc_real', geo, w)
  const p = pct('median_earnings_real', geo, w)
  if (g == null || p == null) return null
  if (short) return { verdict: '', text: `In ${place(geo)} over the same years, real GDP per person ${moved(g)} and real median hourly pay ${moved(p)}.` }
  const gap = g - p
  const verdict =
    p < -1
      ? `Typical workers in ${place(geo)} lost wage purchasing power${g > 2 ? ', even though the economy grew' : ''}.`
      : p > 1
        ? `Typical workers in ${place(geo)} gained wage purchasing power${gap > 2 ? ', but their pay grew more slowly than the economy' : gap < -2 ? ', and their pay grew faster than the economy' : ', roughly in step with the economy'}.`
        : `Typical workers’ wage purchasing power in ${place(geo)} barely changed${g > 2 ? ', while the economy grew' : ''}.`
  const out = [`Between ${w[0]} and ${w[1]}, real GDP per person ${moved(g)} and real median hourly pay ${moved(p)}${Math.abs(gap) > 2 ? `, a gap of ${pts(gap)}` : ''}.`]
  const avg = pct('real_wage', geo, w)
  if (avg != null) out.push(`Average wages, which high earners pull up, ${moved(avg)}${avg - p > 2 ? ', so pay in the middle grew more slowly than the average' : avg - p < -2 ? ', so pay in the middle grew faster than the average' : ''}.`)
  if (w[0] > from || w[1] < to) out.push(`Median pay is surveyed every four years, so the comparison uses ${w[0]}–${w[1]}.`)
  return { verdict, text: out.join(' ') }
}

function productivityWages(geo: string, from: number, to: number, short: boolean): Built {
  const w = window(['productivity', 'real_wage'], geo, from, to)
  if (!w) return null
  const q = pct('productivity', geo, w)
  const p = pct('real_wage', geo, w)
  if (q == null || p == null) return null
  if (short) return { verdict: '', text: `In ${place(geo)} over the same years, output per hour ${moved(q)} and real average wages ${moved(p)}.` }
  const gap = q - p
  const verdict = Math.abs(gap) <= 2 ? `In ${place(geo)}, average wages kept pace with productivity.` : gap > 0 ? `No: in ${place(geo)}, average wages fell behind productivity.` : `Yes: in ${place(geo)}, average wages grew faster than productivity.`
  return { verdict, text: `Between ${w[0]} and ${w[1]}, output per hour worked ${moved(q)} and real average wages ${moved(p)}${Math.abs(gap) > 2 ? `, a gap of ${pts(gap)}` : ''}. Output per hour is not GDP per person, and average wages are not what the typical worker earns.` }
}

function affordability(geo: string, from: number, to: number, short: boolean): Built {
  const w = window(['house_price_real', 'disp_income_real'], geo, from, to)
  if (!w) return null
  const h = pct('house_price_real', geo, w)
  const i = pct('disp_income_real', geo, w)
  if (h == null || i == null) return null
  if (short) return { verdict: '', text: `In ${place(geo)} over the same years, real house prices ${moved(h)} and real household income ${moved(i)}.` }
  const gap = h - i
  const verdict = gap > 2 ? `In ${place(geo)}, house prices rose much faster than incomes, so buying a home became less affordable.` : gap < -2 ? `In ${place(geo)}, incomes grew faster than house prices, so buying a home became more affordable.` : `In ${place(geo)}, house prices and incomes moved roughly together.`
  return { verdict, text: `Between ${w[0]} and ${w[1]}, real house prices ${moved(h)} and real household income per person ${moved(i)}${Math.abs(gap) > 2 ? `, a gap of ${pts(gap)}` : ''}. The research below looks at why.` }
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
  if (short) return { verdict: '', text: `In ${place(geo)}, ${parts.join('; ')}.` }
  const d = (x: ReturnType<typeof lvl>) => (x ? x.b.value - x.a.value : 0)
  const behind = items.filter(([x]) => d(x) < -1).map(([, w]) => w)
  const ahead = items.filter(([x]) => d(x) > 1).map(([, w]) => w)
  const list = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0])
  const verdict = behind.length && ahead.length
    ? `It depends on the measure: ${place(geo)} caught up with the US in ${list(ahead)} but fell further behind in ${list(behind)}.`
    : behind.length
      ? `Relative to Americans, yes: ${place(geo)} fell further behind in ${list(behind)}.`
      : ahead.length
        ? `No: ${place(geo)} caught up with the US in ${list(ahead)}.`
        : `${place(geo)}’s position relative to the US barely changed.`
  const out = [`In ${place(geo)}, ${parts.join('; ')}.`]
  const wa = window(['gdp_pc_real', 'real_wage'], geo, from, to)
  if (wa) {
    const a = pct('gdp_pc_real', geo, wa), b = pct('real_wage', geo, wa)
    if (a != null && b != null) out.push(`Falling behind is not the same as getting poorer: in absolute terms, real GDP per person ${moved(a)} and real average wages ${moved(b)} over ${wa[0]}–${wa[1]}.`)
  }
  return { verdict, text: out.join(' ') }
}

const DRIVER_Q: Record<string, string> = {
  'immigration-crime': 'immigration increased crime',
  'immigration-housing': 'immigration made housing more expensive',
  'immigration-growth': 'immigration contributed to economic growth',
  'immigration-employment': 'immigration took jobs from locals',
  'unemployment-crime': 'unemployment drove crime',
  'inequality-crime': 'inequality increased crime',
}

const BUILT: Record<string, { fn: (geo: string, from: number, to: number, short: boolean) => Built; covered: string[]; none: string }> = {
  'growth-wages': { fn: growthWages, covered: ['gdp_pc_real', 'median_earnings_real', 'real_wage'], none: 'The available data cannot establish whether typical workers became poorer in these years: there is not enough GDP and wage data. Widen the period.' },
  'productivity-wages': { fn: productivityWages, covered: ['productivity', 'real_wage'], none: 'The available data cannot answer this for these years: there is not enough productivity and wage data. Widen the period.' },
  'housing-affordability': { fn: affordability, covered: ['house_price_real', 'disp_income_real'], none: 'The available data cannot answer this for these years: there is not enough house-price and income data. Widen the period.' },
  'europe-us': { fn: europeUs, covered: ['gdp_pc_vs_us', 'aic_vs_us', 'wage_vs_us'], none: 'The available data cannot answer this for these years: there is not enough data compared with the US. Widen the period.' },
}

/** A direct, data-based answer to the investigation's question, or a statement that the data cannot give one. */
export function answerFor(relId: string, compare: string | null, from: number, to: number): Answer | null {
  const b = BUILT[relId]
  if (b) {
    const main = b.fn('ES', from, to, false)
    if (!main) return { verdict: b.none, text: '', covered: [] }
    const other = compare && compare !== 'none' ? b.fn(compare, from, to, true) : null
    return { verdict: main.verdict, text: other ? `${main.text} ${other.text}` : main.text, covered: b.covered }
  }
  const q = DRIVER_Q[relId]
  return q ? { verdict: `The national figures alone cannot establish whether ${q}.`, text: 'They show what happened, below; the research in section 02 is the better guide to cause.', covered: [] } : null
}

export const isDriverQuestion = (relId: string) => relId in DRIVER_Q
