import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COUNTRIES } from '../data/countries'
import { DIMENSIONS, INDICATORS, formatValue, series } from '../data/indicators'
import { REFERENCES } from '../data/references'
import { DESIGN_LABEL, OUTCOME_LABEL, STATUS_LABEL, STUDIES, SYNTHESIS, studyById, type Study } from '../data/research'
import { crimeProfile, type CrimeProfile, type ExplStatus, type StudyLink } from '../data/crimeEvidence'
import type { Claim, Indicator, Point, Relationship } from '../data/types'
import { changeMode, correlations } from '../lib/narrative'
import { MIN_CORR_YEARS, describeR, inRange } from '../lib/stats'

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

function absChange(ind: Indicator, first: Point, last: Point) {
  const d = last.value - first.value
  const sign = d > 0 ? '+' : d < 0 ? '−' : '±'
  if (ind.format === 'pct1') return `${sign}${formatValue(Math.abs(d), 'decimal1')} points`
  return `${sign}${formatValue(Math.abs(d), ind.format)}`
}

function Spark({ pts, tone }: { pts: Point[]; tone: 'a' | 'b' }) {
  const w = 120
  const h = 34
  const xs = pts.map((p) => p.year)
  const vs = pts.map((p) => p.value)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const lo = Math.min(...vs), hi = Math.max(...vs)
  const px = (y: number) => ((y - x0) / (x1 - x0 || 1)) * (w - 6) + 3
  const py = (v: number) => h - 4 - ((v - lo) / (hi - lo || 1)) * (h - 8)
  const d = pts.map((p, i) => `${i && p.year === pts[i - 1].year + 1 ? 'L' : 'M'}${px(p.year).toFixed(1)},${py(p.value).toFixed(1)}`).join('')
  const last = pts[pts.length - 1]
  return (
    <svg className={`ti-spark tone-${tone}`} width={w} height={h} aria-hidden>
      <path d={d} />
      <circle cx={px(pts[0].year)} cy={py(pts[0].value)} r={2.5} className="start" />
      <circle cx={px(last.year)} cy={py(last.value)} r={3} />
    </svg>
  )
}

function Tag({ kind }: { kind: 'descriptive' | 'association' | 'causal' }) {
  const label = { descriptive: 'Descriptive observation', association: 'Statistical association', causal: 'Causal evidence from research' }[kind]
  return <span className={`ti-tag ti-tag-${kind}`}>{label}</span>
}

const EXPL_LABEL: Record<ExplStatus, string> = { documented: 'Documented change', evidence: 'Supported by evidence', method: 'How the figures work', hypothesis: 'Hypothesis, not tested here' }

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
  const [who, setWho] = useState(false)
  const [conf, setConf] = useState(false)
  const [openExpl, setOpenExpl] = useState<string | null>(null)
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

  const dimA = DIMENSIONS[A.dimension].noun
  const verb = (d: Dir) => (d === 'stable' ? 'stayed broadly stable' : d)
  const isImmCrime = rel.id === 'immigration-crime' || (A.dimension === 'immigration' && B.dimension === 'crime')

  // Key finding: describe both series over the years they overlap, so the sentence matches the correlations.
  const ov = corr.levels
  let keyLead = ''
  if (ov.length >= 2) {
    const f = ov[0], l = ov[ov.length - 1]
    const dir = (x0: number, x1: number): Dir => (Math.abs((x1 - x0) / Math.abs(x0 || 1)) < 0.05 ? 'stable' : x1 > x0 ? 'rose' : 'fell')
    const da = dir(f.x, l.x), db = dir(f.y, l.y)
    const big = (x0: number, x1: number) => Math.abs((x1 - x0) / Math.abs(x0 || 1)) >= 0.4
    const vA = da === 'stable' ? 'stayed broadly stable' : `${da}${big(f.x, l.x) ? ' substantially' : ''}`
    const vB = db === 'stable' ? 'stayed broadly stable' : `${db}${big(f.y, l.y) ? ' substantially' : ''}`
    keyLead = `Between ${f.year} and ${l.year}, ${nm(A)} ${vA} (${formatValue(f.x, A.format)} → ${formatValue(l.x, A.format)}) ${da === db ? 'and' : 'while'} ${B.dimension === 'crime' ? 'recorded ' : ''}${nm(B)} ${vB} (${formatValue(f.y, B.format)} → ${formatValue(l.y, B.format)}).`
  }
  let keyTurn = ''
  if (okL && okC) {
    const L = Math.abs(corr.rLevels!), C = Math.abs(corr.rChanges!)
    if (L >= 0.5 && C < 0.2) keyTurn = 'But their year-to-year movements show almost no linear relationship.'
    else if (L >= 0.5 && C >= 0.2 && Math.sign(corr.rLevels!) === Math.sign(corr.rChanges!)) keyTurn = `Their year-to-year movements also show ${describeR(corr.rChanges)}, ${C < L ? 'weaker than' : C > L ? 'stronger than' : 'as strong as'} in their levels.`
    else if (L >= 0.5) keyTurn = `Their year-to-year movements show ${describeR(corr.rChanges)}, the opposite sign to their levels.`
    else keyTurn = `Over these years their levels show ${describeR(corr.rLevels)}, and their year-to-year changes ${describeR(corr.rChanges)}.`
  }
  const trendGap = okL && okC && Math.abs(corr.rLevels!) >= 0.5 && Math.abs(corr.rChanges!) < 0.2

  const factors = isImmCrime
    ? `Other factors may influence ${nm(B)}, including economic conditions, an ageing population, policing, and changes in how offences are reported and recorded.`
    : `Both can be shaped by other forces at the same time, such as the business cycle, policy changes, population change, or changes in how the data are measured.`

  const whyItems: Claim[] = [...rel.cannot]
  for (const ind of [A, B]) {
    const bs = ind.breaks.filter((x) => x.year > from && x.year <= to)
    if (bs.length) whyItems.push({ text: `${ind.short}: the series has ${bs.length === 1 ? 'a break' : `${bs.length} breaks`} in this period (${bs.map((x) => x.year).join(', ')}), so values on either side are not fully comparable.`, refs: [`data:${ind.id}`] })
  }
  if (compare && [A, B].some((x) => x.dimension === 'crime'))
    whyItems.push({ text: `Crime levels in Spain and ${COUNTRIES[compare].name} are not directly comparable because legal definitions and recording practices differ. Compare the direction of trends, not the levels.`, refs: ['eurostatCrime'] })

  const crimeInd = B.dimension === 'crime' ? B : A.dimension === 'crime' ? A : null
  const immInd = A.dimension === 'immigration' ? A : B.dimension === 'immigration' ? B : null
  const profile: CrimeProfile | null = isImmCrime && crimeInd && immInd ? crimeProfile(crimeInd.id) : null
  const sc = crimeInd === B ? sb : crimeInd === A ? sa : null
  const crimeDir = sc ? (sc.dir === 'rose' ? 'rise' : sc.dir === 'fell' ? 'fall' : 'stable') : null
  // An explanation applies only if the selection has observations both before its end year and from its start year on.
  const overlaps = (y?: [number, number]) => !y || (y[0] <= to && y[1] > from)
  const explanations = profile && crimeDir ? profile.explanations.filter((e) => (e.explains === 'any' || e.explains === crimeDir) && overlaps(e.years)) : []
  const confounders = profile ? profile.confounders.filter((c) => overlaps(c.years)) : []
  const sameAmountQ = profile && sc
    ? sc.dir === 'stable' ? `Does that mean ${profile.noun} stayed the same?` : `Does that mean ${profile.noun} ${sc.dir === 'rose' ? 'increased' : 'decreased'} by the same amount?`
    : profile ? `Do recorded figures measure actual ${profile.noun}?` : ''
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

  return (
    <section className="tell" aria-labelledby="tell-title">
      <h2 id="tell-title">What does this actually tell us?</h2>

      <div className="key">
        <p className="key-kicker">The key finding</p>
        {okL && okC ? (
          <>
            <p className="key-lead">
              {keyLead} {keyTurn}
            </p>
            <div className="key-figs">
              <div className="key-fig">
                <span className="key-r">{r(corr.rLevels)}</span>
                <span className="key-r-label">Correlation between historical levels</span>
                <span className="key-r-note">Do high values of one coincide with high, or low, values of the other? Two series that each follow a steady long-run trend score close to ±1 even if they are unrelated.</span>
              </div>
              <div className="key-fig">
                <span className="key-r">{r(corr.rChanges)}</span>
                <span className="key-r-label">Correlation between annual changes</span>
                <span className="key-r-note">When one moves more than usual in a year, does the other move too? This strips out shared long-run trends, so it is a stricter check. It is still not a measure of cause.</span>
              </div>
            </div>
            <p className="key-why">
              {trendGap
                ? 'Why the difference? A strong link in levels with almost none in annual changes usually means each series is following its own long-run path rather than responding to the other year by year. '
                : 'Correlation in levels is easily inflated by long-run trends; correlation in changes is a stricter but still limited check. '}
              Neither number shows cause and effect: a third factor can drive both, effects can take years to appear, and recorded figures shift when measurement changes.
            </p>
            <p className="key-base">
              Based on the {corr.levels.length} years where both series have data ({span(corr.levels)}){corr.changes.length !== corr.levels.length - 1 ? `; ${corr.changes.length} consecutive-year pairs for changes` : ''}. Pearson correlation, r, ranges from −1 to +1.
              {fn([`data:${a}`, `data:${b}`])}
            </p>
          </>
        ) : (
          <>
            {keyLead && <p className="key-lead">{keyLead}</p>}
            <p className="key-limit">
              {corr.levels.length === 0
                ? `The two series have no overlapping years in ${from}–${to}, so they cannot be compared.`
                : corr.levels.length === 1
                  ? `The two series overlap in only one year (${corr.levels[0].year}) in ${from}–${to}, which is too few for a meaningful correlation. Widen the period to compare them.`
                : `Only ${corr.levels.length} years have data for both series in ${from}–${to}${corr.levels.length >= MIN ? `, and ${corr.changes.length} consecutive-year pairs` : ''}. That is too few for a meaningful correlation, so none is shown. Widen the period to compare them.`}
            </p>
          </>
        )}
      </div>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">01</span>
          <h3>What happened</h3>
          <Tag kind="descriptive" />
        </div>
        <div className="tell-body">
          <div className="ti-cards">
            {([[A, sa, 'a'], [B, sb, 'b']] as const).map(([ind, s, tone]) => (
              <article key={ind.id} className={`ti-card tone-${tone}`}>
                <h4>{ind.short}</h4>
                {s ? (
                  <>
                    <div className="ti-row">
                      <div className="ti-figs">
                        <span className="ti-from">{formatValue(s.first.value, ind.format)} <small>{s.first.year}</small></span>
                        <span className="ti-arrow" aria-hidden>→</span>
                        <span className="ti-to">{formatValue(s.last.value, ind.format)} <small>{s.last.year}</small></span>
                      </div>
                      <Spark pts={s.pts} tone={tone} />
                    </div>
                    <p className="ti-change">
                      {absChange(ind, s.first, s.last)} ({s.rel >= 0 ? '+' : '−'}{Math.abs(s.rel * 100).toFixed(0)}%) · {ind.unit}
                      {fn([`data:${ind.id}`])}
                    </p>
                    <p className="ti-cov">
                      Data for {s.first.year}–{s.last.year}
                      {(s.first.year > from || s.last.year < to) && <> of the selected {from}–{to}; {s.first.year > from && `no observations before ${s.first.year}`}{s.first.year > from && s.last.year < to && ', '}{s.last.year < to && `latest available year is ${s.last.year}`}</>}
                      .
                    </p>
                  </>
                ) : (
                  <p className="ti-cov">
                    {series(ind.id, 'ES').some((p) => p.year >= from && p.year <= to) ? 'Only one observation' : 'No observations'} in {from}–{to}, so no change can be described.
                  </p>
                )}
              </article>
            ))}
          </div>
          {profile && crimeInd && (
            <p className="ti-counts">
              <strong>What the crime figures count:</strong> {crimeInd.definition}
              {parts && parts.length > 0 && (
                <>
                  {' '}By component: {parts.map((pt) => `${pt.label.toLowerCase()} ${formatValue(pt.first.value, crimeInd.format)} → ${formatValue(pt.last.value, crimeInd.format)} (${pt.first.year}–${pt.last.year})`).join('; ')} per 100,000 residents.
                </>
              )}
            </p>
          )}
          {compare && (
            <p className="ti-compare">
              {(() => {
                const parts = [A, B].flatMap((ind) => {
                  const pts = inRange(series(ind.id, compare), from, to)
                  if (!pts.length) return []
                  const s = summarise(ind, compare, from, to)
                  return s
                    ? [`${nm(ind)} ${verb(s.dir)} from ${formatValue(s.first.value, ind.format)} (${s.first.year}) to ${formatValue(s.last.value, ind.format)} (${s.last.year})`]
                    : [`${nm(ind)} has a single observation in this period, ${formatValue(pts[0].value, ind.format)} (${pts[0].year})`]
                })
                return parts.length ? `In ${COUNTRIES[compare].name}, ${parts.join(', and ')}.` : `No data for ${COUNTRIES[compare].name} in this period.`
              })()}
            </p>
          )}
          <button className="tell-more" onClick={() => setStats((v) => !v)} aria-expanded={stats}>
            {stats ? '− Hide statistical details' : '+ Statistical details'}
          </button>
          {stats && (
            <dl className="ti-stats">
              <dt>Years compared</dt>
              <dd>{corr.levels.length ? `${corr.levels.length} years with data for both (${span(corr.levels)}); years missing in either series are left out, not filled in.` : 'No overlapping years.'}</dd>
              <dt>Levels</dt>
              <dd>r = {r(corr.rLevels)}{corr.levels.length < MIN ? ' (too few years to interpret)' : ''} · <Tag kind="association" /></dd>
              <dt>Annual changes</dt>
              <dd>r = {r(corr.rChanges)} across {corr.changes.length} consecutive-year pairs{corr.changes.length < MIN ? ' (too few to interpret)' : ''}. Uses {changeLabel(A)} for {nm(A)} and {changeLabel(B)} for {nm(B)}.</dd>
              <dt>Method</dt>
              <dd>Pearson correlation, which measures straight-line association only. It is not a causal estimate and does not adjust for any other factor.</dd>
            </dl>
          )}
        </div>
      </div>

      {profile && (
        <>
          <div className="tell-part">
            <div className="tell-label">
              <span className="evidence-num">02</span>
              <h3>{sameAmountQ}</h3>
              <Tag kind="descriptive" />
            </div>
            <div className="tell-body">
              <ul className="synthesis">
                {profile.recorded.map((c, i) => (
                  <li key={i}>
                    {c.text}
                    {fn(c.refs)}
                  </li>
                ))}
              </ul>
              {sc && (
                <>
                  <h4 className="ti-sub">Why might recorded {nm(crimeInd!)} have {sc.dir === 'stable' ? 'stayed broadly stable' : sc.dir === 'rose' ? 'risen' : 'fallen'} in {sc.first.year}–{sc.last.year}?</h4>
                  {explanations.length ? (
                    <ul className="expl">
                      {explanations.map((e) => (
                        <li key={e.lead} className={`expl-${e.status}`}>
                          <span className={`expl-tag expl-tag-${e.status}`}>{EXPL_LABEL[e.status]}</span>
                          <button className="expl-head" onClick={() => setOpenExpl((o) => (o === e.lead ? null : e.lead))} aria-expanded={openExpl === e.lead}>
                            <strong>{e.lead}</strong> <span aria-hidden>{openExpl === e.lead ? '−' : '+'}</span>
                          </button>
                          {openExpl === e.lead && (
                            <p className="expl-text">
                              {e.text}
                              {fn(e.refs)}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="tell-text">No verified explanation is available for this movement in the selected years.</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="tell-part">
            <div className="tell-label">
              <span className="evidence-num">03</span>
              <h3>Did immigration contribute?</h3>
              <Tag kind="association" />
            </div>
            <div className="tell-body">
              <p className="tell-text">
                {okL && okC
                  ? `In ${span(corr.levels)}, the levels of ${nm(immInd!)} and recorded ${nm(crimeInd!)} show ${describeR(corr.rLevels)} (r = ${r(corr.rLevels)}), and their annual changes ${describeR(corr.rChanges)} (r = ${r(corr.rChanges)}). `
                  : okL
                    ? `In ${span(corr.levels)}, their levels show ${describeR(corr.rLevels)} (r = ${r(corr.rLevels)}), but there are too few consecutive years (${corr.changes.length}) to check annual changes. `
                    : 'There are too few shared years in this period for a meaningful correlation. '}
                {posLevels
                  ? 'A positive correlation in levels arises whenever two series trend upward over the same years, whether or not they are connected, so it cannot show that immigration raised recorded offences.'
                  : okL && corr.rLevels! <= -0.5
                    ? 'A negative correlation in levels arises whenever one series rises while the other falls, whether or not they are connected, so it cannot show that immigration lowered recorded offences.'
                    : 'Even a strong correlation would not show cause and effect.'}
              </p>
              {periodStats && periodStats.length > 0 && (
                <dl className="ti-stats">
                  {periodStats.map(({ p0, p1, c }) => (
                    <div key={p0} className="ti-period">
                      <dt>{p0}–{p1}</dt>
                      <dd>Levels: {rText(c.rLevels, c.levels.length)} · Annual changes: {rText(c.rChanges, c.changes.length)}</dd>
                    </div>
                  ))}
                  <dd className="ti-period-note">Shared years in brackets. Correlations need at least {MIN}; sub-periods are short and legal changes fall within them, so treat these as rough checks.</dd>
                </dl>
              )}
              <button className="tell-more" onClick={() => setConf((v) => !v)} aria-expanded={conf}>
                {conf ? '− Hide other factors' : `+ Other factors that could make the two move together (${confounders.length})`}
              </button>
              {conf && (
                <ul className="tell-list">
                  {confounders.map((c, i) => (
                    <li key={i}>
                      {c.text}
                      {fn(c.refs)}
                    </li>
                  ))}
                </ul>
              )}
              <button className="tell-more" onClick={() => setWho((v) => !v)} aria-expanded={who}>
                {who ? '− Hide' : '+ Which immigrants does this measure?'}
              </button>
              {who && (
                <div className="tell-who">
                  <p>
                    <strong>{immInd!.short}:</strong> {immInd!.definition}
                    {fn([`data:${immInd!.id}`])}
                  </p>
                  <p>Foreign-born residents, foreign nationals, recent arrivals, asylum seekers and people without legal residence are different groups. Many foreign-born residents of Spain are Spanish citizens, and many foreign nationals have lived there for years. Studies below say which group they measure; their results apply to that group only.</p>
                </div>
              )}
            </div>
          </div>

          <div className="tell-part">
            <div className="tell-label">
              <span className="evidence-num">04</span>
              <h3>What does the research actually say?</h3>
              <Tag kind="causal" />
            </div>
            <div className="tell-body">
              <ul className="synthesis">
                {profile.synthesis.map((x) => (
                  <li key={x.lead}>
                    <strong>{x.lead}</strong> {x.text}
                  </li>
                ))}
              </ul>
              <div className="study-group">
                <h4>Studies reporting results for {profile.noun}{profile.direct.length && !profile.direct.every((d) => /separately/.test(d.note)) ? ' or the closest category' : ''}</h4>
                {profile.direct.length ? <ul className="studies">{studyCards(profile.direct)}</ul> : <p className="unavailable-note">None found.</p>}
              </div>
              <p className="synthesis-note"><strong>Research gap:</strong> {profile.gap}</p>
              <button className="tell-more" onClick={() => setBroad((v) => !v)} aria-expanded={broad}>
                {broad ? '− Hide broader studies' : `+ Broader studies that do not isolate ${profile.noun} (${profile.broader.length})`}
              </button>
              {broad && <ul className="studies">{studyCards(profile.broader)}</ul>}
              <p className="tell-fine">
                Studies were checked against the original publication or its official abstract. Results apply to the country, period, offences and migrant group each study covers, not to Spain today unless stated.
              </p>
            </div>
          </div>

          <div className="tell-part">
            <div className="tell-label">
              <span className="evidence-num">05</span>
              <h3>What can we conclude, and what remains uncertain?</h3>
            </div>
            <div className="tell-body">
              <dl className="conclude">
                <dt><Tag kind="descriptive" /></dt>
                <dd>
                  {sa && sb
                    ? `${uc(nm(A))} ${verb(sa.dir)} and recorded ${nm(B)} ${verb(sb.dir)} over the selected years. Recorded offences are not the same as actual ${profile.noun}.`
                    : 'One of the series has too few observations in the selected years to describe a trend.'}
                </dd>
                <dt><Tag kind="association" /></dt>
                <dd>
                  {okL && okC
                    ? `Levels: r = ${r(corr.rLevels)}; annual changes: r = ${r(corr.rChanges)}. This describes how the national totals moved together, not whether immigration affected ${profile.noun}.`
                    : 'Too few shared years for a meaningful correlation.'}
                </dd>
                <dt><Tag kind="causal" /></dt>
                <dd>{profile.causal}</dd>
              </dl>
              <h4 className="ti-sub">What remains uncertain</h4>
              <ul className="tell-list">
                {profile.uncertain.map((c, i) => (
                  <li key={i}>
                    {c.text}
                    {fn(c.refs)}
                  </li>
                ))}
              </ul>
          {whyItems.length > 0 && (
              <>
                <button className="tell-more" onClick={() => setCaveats((w) => !w)} aria-expanded={caveats}>
                  {caveats ? '− Hide' : '+ Why two trends aren’t enough'} <span>({whyItems.length})</span>
                </button>
                <AnimatePresence initial={false}>
                  {caveats && (
                    <motion.ul className="tell-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      {whyItems.map((c, i) => (
                        <li key={i}>
                          {c.text}
                          {fn(c.refs)}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}
            </div>
          </div>
        </>
      )}

      {!profile && (
        <>
      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">02</span>
          <h3>What does the research say?</h3>
          {isImmCrime && <Tag kind="causal" />}
        </div>
        <div className="tell-body">
          {isImmCrime && !profile ? (
            <>
              <ul className="synthesis">
                {SYNTHESIS.map((p) => (
                  <li key={p.lead}>
                    <strong>{p.lead}</strong> {p.text}
                  </li>
                ))}
              </ul>
              {(['Spain', 'Europe', 'Review'] as const).map((scope) => (
                <div key={scope} className="study-group">
                  <h4>{scope === 'Spain' ? 'Studies of Spain' : scope === 'Europe' ? 'Studies elsewhere in Europe' : 'Reviews of the research'}</h4>
                  <ul className="studies">
                    {STUDIES.filter((s) => s.scope === scope).map((s) => (
                      <StudyCard key={s.id} s={s} period={periodNote(s, from, to)} open={openStudy === s.id} onToggle={() => setOpenStudy((o) => (o === s.id ? null : s.id))} />
                    ))}
                  </ul>
                </div>
              ))}
              <p className="tell-fine">
                All studies were checked against the original publication or its official abstract. “Peer-reviewed article” means an original study in a refereed journal; “invited review article” means a commissioned survey of the evidence. 
              </p>
            </>
          ) : (
            <>
              <p className="unavailable-note">
                <strong>Research summary not yet available.</strong> A verified review of studies on this question has not been completed for this prototype, so no studies are shown. The background notes below come from published work but have not been checked study by study.
              </p>
              <button className="tell-more" onClick={() => setWhy((v) => !v)} aria-expanded={why}>
                {why ? '− Hide background notes' : `+ Background notes (${rel.explain.length})`}
              </button>
              {why && (
                <ul className="tell-list">
                  {rel.explain.map((c, i) => (
                    <li key={i}>
                      {c.text}
                      {fn(c.refs)}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">03</span>
          <h3>What can we conclude?</h3>
        </div>
        <div className="tell-body">
          <dl className="conclude">
            <dt><Tag kind="descriptive" /></dt>
            <dd>
              {sa && sb
                ? `${uc(nm(A))} ${verb(sa.dir)} and ${nm(B)} ${verb(sb.dir)} over the selected years. That is what happened, not why.`
                : 'One of the series has too few observations in the selected years to describe a trend.'}
            </dd>
            <dt><Tag kind="association" /></dt>
            <dd>
              {okL && okC
                ? `The levels show ${describeR(corr.rLevels)} (r = ${r(corr.rLevels)}); annual changes show ${describeR(corr.rChanges)} (r = ${r(corr.rChanges)}). Association alone does not tell us whether ${dimA} affects ${nm(B)}.`
                : 'Too few shared years for a meaningful correlation.'}
            </dd>
            <dt><Tag kind="causal" /></dt>
            <dd>
              {isImmCrime
                ? `Only research designed to isolate cause can answer that. For immigration and crime it mostly finds little or no effect on overall crime, with exceptions that depend on who migrates, the offence and the period. None of it isolates homicide.`
                : 'No verified research summary is available for this question yet, and the data shown here cannot establish cause.'}
            </dd>
          </dl>
          <p className="tell-text">{factors}</p>
          {whyItems.length > 0 && (
            <>
              <button className="tell-more" onClick={() => setCaveats((w) => !w)} aria-expanded={caveats}>
                {caveats ? '− Hide' : '+ Why two trends aren’t enough'} <span>({whyItems.length})</span>
              </button>
              <AnimatePresence initial={false}>
                {caveats && (
                  <motion.ul className="tell-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    {whyItems.map((c, i) => (
                      <li key={i}>
                        {c.text}
                        {fn(c.refs)}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

        </>
      )}

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
            const ref = REFERENCES[r]
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
