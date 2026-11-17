import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COUNTRIES, comparability } from '../data/countries'
import { INDICATORS, formatValue, series } from '../data/indicators'
import { REFERENCES } from '../data/references'
import { DESIGN_LABEL, OUTCOME_LABEL, STATUS_LABEL, studyById, type Study } from '../data/research'
import { BROADER, TOPIC, countryEvidence, relationshipEvidence, trendEvidence, type ExplStatus, type StudyLink } from '../data/evidence'
import type { Claim, Indicator, Point, Relationship } from '../data/types'
import { changeMode, correlations } from '../lib/narrative'
import { MIN_CORR_YEARS, describeR, inRange } from '../lib/stats'
import { comparePair, usesPoints, type PairComparison } from '../lib/compare'
import { answerFor, isDriverQuestion } from '../lib/answers'

interface Props {
  rel: Relationship
  a: string
  b: string
  compare: string | null
  from: number
  to: number
}

type Dir = 'rose' | 'fell' | 'stable'

const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const nm = (ind: Indicator) => lc(ind.short.replace(/\s*\(.*?\)/g, ''))

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


const moved = (ind: Indicator, c: NonNullable<PairComparison['a']>) => {
  const v = c.pct ?? c.abs
  const by = c.pct != null ? `${Math.abs(c.pct).toFixed(1)}%` : `by ${Math.abs(c.abs).toFixed(1)} ${ind.format === 'pct1' || /(United States|EU average) = 100/.test(ind.unit) ? 'points' : ind.unit}`
  return `${nm(ind)} ${v > 0 ? 'rose' : v < 0 ? 'fell' : 'was unchanged'}${v ? ` ${by}` : ''}`
}
const pts = (v: number) => `${Math.abs(v).toFixed(1)} percentage points`

function ChangeText({ A, B, compare, from, to }: { A: Indicator; B: Indicator; compare: string | null; from: number; to: number }) {
  let es = comparePair(A, B, 'ES', from, to)
  let other = compare && A.data[compare] && B.data[compare] ? comparePair(A, B, compare, from, to) : null
  if (other?.window && es.window && (other.window[0] !== es.window[0] || other.window[1] !== es.window[1])) {
    const f = Math.max(es.window[0], other.window[0])
    const t = Math.min(es.window[1], other.window[1])
    if (t > f) {
      es = comparePair(A, B, 'ES', f, t)
      other = comparePair(A, B, compare!, f, t)
    }
  }
  const aligned = !!(other?.window && es.window && other.window[0] === es.window[0] && other.window[1] === es.window[1])
  if (!es.window || !es.a || !es.b) {
    const desc = (ind: Indicator) => {
      const pts = inRange(series(ind.id, 'ES'), from, to)
      return pts.length ? `${nm(ind)} has ${pts.length === 1 ? `one observation (${pts[0].year})` : `data for ${pts[0].year}–${pts[pts.length - 1].year}`}` : `${nm(ind)} has no data`
    }
    return <p className="ti-counts">In Spain in {from}–{to}, {desc(A)} and {desc(B)}, so their changes cannot be compared over matching years. Widen the period to compare them.</p>
  }
  const gapText = (p: PairComparison) => (p.gap != null ? `, a gap of ${pts(p.gap)}` : '')
  const out = [`In Spain, from ${es.window[0]} to ${es.window[1]}, ${moved(A, es.a)} while ${moved(B, es.b)}${gapText(es)}.`]
  const name = compare ? COUNTRIES[compare].name : ''
  if (other?.a && other.b && !aligned) {
    out.push(`In ${name}, from ${other.window![0]} to ${other.window![1]}, ${moved(A, other.a)} and ${moved(B, other.b)}${gapText(other)}. The two countries’ data cover too few common years to compare their changes directly.`)
  } else if (other?.a && other.b) {
    out.push(`Over the same years in ${name}, ${moved(A, other.a)} and ${moved(B, other.b)}${gapText(other)}.`)
    const diffs = ([[A, es.a, other.a], [B, es.b, other.b]] as const).flatMap(([ind, x, y]) => {
      if (x.breaks.length || y.breaks.length) return []
      const d = x.pct != null && y.pct != null ? x.pct - y.pct : usesPoints(ind) ? x.abs - y.abs : null
      if (d == null || Math.abs(d) < 0.05) return []
      return [`${Math.abs(d).toFixed(1)} ${x.pct != null ? 'percentage points' : 'points'} ${d > 0 ? 'higher' : 'lower'} for ${nm(ind)}`]
    })
    if (diffs.length) out.push(`Compared with ${name}, the change in Spain was ${diffs.join(' and ')}.`)
  }
  return <p className="ti-counts">{out.join(' ')}</p>
}

const EXPL_LABEL: Record<ExplStatus, string> = { evidence: 'Supported by research', documented: 'Documented change', method: 'How the figures work', hypothesis: 'Plausible, not established', insufficient: 'Evidence insufficient or conflicting' }

function periodNote(s: Study, from: number, to: number) {
  if (!s.years) return null
  const [y0, y1] = s.years
  if (y1 < from || y0 > to) return `Studies ${y0}–${y1}, outside your selected years`
  if (y0 > from || y1 < to) return `Studies ${y0}–${y1}, only part of your selected years`
  return null
}

function StudyCard({ s, note, period, open, onToggle }: { s: Study; note?: string; period?: string | null; open: boolean; onToggle: () => void }) {
  const [lim, setLim] = useState(false)
  const names = s.authors.split(/, | & /)
  const cite = names.length > 2 ? `${names[0].split(' ').slice(-1)[0]} et al.` : names.map((n) => n.split(' ').slice(-1)[0]).join(' & ')
  return (
    <li className={`study ${open ? 'open' : ''}`}>
      <button className="study-head" onClick={onToggle} aria-expanded={open}>
        <span className="study-meta">
          <span className="study-place">{s.place}</span>
          <span className="study-period">{s.period}</span>
          {note && <span className="study-relevant">{note}</span>}
          {period && <span className="study-outside">{period}</span>}
        </span>
        <span className="study-headline">{s.headline}</span>
        <span className="study-cite">{cite} ({s.year}) · {STATUS_LABEL[s.status]}</span>
        <span className="study-toggle" aria-hidden>{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="study-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
            <dl>
              <dt>Conclusion</dt>
              <dd>{s.finding}</dd>
              <dt>How they did it</dt>
              <dd>{s.method}</dd>
              <dt>Outcomes studied</dt>
              <dd>{s.outcomes.map((o) => OUTCOME_LABEL[o]).join(', ')}</dd>
              {s.measure && (
                <>
                  <dt>Migrants studied</dt>
                  <dd>{s.measure}</dd>
                </>
              )}
              <dt>Evidence type</dt>
              <dd>{STATUS_LABEL[s.status]} · {DESIGN_LABEL[s.design]}</dd>
            </dl>
            <button className="study-lim-toggle" onClick={() => setLim((v) => !v)} aria-expanded={lim}>
              {lim ? '− Hide limitations' : '+ Limitations'}
            </button>
            {lim && <p className="study-lim">{s.limitations}</p>}
            <p className="study-source">
              <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> — {s.authors}. <em>{s.outlet}</em>, {s.year}.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function Interpretation({ rel, a, b, compare, from, to }: Props) {
  const [why, setWhy] = useState(false)
  const [stats, setStats] = useState(false)
  const [caveats, setCaveats] = useState(false)
  const [openStudy, setOpenStudy] = useState<string | null>(null)
  const [broad, setBroad] = useState(false)
  const A = INDICATORS[a]
  const B = INDICATORS[b]
  const sa = summarise(A, 'ES', from, to)
  const sb = summarise(B, 'ES', from, to)
  const corr = correlations(a, b, 'ES', from, to)
  const MIN = MIN_CORR_YEARS
  const okL = corr.levels.length >= MIN && corr.rLevels != null
  const okC = corr.changes.length >= MIN && corr.rChanges != null
  const r = (v: number | null) => (v == null ? '—' : v.toFixed(2).replace('-', '−'))
  const span = (pts: { year: number }[]) => (pts.length ? `${pts[0].year}–${pts[pts.length - 1].year}` : '')

  const footOrder: string[] = []
  const fn = (refs: string[] = []) =>
    refs.map((ref) => {
      if (!footOrder.includes(ref)) footOrder.push(ref)
      const n = footOrder.indexOf(ref) + 1
      return (
        <a key={ref} className="fn" href={`#ref-${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ref-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>
          {n}
        </a>
      )
    })

  const isImmCrime = rel.id === 'immigration-crime' || (A.dimension === 'immigration' && B.dimension === 'crime')


  const whyItems: Claim[] = [...rel.cannot]
  for (const ind of [A, B]) {
    const bs = ind.breaks.filter((x) => x.year > from && x.year <= to)
    if (bs.length) whyItems.push({ text: `${ind.short}: the series has ${bs.length === 1 ? 'a break' : `${bs.length} breaks`} in this period (${bs.map((x) => x.year).join(', ')}), so values on either side are not fully comparable.`, refs: [`data:${ind.id}`] })
  }
  if (compare)
    for (const x of [A, B]) {
      const c = comparability(x, compare)
      if (c.note) whyItems.push({ text: c.note, refs: x.dimension === 'crime' && x.id !== 'crime_homicide_long' ? ['eurostatCrime'] : undefined })
    }

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
  const T = rel.outcome === 'left' ? A : B
  const tp = (() => {
    const pts = inRange(series(T.id, 'ES'), from, to)
    if (pts.length < 4) return null
    const hi = pts.reduce((m, p) => (p.value > m.value ? p : m)), lo = pts.reduce((m, p) => (p.value < m.value ? p : m))
    // Percentages are meaningless when a series is zero or negative, so use absolute changes there.
    const useAbs = pts.some((p) => p.value <= 0) || usesPoints(T)
    let big: { year: number; pct: number } | null = null
    for (let k = 1; k < pts.length; k++) if (pts[k].year === pts[k - 1].year + 1) {
      const d = pts[k].value - pts[k - 1].value
      const pct = useAbs ? d : (d / pts[k - 1].value) * 100
      if (!big || Math.abs(pct) > Math.abs(big.pct)) big = { year: pts[k].year, pct }
    }
    const interior = (p: Point) => p.year !== pts[0].year && p.year !== pts[pts.length - 1].year
    const parts: string[] = []
    if (interior(hi)) parts.push(`peak ${hi.year} (${formatValue(hi.value, T.format)})`)
    if (interior(lo)) parts.push(`low ${lo.year} (${formatValue(lo.value, T.format)})`)
    if (big) parts.push(`largest one-year change ${big.pct > 0 ? '+' : '−'}${useAbs ? formatValue(Math.abs(big.pct), T.format === 'pct1' ? 'decimal1' : T.format) : `${Math.abs(big.pct).toFixed(0)}%`} in ${big.year - 1}–${big.year}${T.breaks.some((x) => x.year === big!.year) ? ', a year with a series break' : ''}`)
    return parts.length ? `${uc(nm(T))}: ${parts.join(' · ')}.` : null
  })()
  // An explanation applies only if the selection has observations both before its end year and from its start year on.
  const overlaps = (y?: [number, number]) => !y || (y[0] <= to && y[1] > from)
  const explanations = trend && crimeDir ? trend.explanations.filter((e) => (e.explains === 'any' || e.explains === crimeDir) && overlaps(e.years)) : []
  const confounders = profile ? profile.confounders.filter((c) => overlaps(c.years)) : []
  const parts = crimeInd?.parts
    ?.map((pt) => {
      const pts = Object.entries(pt.data).map(([y, v]) => ({ year: +y, value: v })).filter((x) => x.year >= from && x.year <= to).sort((x, y) => x.year - y.year)
      return pts.length >= 2 ? { label: pt.label, first: pts[0], last: pts[pts.length - 1] } : null
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
  const periodStats = profile?.periods
    ?.map(([p0, p1]) => [Math.max(p0, from), Math.min(p1, to)] as const)
    .filter(([p0, p1]) => p1 - p0 >= 1)
    .map(([p0, p1]) => ({ p0, p1, c: correlations(a, b, 'ES', p0, p1) }))
  const studyCards = (links: StudyLink[]) =>
    links.flatMap(({ id, note }) => {
      const s = studyById(id)
      return s ? [<StudyCard key={id} s={s} note={note} period={periodNote(s, from, to)} open={openStudy === id} onToggle={() => setOpenStudy((o) => (o === id ? null : id))} />] : []
    })
  const rText = (v: number | null, n: number) => (n < MIN || v == null ? `too few (${n})` : `r = ${r(v)} (${n})`)
  const posLevels = okL && corr.rLevels! >= 0.5
  const changeLabel = (ind: Indicator) => (changeMode(ind.id) === 'abs' ? 'change in points' : '% change')

  const last = (n: string) => {
    const w = n.replace(/\b(Jr\.?|et al\.?)$/, '').trim().split(' ')
    const i = w.findIndex((x, k) => k > 0 && /^(van|von|de|del|der|la|le|da|Van|Von|De|Del|Der|La|Le|Da)$/.test(x))
    return i > 0 ? w.slice(i).join(' ') : w[w.length - 1]
  }
  const citeOf = (id: string) => {
    const st = studyById(id)
    if (st?.cite) return `${st.cite} (${st.year})`
    if (st) {
      const names = st.authors.split(/, | & /)
      return `${names.length > 2 || /et al/.test(st.authors) ? `${last(names[0])} et al.` : names.map(last).join(' & ')} (${st.year})`
    }
    const ref = REFERENCES[id]
    return ref ? `${ref.authors} (${ref.year})` : ''
  }
  const firstSentence = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z“"])/)[0]
  type Finding = { lead: string; body?: string; refs: string[] }
  const findings: Finding[] = []
  const cmpDirect = cmpEv?.direct.length ? cmpEv.direct[0] : null
  if (trend) {
    const ev = explanations.filter((e) => e.status === 'evidence')
    const doc = explanations.filter((e) => e.status === 'documented')
    const pick = [ev[0], doc[0] ?? ev[1]].filter(Boolean).slice(0, profile && cmpDirect ? 1 : 2)
    for (const e of pick) findings.push({ lead: e.lead, body: firstSentence(e.text), refs: e.refs ?? [] })
  }
  if (profile && relEv && profile.direct.length) {
    const first = firstSentence(relEv.causal)
    const k = first.indexOf(':')
    const lead = k > 0 ? `${first.slice(0, k)}.` : first
    const body = k > 0 ? uc(first.slice(k + 1).trim().replace(/,? and none (covers|is about) Spain\.?$/, '.').replace(/\.\.$/, '.')) : undefined
    findings.push({ lead, body, refs: profile.direct.map((d) => d.id) })
  }
  if (cmpDirect && compare && !findings.some((f) => f.refs.includes(cmpDirect.id))) {
    const st = studyById(cmpDirect.id)
    if (st) findings.push({ lead: `In ${COUNTRIES[compare].name}: ${/^[A-Z][a-z ]/.test(st.headline) ? st.headline.charAt(0).toLowerCase() + st.headline.slice(1) : st.headline}`, refs: [st.id] })
  }
  const topic = TOPIC[rel.id]
  if (!trend && topic) for (const f of topic.findings) findings.push({ lead: f.lead, body: f.text, refs: f.refs ?? [] })

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
  const ans = answerFor(rel.id, compare, from, to)
  const driver = isDriverQuestion(rel.id)
  const showChange = !ans || !(ans.covered.includes(a) && ans.covered.includes(b))
  const relevantCannot = rel.cannot.filter((c) => (!c.only || c.only.includes(a) || c.only.includes(b)) && !(driver && c.text.startsWith('Two lines moving together')))
  const uncertain: Claim[] = profile
    ? [...(trendGapText ? [{ text: trendGapText }] : []), { text: profile.gap }, ...breakItems].slice(0, 3)
    : trend
      ? [...(trendGapText ? [{ text: trendGapText }] : []), ...relevantCannot.slice(0, 1), ...breakItems].slice(0, 3)
      : [...(topic ? [{ text: topic.gap }] : []), ...breakItems, ...relevantCannot].slice(0, 3)
  const moreLimits: Claim[] = [...(profile ? profile.uncertain : []), ...relevantCannot, ...breakItems].filter((c) => !uncertain.some((u) => u.text === c.text))

  return (
    <section className="tell" aria-labelledby="tell-title">
      <h2 id="tell-title">What does this actually tell us?</h2>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">01</span>
          <h3>What happened?</h3>
        </div>
        <div className="tell-body">
          {ans && <p className="ti-verdict">{ans.verdict}</p>}
          {ans && !driver && ans.text && <p className="ti-answer">{ans.text}</p>}
          {showChange && <ChangeText A={A} B={B} compare={compare} from={from} to={to} />}
          {tp && <p className="ti-counts">{tp}</p>}
          {trend && <p className="ti-note">{firstSentence(trend.measurement[0].text)}</p>}
          <button className="tell-more" onClick={() => setStats((v) => !v)} aria-expanded={stats}>
            {stats ? '− Hide statistical details' : '+ Statistical details'}
          </button>
          {stats && (
            <div className="ti-details">
              <p className="tell-text">
                {okL && okC
                  ? `In ${span(corr.levels)}, the two series’ levels show ${describeR(corr.rLevels)} (r = ${r(corr.rLevels)}), and their annual changes ${describeR(corr.rChanges)} (r = ${r(corr.rChanges)}). `
                  : okL
                    ? `In ${span(corr.levels)}, their levels show ${describeR(corr.rLevels)} (r = ${r(corr.rLevels)}), but there are too few consecutive years (${corr.changes.length}) to check annual changes. `
                    : `Only ${corr.levels.length} shared years in this period, too few for a meaningful correlation. `}
                {posLevels
                  ? 'Two series that both trend upward over the same years correlate strongly in levels whether or not they are connected; annual changes are the stricter check.'
                  : okL && corr.rLevels! <= -0.5
                    ? 'When one series rises while the other falls, their levels correlate negatively whether or not they are connected; annual changes are the stricter check.'
                    : ''}
              </p>
              <dl className="ti-stats">
                <dt>Years compared</dt>
                <dd>{corr.levels.length ? `${corr.levels.length} years with data for both (${span(corr.levels)}); missing years are left out, not filled in.` : 'No overlapping years.'}</dd>
                <dt>Annual changes</dt>
                <dd>{corr.changes.length} consecutive-year pairs, using {changeLabel(A)} for {nm(A)} and {changeLabel(B)} for {nm(B)}.</dd>
                {periodStats && periodStats.length > 0 && (
                  <>
                    <dt>Sub-periods</dt>
                    <dd>
                      {periodStats.map(({ p0, p1, c }) => (
                        <span key={p0} className="ti-period-line">{p0}–{p1}: levels {rText(c.rLevels, c.levels.length)}; changes {rText(c.rChanges, c.changes.length)}</span>
                      ))}
                    </dd>
                  </>
                )}
                {parts && parts.length > 0 && crimeInd && (
                  <>
                    <dt>Components</dt>
                    <dd>{parts.map((pt) => `${pt.label.toLowerCase()} ${formatValue(pt.first.value, crimeInd.format)} → ${formatValue(pt.last.value, crimeInd.format)} (${pt.first.year}–${pt.last.year})`).join('; ')} per 100,000 residents.</dd>
                  </>
                )}
                <dt>Method</dt>
                <dd>Pearson correlation: straight-line association only, not a causal estimate, with no adjustment for other factors. Correlations need at least {MIN} shared years.</dd>
              </dl>
              {confounders.length > 0 && (
                <>
                  <h4 className="ti-sub">Other factors that could make both move together</h4>
                  <ul className="tell-list">
                    {confounders.map((c, i) => (
                      <li key={i}>{c.text}{fn(c.refs)}</li>
                    ))}
                  </ul>
                </>
              )}
              {immInd && profile && (
                <>
                  <h4 className="ti-sub">Which immigrants this measures</h4>
                  <p className="tell-text">
                    {immInd.definition}{fn([`data:${immInd.id}`])} Foreign-born residents, foreign nationals, recent arrivals, asylum seekers and people without legal residence are different groups; each study says which group it measures.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">02</span>
          <h3>What does the research say?</h3>
        </div>
        <div className="tell-body">
          {findings.length ? (
            <ul className="findings">
              {findings.map((f) => (
                <li key={f.lead}>
                  <p className="finding-lead">{f.lead}</p>
                  {f.body && <p className="finding-body">{f.body}</p>}
                  {f.refs.length > 0 && <p className="finding-src">{f.refs.map(citeOf).filter(Boolean).join('; ')} {fn(f.refs)}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="tell-text">We have not yet verified research on this question, so no findings are shown.</p>
          )}
          <button className="tell-more" onClick={() => setWhy((v) => !v)} aria-expanded={why}>
            {why ? '− Hide the research' : findings.length ? '+ Explore the research' : `+ Background notes, not yet verified study by study (${rel.explain.length})`}
          </button>
          {why && (
            <div className="research-more">
              {trend && (
                <div className="study-group">
                  <h4>Why recorded {trend.noun} changed</h4>
                  <ul className="tell-list">
                    {trend.measurement.slice(1).map((c, i) => (
                      <li key={`m${i}`}>{c.text}{fn(c.refs)}</li>
                    ))}
                    {explanations.map((e) => (
                      <li key={e.lead}>
                        <span className={`expl-tag expl-tag-${e.status}`}>{EXPL_LABEL[e.status]}</span> <strong>{e.lead}</strong> {e.text}{fn(e.refs)}
                      </li>
                    ))}
                  </ul>
                  {trend.studies.length > 0 && <ul className="studies">{studyCards(trend.studies)}</ul>}
                </div>
              )}
              {profile && (
                <div className="study-group">
                  <h4>Immigration and {profile.noun}</h4>
                  <ul className="tell-list">
                    {profile.synthesis.map((x) => (
                      <li key={x.lead}><strong>{x.lead}</strong> {x.text}</li>
                    ))}
                  </ul>
                  {profile.direct.length > 0 && <ul className="studies">{studyCards(profile.direct)}</ul>}
                  {profile.broader.length > 0 && (
                    <>
                      <button className="tell-more" onClick={() => setBroad((v) => !v)} aria-expanded={broad}>
                        {broad ? '− Hide broader studies' : `+ Broader studies that do not isolate ${profile.noun} (${profile.broader.length})`}
                      </button>
                      {broad && <ul className="studies">{studyCards(profile.broader)}</ul>}
                    </>
                  )}
                </div>
              )}
              {cmpEv && compare && profile && (
                <div className="study-group">
                  <h4>Research on {COUNTRIES[compare].name}</h4>
                  {cmpEv.direct.length > 0 && <ul className="studies">{studyCards(cmpEv.direct)}</ul>}
                  {cmpEv.gap && <p className="synthesis-note">{cmpEv.gap}</p>}
                  {cmpEv.context.length > 0 && (
                    <>
                      <p className="ti-sub">Broader context: studies of {COUNTRIES[compare].name} that do not isolate {profile.noun}</p>
                      <ul className="studies">{studyCards(cmpEv.context)}</ul>
                    </>
                  )}
                </div>
              )}
              {!trend && topic && (
                <>
                  {topic.international.length > 0 && (
                    <div className="study-group">
                      <h4>International research</h4>
                      <ul className="studies">{studyCards(topic.international)}</ul>
                    </div>
                  )}
                  {topic.spain.length > 0 && (
                    <div className="study-group">
                      <h4>Research on Spain</h4>
                      <ul className="studies">{studyCards(topic.spain)}</ul>
                    </div>
                  )}
                </>
              )}
              {!findings.length && (
                <ul className="tell-list">
                  {rel.explain.map((c, i) => (
                    <li key={i}>{c.text}{fn(c.refs)}</li>
                  ))}
                </ul>
              )}
              {findings.length > 0 && <p className="tell-fine">Studies were checked against the original publication or its official abstract. Results apply to the country, period and group each study covers.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">03</span>
          <h3>What remains uncertain?</h3>
        </div>
        <div className="tell-body">
          <ul className="uncertain">
            {uncertain.map((c, i) => (
              <li key={i}>{c.text}{fn(c.refs)}</li>
            ))}
          </ul>
          {moreLimits.length > 0 && (
            <>
              <button className="tell-more" onClick={() => setCaveats((v) => !v)} aria-expanded={caveats}>
                {caveats ? '− Hide' : `+ More limitations (${moreLimits.length})`}
              </button>
              {caveats && (
                <ul className="tell-list">
                  {moreLimits.map((c, i) => (
                    <li key={i}>{c.text}{fn(c.refs)}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {footOrder.length > 0 && (
        <ol className="footnotes">
          {footOrder.map((r, i) => {
            if (r.startsWith('data:')) {
              const ind = INDICATORS[r.slice(5)]
              return (
                <li key={r} id={`ref-${i + 1}`}>
                  <span className="fn-num">{i + 1}</span>
                  <span>Data: {ind.label}. {ind.source.org}, <a href={ind.source.url} target="_blank" rel="noreferrer">{ind.source.dataset}</a>
                  {ind.source.upstream ? `; original source ${ind.source.upstream}` : ''}. Retrieved {ind.retrieved}.</span>
                </li>
              )
            }
            const st = REFERENCES[r] ? null : studyById(r)
            const ref = REFERENCES[r] ?? { authors: st!.authors, year: st!.year, url: st!.url, title: st!.title, outlet: st!.outlet }
            return (
              <li key={r} id={`ref-${i + 1}`}>
                <span className="fn-num">{i + 1}</span>
                <span>{ref.authors} ({ref.year}). <a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a>. <em>{ref.outlet}</em>.</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
