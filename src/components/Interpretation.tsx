import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COUNTRIES } from '../data/countries'
import { DIMENSIONS, INDICATORS, formatValue, series } from '../data/indicators'
import { REFERENCES } from '../data/references'
import { DESIGN_LABEL, OUTCOME_LABEL, STATUS_LABEL, STUDIES, SYNTHESIS, outcomesFor, type Study } from '../data/research'
import type { Claim, Indicator, Point, Relationship } from '../data/types'
import { correlations } from '../lib/narrative'
import { describeR, inRange } from '../lib/stats'

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

function StudyCard({ s, relevant, open, onToggle }: { s: Study; relevant: boolean; open: boolean; onToggle: () => void }) {
  return (
    <li className={`study ${open ? 'open' : ''}`}>
      <button className="study-head" onClick={onToggle} aria-expanded={open}>
        <span className="study-meta">
          <span className="study-place">{s.place}</span>
          <span className="study-period">{s.period}</span>
          {relevant && <span className="study-relevant">Covers this crime type</span>}
        </span>
        <span className="study-headline">{s.headline}</span>
        <span className="study-cite">
          {s.authors.split(/, | & /).length > 2 ? `${s.authors.split(/, | & /)[0].split(' ').slice(-1)[0]} et al.` : s.authors.split(' & ').map((n) => n.split(' ').slice(-1)[0]).join(' & ')} ({s.year}) · {STATUS_LABEL[s.status]}
        </span>
        <span className="study-toggle" aria-hidden>{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="study-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
            <dl>
              <dt>Study</dt>
              <dd>
                <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                <br />
                {s.authors}. <em>{s.outlet}</em>, {s.year}.
              </dd>
              <dt>Type</dt>
              <dd>{STATUS_LABEL[s.status]} · {DESIGN_LABEL[s.design]}</dd>
              <dt>Where &amp; when</dt>
              <dd>{s.place}; {s.period}</dd>
              <dt>Outcomes studied</dt>
              <dd>{s.outcomes.map((o) => OUTCOME_LABEL[o]).join(', ')}</dd>
              <dt>Main finding</dt>
              <dd>{s.finding}</dd>
              <dt>How they did it</dt>
              <dd>{s.method}</dd>
              <dt>Limitations</dt>
              <dd>{s.limitations}</dd>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function Interpretation({ rel, a, b, compare, from, to }: Props) {
  const [why, setWhy] = useState(false)
  const [openStudy, setOpenStudy] = useState<string | null>(null)
  const A = INDICATORS[a]
  const B = INDICATORS[b]
  const sa = summarise(A, 'ES', from, to)
  const sb = summarise(B, 'ES', from, to)
  const corr = correlations(a, b, 'ES', from, to)
  const enough = corr.levels.length >= 4
  const r = (v: number | null) => (v == null ? 'n/a' : v.toFixed(2).replace('-', '−'))

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
  const dimB = DIMENSIONS[B.dimension].noun
  const verb = (d: Dir) => (d === 'stable' ? 'stayed broadly stable' : d)
  let pattern = ''
  if (sa && sb) {
    if (sa.dir === 'stable' || sb.dir === 'stable') pattern = `Here ${nm(A)} ${verb(sa.dir)} while ${nm(B)} ${verb(sb.dir)}.`
    else if (sa.dir === sb.dir) pattern = `Here both ${nm(A)} and ${nm(B)} ${sa.dir}.`
    else pattern = `Here ${nm(A)} ${sa.dir} while ${nm(B)} ${sb.dir}.`
  }
  const isImmCrime = rel.id === 'immigration-crime' || (A.dimension === 'immigration' && B.dimension === 'crime')
  const factors = isImmCrime
    ? `Other factors may influence ${nm(B)}, including economic conditions, an ageing population, policing, and changes in how offences are reported and recorded.`
    : `Both can be shaped by other forces at the same time, such as the business cycle, policy changes, population change, or changes in how the data are measured.`

  const why_items: Claim[] = [...rel.cannot]
  for (const ind of [A, B]) {
    const bs = ind.breaks.filter((x) => x.year > from && x.year <= to)
    if (bs.length) why_items.push({ text: `${ind.short}: the series has ${bs.length === 1 ? 'a break' : `${bs.length} breaks`} in this period (${bs.map((x) => x.year).join(', ')}), so values on either side are not fully comparable.`, refs: [`data:${ind.id}`] })
  }
  if (compare && [A, B].some((x) => x.dimension === 'crime'))
    why_items.push({ text: `Crime levels in Spain and ${COUNTRIES[compare].name} are not directly comparable because legal definitions and recording practices differ. Compare the direction of trends, not the levels.`, refs: ['eurostatCrime'] })

  const relevantOutcomes = outcomesFor(B.dimension === 'crime' ? b : a)
  const crimeInd = B.dimension === 'crime' ? B : A.dimension === 'crime' ? A : null

  return (
    <section className="tell" aria-labelledby="tell-title">
      <h2 id="tell-title">What does this actually tell us?</h2>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">01</span>
          <h3>What the data shows</h3>
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
                  <p className="ti-cov">Fewer than two observations in {from}–{to}, so no change can be described.</p>
                )}
              </article>
            ))}
          </div>
          {compare && (
            <p className="ti-compare">
              {(() => {
                const parts = [A, B].flatMap((ind) => {
                  const s = summarise(ind, compare, from, to)
                  return s ? [`${nm(ind)} ${verb(s.dir)} from ${formatValue(s.first.value, ind.format)} (${s.first.year}) to ${formatValue(s.last.value, ind.format)} (${s.last.year})`] : []
                })
                return parts.length ? `In ${COUNTRIES[compare].name}, ${parts.join(', and ')}.` : `No data for ${COUNTRIES[compare].name} in this period.`
              })()}
            </p>
          )}
          <div className="ti-assoc">
            <Tag kind="association" />
            {enough ? (
              <p>
                In the {corr.levels.length} years where both series have data ({corr.levels[0].year}–{corr.levels[corr.levels.length - 1].year}), their levels show {describeR(corr.rLevels)} (r = {r(corr.rLevels)}), and their year-to-year changes show {describeR(corr.rChanges)} (r = {r(corr.rChanges)}). Levels often move together simply because both follow long-run trends; year-to-year changes are a stricter test.
                {fn([`data:${a}`, `data:${b}`])}
              </p>
            ) : (
              <p>Fewer than four years have data for both series in this period, which is too few to calculate a relationship.</p>
            )}
          </div>
        </div>
      </div>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">02</span>
          <h3>Does this prove anything?</h3>
        </div>
        <div className="tell-body">
          <p className="tell-lead">
            {pattern} These trends do not establish whether {dimA} caused {sb ? nm(B) : dimB} to rise or fall. {factors}
          </p>
          <p className="tell-text">
            {sa && sb && sa.dir !== sb.dir && sa.dir !== 'stable' && sb.dir !== 'stable'
              ? `Opposite trends do not show that ${dimA} reduced ${nm(B)}. They also cannot rule out an effect in either direction that was outweighed by other forces.`
              : sa && sb && sa.dir === sb.dir && sa.dir !== 'stable'
                ? `Rising or falling together does not show that one drove the other. Many unrelated series share a trend over the same years.`
                : `A flat series next to a changing one tells us little on its own about cause and effect.`}{' '}
            Answering that needs studies designed to separate cause from coincidence, like those below.
          </p>
          <button className="tell-more" onClick={() => setWhy((w) => !w)} aria-expanded={why}>
            {why ? '− Hide' : '+ Why two trends aren’t enough'} <span>({why_items.length})</span>
          </button>
          <AnimatePresence initial={false}>
            {why && (
              <motion.ul className="tell-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                {why_items.map((c, i) => (
                  <li key={i}>
                    {c.text}
                    {fn(c.refs)}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="tell-part">
        <div className="tell-label">
          <span className="evidence-num">03</span>
          <h3>What researchers have found</h3>
          {isImmCrime && <Tag kind="causal" />}
        </div>
        <div className="tell-body">
          {isImmCrime ? (
            <>
              <div className="synthesis">
                {SYNTHESIS.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {crimeInd && (
                  <p className="synthesis-note">
                    You are looking at <strong>{nm(crimeInd)}</strong>.{' '}
                    {relevantOutcomes.length
                      ? `Studies marked “Covers this crime type” report results for ${relevantOutcomes.map((o) => OUTCOME_LABEL[o].toLowerCase()).join(' or ')}.`
                      : 'None of the studies below reports results for this specific category.'}
                  </p>
                )}
              </div>
              {(['Spain', 'Europe', 'Review'] as const).map((scope) => (
                <div key={scope} className="study-group">
                  <h4>{scope === 'Spain' ? 'Studies of Spain' : scope === 'Europe' ? 'Studies elsewhere in Europe' : 'Reviews of the research'}</h4>
                  <ul className="studies">
                    {STUDIES.filter((s) => s.scope === scope).map((s) => (
                      <StudyCard key={s.id} s={s} relevant={s.outcomes.some((o) => relevantOutcomes.includes(o))} open={openStudy === s.id} onToggle={() => setOpenStudy((o) => (o === s.id ? null : s.id))} />
                    ))}
                  </ul>
                </div>
              ))}
              <p className="tell-fine">
                All studies were checked against the original publication or its official abstract. “Peer-reviewed article” means an original study in a refereed journal; “invited review article” means a commissioned survey of the evidence. No working papers are included.
              </p>
            </>
          ) : (
            <>
              <p className="unavailable-note">
                <strong>Research summary not yet available.</strong> A verified review of studies on this question has not been completed for this prototype. The notes below give context from published work but have not yet been checked study by study.
              </p>
              <ul className="tell-list">
                {rel.explain.map((c, i) => (
                  <li key={i}>
                    {c.text}
                    {fn(c.refs)}
                  </li>
                ))}
              </ul>
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
