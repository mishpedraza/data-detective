import { INDICATORS, series } from '../data/indicators'
import { change } from './compare'
import { commonWindow, moved, place, signed, span } from './answers'
import type { Finding } from './explain'

/**
 * The one thing the statistics alone don't reveal, computed from the data for the selected years.
 * Returns null when the pattern isn't there, so 02 falls back to research.
 */
const pc = (id: string, geo: string, w: [number, number]) => (INDICATORS[id] ? change(INDICATORS[id], geo, w[0], w[1])?.pct ?? null : null)
const at = (id: string, geo: string, y: number) => series(id, geo).find((p) => p.year === y)?.value

/** Why average wages and median pay diverge: pay distribution vs measurement. */
function wageGap(geo: string, from: number, to: number): Finding | null {
  const ids = ['real_wage', 'median_earnings_real', 'mean_earnings_real', 'wage_cpi_real', 'd1_earnings_real', 'd9_earnings_real']
  if (ids.some((id) => !INDICATORS[id])) return null
  const w = commonWindow(ids, geo, from, to)
  if (!w) return null
  const [avg, med, mean, cpi, d1, d9] = ids.map((id) => pc(id, geo, w))
  if ([avg, med, mean, cpi, d1, d9].some((v) => v == null)) return null
  const gap = avg! - med!
  if (Math.abs(gap) < 2) return null
  const dist = mean! - med!
  const measure = avg! - mean!
  const topAway = d9! > med! + 0.5
  const best = d1! >= med! && d1! >= d9! ? 'at the low end' : d9! >= med! ? 'at the high end' : 'in the middle'
  const spread = `low end ${signed(d1!)}, high end ${signed(d9!)}`
  if (gap > 0 && !topAway && dist <= 1) {
    return {
      lead: `Average wages outpaced median pay because they are measured differently, not because top earners pulled away.`,
      body: `In the earnings survey that measures median pay, average hourly pay ${moved(mean!)}, ${dist < -0.5 ? 'less than' : 'about as much as'} the median, and pay grew most ${best} (${spread}). The average-wage figure comes from national accounts, covers all employers and counts pay per full-time job per year; adjusted for the same consumer prices as median pay, it ${moved(cpi!)}.`,
      refs: ['eurostatSes', 'oecdWages'], years: w, role: 'method',
    }
  }
  if (gap > 0) {
    return {
      lead: topAway && d1! > d9! ? 'Part of the gap is pay in the middle falling behind both ends.' : topAway ? 'Part of the gap is pay at the top pulling away from the middle.' : 'Most of the gap is measurement, though the average also held up better than the median within the same survey.',
      body: `In the earnings survey that measures median pay, average hourly pay ${moved(mean!)}, high-end pay ${moved(d9!)} and low-end pay ${moved(d1!)}. The average-wage figure comes from national accounts and counts pay per full-time job per year${Math.abs(measure) > 1 ? `; that difference in measurement adds ${Math.abs(measure).toFixed(1)} points ${measure > 0 ? 'to' : 'against'} the average` : ''}.`,
      refs: ['eurostatSes', 'oecdWages'], years: w, role: 'method',
    }
  }
  return {
    lead: med! > d9! ? 'Median pay outpaced the average: pay in the middle caught up with the top.' : 'Median pay outpaced the average, though pay grew most at the top.',
    body: `In the earnings survey, low-end pay ${moved(d1!)} and high-end pay ${moved(d9!)}, while average hourly pay ${moved(mean!)}.`,
    refs: ['eurostatSes', 'oecdWages'], years: w, role: 'method',
  }
}

/** Output per hour can rise because hours fall faster than output. */
function productivityJobs(geo: string, from: number, to: number): Finding | null {
  const w = commonWindow(['productivity', 'employment', 'gdp_real'], geo, from, to)
  if (!w) return null
  const total = pc('productivity', geo, w)
  if (total == null || total < 2) return null
  let best: [number, number] | null = null, bestGain = 0
  for (let s = w[0]; s < w[1]; s++) {
    let e = s
    while (e < w[1] && (at('employment', geo, e + 1) ?? Infinity) < (at('employment', geo, e) ?? -Infinity)) e++
    if (e === s) continue
    const gain = pc('productivity', geo, [s, e]) ?? 0, out = pc('gdp_real', geo, [s, e]) ?? 0
    if (out < 0 && gain > bestGain) { best = [s, e]; bestGain = gain }
    s = e - 1
  }
  if (!best) return null
  const p = pc('productivity', geo, best), g = pc('gdp_real', geo, best)
  const lost = at('employment', geo, best[0])! - at('employment', geo, best[1])!
  if (p == null || g == null || p <= 0) return null
  const share = (Math.log(1 + p / 100) / Math.log(1 + total / 100)) * 100
  if (share < 40) return null
  const jobs = lost >= 1 ? `${lost.toFixed(1)} million` : `${Math.round(lost * 1000)} thousand`
  if (best[0] === w[0] && best[1] === w[1]) return {
    lead: `Output per hour rose because jobs disappeared faster than output fell.`,
    body: `Output ${moved(g)}, but ${jobs} jobs went. The rise in output per hour came from fewer hours worked, not from producing more.`,
    refs: ['eurostatNA'], years: w, kind: 'descriptive', role: 'data',
  }
  return {
    lead: `${share >= 75 ? 'Most' : 'Much'} of ${place(geo)}’s rise in output per hour came while jobs were disappearing.`,
    body: `In ${span(best)}, output ${moved(g)} but ${jobs} jobs went, so output per hour ${moved(p)}: about ${Math.round(Math.min(share, 100) / 5) * 5}% of the gain over ${span(w)}. The rise came from fewer hours worked, not from producing more.`,
    refs: ['eurostatNA'], years: w, kind: 'descriptive', role: 'data',
  }
}

/** How much of GDP growth came from a larger population, and how much of that from more foreign-born residents. */
function populationGrowth(geo: string, from: number, to: number, a?: string): Finding | null {
  const w = commonWindow([...(a && INDICATORS[a] ? [a] : []), 'gdp_real', 'gdp_pc_real'], geo, from, to)
  if (!w) return null
  const g = pc('gdp_real', geo, w), gp = pc('gdp_pc_real', geo, w)
  if (g == null || gp == null || g <= 2) return null
  const pop = ((1 + g / 100) / (1 + gp / 100) - 1) * 100
  const share = (Math.log(1 + pop / 100) / Math.log(1 + g / 100)) * 100
  if (pop <= 1) return null
  const wf = commonWindow(['foreign_born', 'foreign_born_share'], geo, w[0], w[1])
  let fb = ''
  if (wf) {
    const people = (y: number) => at('foreign_born', geo, y)! / (at('foreign_born_share', geo, y)! / 100)
    const dPop = people(wf[1]) - people(wf[0])
    const dFb = at('foreign_born', geo, wf[1])! - at('foreign_born', geo, wf[0])!
    if (dPop > 0 && dFb > 0) fb = ` Foreign-born residents rose by ${(dFb / 1e6).toFixed(1)} million${wf[0] !== w[0] || wf[1] !== w[1] ? ` in ${span(wf)}` : ''}, ${dFb >= dPop ? 'more than the whole population increase' : `about ${Math.round((dFb / dPop) * 100 / 5) * 5}% of it`}.`
  }
  if (gp <= 0.05) return {
    lead: `All of ${place(geo)}’s economic growth came from having more people; output per person ${gp < -0.05 ? 'fell' : 'did not grow'}.`,
    body: `The population grew ${pop.toFixed(1)}% over ${span(w)}, while output per person ${moved(gp)}.${fb}`,
    refs: ['eurostatNA'], years: w, kind: 'descriptive', role: 'data',
  }
  return {
    lead: share >= 55 ? `Most of ${place(geo)}’s economic growth came from having more people, not more output per person.` : share >= 45 ? `About half of ${place(geo)}’s economic growth came from having more people, not more output per person.` : `About ${Math.round(share / 5) * 5}% of ${place(geo)}’s economic growth came from having more people.`,
    body: `The population grew ${pop.toFixed(1)}% over ${span(w)}.${fb}`,
    refs: ['eurostatNA'], years: w, kind: 'descriptive', role: 'data',
  }
}

export function insightFor(relId: string, geo: string, from: number, to: number, a?: string): Finding | null {
  if (relId === 'growth-wages') return wageGap(geo, from, to)
  if (relId === 'productivity-wages') return productivityJobs(geo, from, to)
  if (relId === 'immigration-growth') return populationGrowth(geo, from, to, a)
  return null
}
