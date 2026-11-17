import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hrefFor } from '../lib/route'
import { DataNotes } from '../components/DataNotes'
import { Interpretation } from '../components/Interpretation'
import { InlinePicker } from '../components/InlinePicker'
import { RangeBrush } from '../components/RangeBrush'
import { ScatterChart } from '../components/ScatterChart'
import { TimeChart } from '../components/TimeChart'
import { COMPARE_OPTIONS, COUNTRIES, comparability } from '../data/countries'
import { EVENTS } from '../data/events'
import { INDICATORS, coverage, formatValue, series } from '../data/indicators'
import { InvestigationIntro } from '../components/InvestigationIntro'
import { editorialQuestionForRelationship } from '../data/editorial'
import { relationshipById } from '../data/relationships'
import { REVIEWED_ANSWERS } from '../data/reviewedAnswers'
import { answerFor } from '../lib/answers'

const MIN = 1998
const MAX = 2025

function defaultRange(a: string, b: string): [number, number] {
  const ca = coverage(a)
  const cb = coverage(b)
  const lo = Math.max(2000, Math.min(ca?.[0] ?? 2000, cb?.[0] ?? 2000))
  const hi = Math.max(ca?.[1] ?? MAX, cb?.[1] ?? MAX)
  return [lo, Math.min(MAX, hi)]
}

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s)

const optionFor = (id: string) => {
  const c = coverage(id)
  return { value: id, label: lowerFirst(INDICATORS[id].short), hint: c ? `${c[0]}–${c[1]}` : '' }
}

export function Investigate({ params, relationshipId }: { params: URLSearchParams; relationshipId: string }) {
  const rel = relationshipById(relationshipId)
  const editorial = editorialQuestionForRelationship(rel.id)
  const [a, setA] = useState(() => (params.get('a') && INDICATORS[params.get('a')!] && (!rel.left.options.length || rel.left.options.includes(params.get('a')!)) ? params.get('a')! : rel.left.default))
  const [b, setB] = useState(() => (params.get('b') && INDICATORS[params.get('b')!] && (!rel.right.options.length || rel.right.options.includes(params.get('b')!)) ? params.get('b')! : rel.right.default))
  const [compare, setCompare] = useState<string>(() => params.get('c') ?? rel.defaultCompare ?? 'none')
  const [[from, to], setRange] = useState<[number, number]>(() => {
    const f = Number(params.get('from'))
    const t = Number(params.get('to'))
    return f && t ? [f, t] : defaultRange(a, b)
  })
  const [view, setView] = useState<'time' | 'scatter'>(() => (params.get('view') === 'scatter' ? 'scatter' : 'time'))
  const [mode, setMode] = useState<'levels' | 'changes'>(() => (params.get('mode') === 'changes' ? 'changes' : 'levels'))
  const [hoverYear, setHoverYear] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [ctx, setCtx] = useState(false)
  const playRef = useRef<number | null>(null)

  useEffect(() => {
    const q = hrefFor('investigate', { r: rel.id, a, b, c: compare === 'none' ? undefined : compare, from, to, view: view === 'scatter' ? 'scatter' : undefined, mode: view === 'scatter' && mode === 'changes' ? 'changes' : undefined })
    if (window.location.hash !== q) window.history.replaceState(null, '', q)
  }, [rel.id, a, b, compare, from, to, view, mode])

  useEffect(() => {
    if (!playing) return
    let y = from
    playRef.current = window.setInterval(() => {
      y += 1
      if (y > to) {
        setPlaying(false)
        return
      }
      setHoverYear(y)
    }, 420)
    return () => {
      if (playRef.current) window.clearInterval(playRef.current)
    }
  }, [playing, from, to])

  const A = INDICATORS[a]
  const B = INDICATORS[b]
  const leftOpts = (rel.left.options.length ? rel.left.options : Object.keys(INDICATORS)).filter((id) => rel.id !== 'custom' || INDICATORS[id].dimension === A.dimension)
  const rightOpts = (rel.right.options.length ? rel.right.options : Object.keys(INDICATORS)).filter((id) => rel.id !== 'custom' || INDICATORS[id].dimension === B.dimension)
  const compareOpts = COMPARE_OPTIONS.filter((g) => g === 'none' || (A.data[g] && B.data[g] && comparability(A, g).ok && comparability(B, g).ok)).map((g) => ({ value: g, label: g === 'none' ? 'nothing else' : COUNTRIES[g].name, hint: g === 'none' ? 'Spain only' : undefined }))
  const cmp = compare !== 'none' && compareOpts.some((o) => o.value === compare) ? compare : null
  const cmpNote = cmp ? [A, B].filter((x) => x.dimension === 'crime' || x.geoSources?.[cmp]).map((x) => comparability(x, cmp).note).filter(Boolean).join(' ') : ''
  const cmpBlocked = compare !== 'none' && !cmp && COUNTRIES[compare]
    ? [A, B].map((x) => (x.data[compare] ? comparability(x, compare) : { ok: false, note: `No data for ${COUNTRIES[compare].name} on ${x.short.toLowerCase()}.` })).find((c) => !c.ok)?.note
    : undefined
  const sparkA = useMemo(() => series(a, 'ES'), [a])
  const sparkB = useMemo(() => series(b, 'ES'), [b])
  const events = EVENTS.filter((e) => e.end >= from && e.start <= to && (!e.only || e.only.includes(A.dimension) || e.only.includes(B.dimension)))

  const reviewed = REVIEWED_ANSWERS[rel.id]
  const answer = answerFor(rel.id, a, b, cmp, from, to)
  const covA = coverage(a)
  const covB = coverage(b)
  const valueAt = (id: string, y: number) => INDICATORS[id].data.ES?.[String(y)]

  const handleHover = (y: number | null) => {
    if (playing) setPlaying(false)
    setHoverYear(y)
  }

  return (
    <div className="investigate">
      <InvestigationIntro
        active={editorial?.status === 'available' ? editorial.id : undefined}
        current={{ id: rel.id, label: rel.question }}
        headline={reviewed?.headline ?? answer?.headline ?? 'There are too few overlapping years to compare these measures.'}
        note={reviewed?.scope ?? answer?.dek}
      >
        <details className="investigation-controls">
          <summary className="tell-more">Change indicators or country</summary>
          <div className="sentence">
            Compare{' '}
            <InlinePicker label="Left indicator" tone="a" value={a} onChange={(v) => { setA(v); setHoverYear(null) }} options={leftOpts.map(optionFor)} />{' '}
            with{' '}
            <InlinePicker label="Right indicator" tone="b" value={b} onChange={(v) => { setB(v); setHoverYear(null) }} options={rightOpts.map(optionFor)} />{' '}
            in Spain. Compare with{' '}
            <InlinePicker label="Comparison" value={cmp ?? 'none'} onChange={setCompare} options={compareOpts} display={cmp ? COUNTRIES[cmp].name : 'no other country'} />.
          </div>
        </details>
      </InvestigationIntro>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="View">
          <button role="tab" aria-selected={view === 'time'} className={view === 'time' ? 'on' : ''} onClick={() => setView('time')}>Over time</button>
          <button role="tab" aria-selected={view === 'scatter'} className={view === 'scatter' ? 'on' : ''} onClick={() => setView('scatter')}>Correlation</button>
        </div>
        {view === 'scatter' ? (
          <div className="segmented small" role="tablist" aria-label="Compare">
            <button role="tab" aria-selected={mode === 'levels'} className={mode === 'levels' ? 'on' : ''} onClick={() => setMode('levels')}>Levels</button>
            <button role="tab" aria-selected={mode === 'changes'} className={mode === 'changes' ? 'on' : ''} onClick={() => setMode('changes')}>Year-to-year changes</button>
          </div>
        ) : (
          <button className="play" onClick={() => { if (!playing) setHoverYear(from); setPlaying((p) => !p) }} aria-pressed={playing}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1.5" width="3" height="9" fill="currentColor" /><rect x="7" y="1.5" width="3" height="9" fill="currentColor" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 1.5 10 6l-7.5 4.5z" fill="currentColor" /></svg>
            )}
            {playing ? 'Pause' : 'Play the years'}
          </button>
        )}
        <div className="brush-wrap">
          <RangeBrush min={MIN} max={MAX} from={from} to={to} onChange={(f, t) => setRange([f, t])} sparkA={sparkA} sparkB={sparkB} />
        </div>
      </div>
      {view === 'scatter' && <p className="chart-notes">Each dot is a year. This view shows how closely the measures move together. Choose Year-to-year changes to compare annual rises and falls. Correlation alone cannot establish cause.</p>}

      <AnimatePresence mode="wait">
        {view === 'time' ? (
          <motion.div key="time" className="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="year-strip" aria-live="polite">
              {hoverYear == null ? (
                <span>{cmpBlocked ? `${COUNTRIES[compare].name.replace(/^the/, 'The')} is not shown. ${cmpBlocked}` : cmpNote || 'Hover, tap or drag across either chart to compare the same year in both.'}</span>
              ) : (
                <>
                  <span className="year-strip-year">{hoverYear}</span>
                  {[A, B].map((ind, i) => {
                    const v = valueAt(ind.id, hoverYear)
                    return (
                      <span key={ind.id} className={`year-strip-item tone-${i ? 'b' : 'a'}`}>
                        {lowerFirst(ind.short)} {v == null ? <em>Data unavailable</em> : <strong>{formatValue(v, ind.format)}</strong>}
                      </span>
                    )
                  })}
                  <button className="year-strip-clear" onClick={() => { setPlaying(false); setHoverYear(null) }}>Clear</button>
                </>
              )}
            </div>
            <TimeChart indicator={A} compare={cmp && A.data[cmp] ? cmp : null} from={from} to={to} hoverYear={hoverYear} onHover={handleHover} tone="a" showEventLabels showEvents={ctx} />
            <TimeChart indicator={B} compare={cmp && B.data[cmp] ? cmp : null} from={from} to={to} hoverYear={hoverYear} onHover={handleHover} tone="b" showEvents={ctx} />
            {covA && covB && (
              <p className="chart-notes">
                Data availability: <span className="tone-a-text">{lowerFirst(A.short)}</span> {covA[0]}–{covA[1]}; <span className="tone-b-text">{lowerFirst(B.short)}</span> {covB[0]}–{covB[1]}. Hatched areas mark missing data. Each chart has its own scale.
              </p>
            )}
            {events.length > 0 && (
              <>
                <button className="tell-more ctx-toggle" onClick={() => setCtx((v) => !v)} aria-expanded={ctx}>
                  {ctx ? '− Hide historical context' : `+ Historical context (${events.length})`}
                </button>
                {ctx && (
                  <ul className="event-legend">
                    {events.map((e) => (
                      <li key={e.id}>
                        <strong>{e.start === e.end ? e.start : `${e.start}–${String(e.end).slice(2)}`}</strong> {e.detail}
                      </li>
                    ))}
                    <li className="event-caveat">Shown as background; an event in the same years is not evidence that it caused a change.</li>
                  </ul>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="scatter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScatterChart a={a} b={b} from={from} to={to} mode={mode} hoverYear={hoverYear} onHover={setHoverYear} />
          </motion.div>
        )}
      </AnimatePresence>

      <Interpretation rel={rel} a={a} b={b} compare={cmp} from={from} to={to} reviewed={reviewed} />
      <DataNotes ids={[a, b]} />
    </div>
  )
}
