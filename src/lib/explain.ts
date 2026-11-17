import { COUNTRIES } from '../data/countries'
import { INDICATORS, series } from '../data/indicators'
import { studyById } from '../data/research'
import { BROADER, DRIVER_RESEARCH, TOPIC, countryEvidence, relationshipEvidence, trendEvidence } from '../data/evidence'
import type { Claim, Indicator, Relationship } from '../data/types'
import { inRange } from './stats'
import { change } from './compare'
import { insightFor } from './insights'
import { answerFor, isBuiltAnswer, isDriverQuestion, statFor, type Stat } from './answers'

type Dir = 'rose' | 'fell' | 'stable'
/** `role` marks data or measurement notes, which support research on the question but never lead 02. */
export type Finding = { lead: string; body?: string; refs: string[]; kind?: string; years?: [number, number]; role?: 'data' | 'method' }

const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const nm = (ind: Indicator) => lc(ind.short.replace(/\s*\(.*?\)/g, ''))
export const firstSentence = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z“"])/)[0]

function summarise(ind: Indicator, geo: string, from: number, to: number) {
  const pts = inRange(series(ind.id, geo), from, to)
  if (pts.length < 2) return null
  const first = pts[0]
  const last = pts[pts.length - 1]
  const rel = (last.value - first.value) / Math.abs(first.value || 1)
  const dir: Dir = Math.abs(rel) < 0.05 ? 'stable' : rel > 0 ? 'rose' : 'fell'
  const gaps = to - from + 1 - pts.length
  return { pts, first, last, rel, dir, gaps }
}

/** A study must cover at least this share of the answer's years to lead 02. */
export const MIN_OVERLAP = 1 / 3

/** Share of the selected years that a study's years cover. */
export function overlapShare(y: [number, number], from: number, to: number) {
  return Math.max(0, Math.min(to, y[1]) - Math.max(from, y[0])) / Math.max(1, to - from)
}

/** Years a finding covers: its own, or the span of its studies when every study states one. */
export function findingYears(f: Finding): [number, number] | null {
  if (f.years) return f.years
  const ys = f.refs.map((id) => studyById(id)?.years)
  if (!ys.length || ys.some((y) => !y)) return null
  return [Math.min(...ys.map((y) => y![0])), Math.max(...ys.map((y) => y![1]))]
}

/** Everything the three sections say for a selection, independent of rendering, so it can be tested. */
export function explain(rel: Relationship, a: string, b: string, compare: string | null, from: number, to: number) {
  const A = INDICATORS[a]
  const B = INDICATORS[b]
  const sa = summarise(A, 'ES', from, to)
  const sb = summarise(B, 'ES', from, to)
  const isImmCrime = rel.id === 'immigration-crime' || (A.dimension === 'immigration' && B.dimension === 'crime')
  const crimeInd = B.dimension === 'crime' ? B : A.dimension === 'crime' ? A : null
  const immInd = A.dimension === 'immigration' ? A : B.dimension === 'immigration' ? B : null
  const trend = B.dimension === 'crime' ? trendEvidence(B.id) : null
  const relEv = isImmCrime && crimeInd && immInd ? relationshipEvidence(immInd.dimension, crimeInd.id) : null
  const sc = crimeInd === B ? sb : crimeInd === A ? sa : null
  const crimeDir = sc ? (sc.dir === 'rose' ? 'rise' : sc.dir === 'fell' ? 'fall' : 'stable') : null
  const profile = trend && relEv
    ? {
        noun: trend.noun, recorded: trend.measurement, explanations: trend.explanations, trend: trend.studies,
        confounders: relEv.confounders, periods: relEv.periods, synthesis: relEv.synthesis,
        direct: relEv.studies.filter((x) => !x.broader && !BROADER.has(x)), broader: relEv.studies.filter((x) => x.broader || BROADER.has(x)),
        gap: relEv.gap, causal: relEv.causal, uncertain: relEv.uncertain, summary: trend.summaryDir === 'any' || trend.summaryDir === crimeDir ? trend.summary : `No verified explanation covers this ${crimeDir === 'stable' ? 'flat trend' : crimeDir ?? 'movement'} in the selected years. ${trend.gap}`, trendGap: trend.gap,
      }
    : null
  const cmpEv = profile && compare && compare !== 'EU27_2020' && crimeInd ? countryEvidence(crimeInd.id, compare, COUNTRIES[compare].name, profile.noun) : null
  const overlaps = (y?: [number, number]) => !y || (y[0] <= to && y[1] > from)
  const explanations = trend && crimeDir ? trend.explanations.filter((e) => (e.explains === 'any' || e.explains === crimeDir) && overlaps(e.years)) : []
  const confounders = profile ? profile.confounders.filter((c) => overlaps(c.years)) : []
  const ans = answerFor(rel.id, a, b, compare, from, to)
  const findings: Finding[] = []
  const insight = insightFor(rel.id, 'ES', from, to, a)
  if (insight) findings.push(insight)
  const kindLabel = (f: Finding) => {
    const ds = (f.kind ? [f.kind] : f.refs.map((id) => studyById(id)?.design)).filter((d) => d && d !== 'descriptive')
    if (!ds.length) return ''
    if (ds.every((d) => d === 'causal')) return 'causal evidence'
    if (ds.every((d) => d === 'review')) return 'review of studies'
    if (ds.every((d) => d === 'model')) return f.refs.some((id) => studyById(id)?.design === 'descriptive') ? 'model and descriptive analysis, not proof of cause' : 'estimated model, not proof of cause'
    if (ds.some((d) => d === 'causal')) return 'causal and correlational studies'
    return 'correlation, not proof of cause'
  }
  const periodLabel = (f: Finding) => {
    const y = findingYears(f)
    return y && (y[0] > from || y[1] < to) ? `covers ${y[0]}–${y[1]} only` : ''
  }
  const cmpDirect = cmpEv?.direct.length ? cmpEv.direct[0] : null
  const driverRes = crimeInd ? DRIVER_RESEARCH[rel.id] : undefined
  if (driverRes && crimeInd) {
    const fs = driverRes.findings.filter((f) => f.outcomes.includes(crimeInd.id))
    for (const f of fs) findings.push({ lead: f.lead, body: f.text, refs: f.refs, kind: f.design })
    if (!fs.length) { const n = driverRes.none(trend?.noun ?? nm(crimeInd)); findings.push({ lead: n.lead, body: n.text, refs: [] }) }
  }
  if (trend && !profile && !driverRes) {
    const ev = explanations.filter((e) => e.status === 'evidence')
    const doc = explanations.filter((e) => e.status === 'documented')
    for (const e of [ev[0], doc[0] ?? ev[1]].filter(Boolean)) findings.push({ lead: e.lead, body: firstSentence(e.text), refs: e.refs ?? [] })
  }
  if (profile && relEv) {
    const first = firstSentence(relEv.causal)
    const k = first.indexOf(':')
    const lead = k > 0 ? `${first.slice(0, k)}.` : first
    const body = k > 0 ? uc(first.slice(k + 1).trim().replace(/,? and none (covers|is about) Spain\.?$/, '.').replace(/\.\.$/, '.')) : undefined
    findings.push({ lead, body, refs: profile.direct.map((d) => d.id), kind: /association, not proof/.test(first) ? 'association' : undefined })
  }
  if (cmpDirect && compare && !findings.some((f) => f.refs.includes(cmpDirect.id))) {
    const st = studyById(cmpDirect.id)
    if (st) findings.push({ lead: `In ${COUNTRIES[compare].name}: ${/^[A-Z][a-z ]/.test(st.headline) ? st.headline.charAt(0).toLowerCase() + st.headline.slice(1) : st.headline}`, refs: [st.id] })
  }
  if (cmpEv && !cmpDirect && compare && cmpEv.gap) findings.push({ lead: `In ${COUNTRIES[compare].name}: no study answers this for ${profile?.noun ?? 'this offence'}.`, body: cmpEv.gap, refs: [] })
  const topic = TOPIC[rel.id]
  const inYears = (s: [number, number]) => Math.max(from, s[0]) < Math.min(to, s[1])
  const phases = topic?.phases?.filter((p) => inYears(p.span)) ?? []
  if (!trend && phases.length) {
    const join = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0])
    findings.push(phases.length === 1
      ? { lead: phases[0].lead, body: phases[0].context, refs: phases[0].refs }
      : { lead: `Research links ${join(phases.map((p) => p.clause))}.`, body: phases.map((p) => p.summary).join(' '), refs: [...new Set(phases.flatMap((p) => p.refs))] })
    for (const p of phases) for (const f of p.findings) findings.push({ lead: f.lead, body: f.text, refs: f.refs ?? [] })
  }
  let gapLeads = false
  if (!trend && topic) {
    const fits = (f: { years?: [number, number] }) => !f.years || inYears(f.years)
    const ap = ans?.period?.split('–').map(Number)
    const [af, at] = ap?.length === 2 ? ap : [from, to]
    const dated = topic.findings.filter((f) => f.years)
    const best = dated.find((f) => overlapShare(f.years!, af, at) >= MIN_OVERLAP)
    const lead = dated[0]
    if (rel.id === 'growth-wages') {
      gapLeads = true
      findings.push({
        lead: topic.gap,
        body: 'A growing economy can produce more per person while the buying power of a typical worker’s pay or household’s income changes very little.',
        refs: [],
      })
    } else if (!phases.length && best) findings.push({ lead: best.lead, body: best.text, refs: best.refs ?? [], years: best.years })
    else if (!phases.length && lead?.years) {
      gapLeads = true
      const intro = `The closest verified study covers ${lead.years[0]}–${lead.years[1]}. ${lead.lead}`
      const more = `${intro} ${firstSentence(lead.text)}`
      findings.push({ lead: topic.gap, body: more.split(/\s+/).length <= 50 ? more : intro, refs: lead.refs ?? [], years: lead.years })
    }
    for (const f of [...topic.findings.filter(fits), ...topic.findings.filter((f) => !fits(f))]) if (findings.every((g) => g.lead !== f.lead)) findings.push({ lead: f.lead, body: f.text, refs: f.refs ?? [], years: f.years })
  }
  const cmpTopic = topic && compare ? topic.byCountry?.[compare] : undefined
  const cmpFindings = cmpTopic?.findings.filter((f) => !f.years || inYears(f.years)) ?? []
  if (!trend) for (const f of cmpFindings) findings.push({ lead: `In ${COUNTRIES[compare!].name}: ${f.lead.charAt(0).toLowerCase()}${f.lead.slice(1)}`, body: f.text, refs: f.refs ?? [] })
  if (!trend && topic?.cmpGap && compare && compare !== 'none' && !cmpFindings.length && COUNTRIES[compare]) findings.push({ lead: `In ${COUNTRIES[compare].name}: no study explains these years.`, body: topic.cmpGap, refs: [] })
  const k = findings.findIndex((f) => !f.role)
  if (k > 0) findings.unshift(...findings.splice(k, 1))
  const topicGap = phases.length ? phases[phases.length - 1].gap : gapLeads ? undefined : topic?.gap
  const yearList = (ys: number[]) => (ys.length > 1 ? `${ys.slice(0, -1).join(', ')} and ${ys[ys.length - 1]}` : `${ys[0]}`)
  const breakParts = [A, B].flatMap((ind) => {
    const ys = ind.breaks.filter((x) => x.year > from && x.year <= to).map((x) => x.year)
    const yc = compare ? (ind.geoBreaks?.[compare] ?? []).filter((y) => y > from && y <= to) : []
    return [
      ...(ys.length ? [`${nm(ind)} ${yearList(ys)}${ind.dimension === 'crime' ? ' (legal or recording changes)' : ''}`] : []),
      ...(yc.length && compare ? [`${COUNTRIES[compare].name}’s ${nm(ind)} ${yearList(yc)}`] : []),
    ]
  })
  const breakItems: Claim[] = breakParts.length ? [{ text: `Series breaks: ${breakParts.join('; ')}. Figures either side are not fully comparable.`, refs: [A, B].filter((ind) => ind.breaks.some((x) => x.year > from && x.year <= to)).map((ind) => `data:${ind.id}`) }] : []
  const trendGapText = trend && crimeDir ? (trend.summaryDir === 'any' || trend.summaryDir === crimeDir ? trend.gap : `No verified study explains this ${crimeDir === 'stable' ? 'flat trend' : crimeDir} in recorded ${trend.noun} in the selected years.`) : null
  const driver = isDriverQuestion(rel.id)
  const showChange = !ans || !(ans.covered.includes(a) && ans.covered.includes(b))
  const hasCmp = !!compare && compare !== 'none'
  const showCmp = hasCmp && (!isBuiltAnswer(rel.id) || showChange)
  const keyStats: Stat[] = [...(ans?.stats ?? [])]
  if (ans && !driver) for (const ind of [A, B]) {
    if (ans.covered.includes(ind.id)) continue
    const c = change(ind, 'ES', from, to)
    if (c) keyStats.push(statFor(ind.id, c, true))
  }
  const meaning = ans?.meaning || (trend ? firstSentence(trend.measurement[0].text) : '')
  const relevantCannot = rel.cannot.filter((c) => (!c.only || c.only.includes(a) || c.only.includes(b)) && !(driver && c.text.startsWith('Two lines moving together')))
  const uncertain: Claim[] = profile
    ? [...(trendGapText ? [{ text: trendGapText }] : []), { text: profile.gap }, ...breakItems].slice(0, 3)
    : trend
      ? [...(trendGapText ? [{ text: trendGapText }] : []), ...relevantCannot.slice(0, 1), ...breakItems].slice(0, 3)
      : [...(topicGap ? [{ text: topicGap }] : []), ...breakItems, ...relevantCannot].slice(0, 3)
  const shownLimits = uncertain.slice(0, 1)
  const moreLimits: Claim[] = [...uncertain.slice(1), ...(profile ? profile.uncertain : []), ...relevantCannot, ...breakItems].filter((c, i, all) => !shownLimits.some((u) => u.text === c.text) && all.findIndex((x) => x.text === c.text) === i)
  return { A, B, crimeInd, immInd, trend, relEv, profile, cmpEv, crimeDir, explanations, confounders, findings, kindLabel, periodLabel, topic, cmpTopic, topicGap, breakItems, ans, driver, keyStats, meaning, showCmp, relevantCannot, uncertain, shownLimits, moreLimits }
}
