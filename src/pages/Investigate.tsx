import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hrefFor } from '../lib/route'
import { DataNotes } from '../components/DataNotes'
import { Interpretation } from '../components/Interpretation'
import { InlinePicker } from '../components/InlinePicker'
import { RangeBrush } from '../components/RangeBrush'
import { ScatterChart } from '../components/ScatterChart'
import { TimeChart } from '../components/TimeChart'
import { COMPARE_OPTIONS, COUNTRIES } from '../data/countries'
import { EVENTS } from '../data/events'
import { DIMENSIONS, INDICATORS, coverage, formatValue, series } from '../data/indicators'
import { RELATIONSHIPS, relationshipById } from '../data/relationships'

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

export function Investigate({ params }: { params: URLSearchParams }) {
  const [relId, setRelId] = useState(() => params.get('r') ?? 'immigration-crime')
  const rel = relationshipById(relId)
  const [a, setA] = useState(() => (params.get('a') && INDICATORS[params.get('a')!] ? params.get('a')! : rel.left.default))
  const [b, setB] = useState(() => (params.get('b') && INDICATORS[params.get('b')!] ? params.get('b')! : rel.right.default))
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
  const playRef = useRef<number | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = tabsRef.current
    const btn = box?.querySelector<HTMLElement>('button.active')
    if (!box || !btn) return
    const left = btn.offsetLeft - box.offsetLeft
    if (left < box.scrollLeft || left + btn.offsetWidth > box.scrollLeft + box.clientWidth - 48) box.scrollTo({ left: Math.max(0, left - 24), behavior: 'smooth' })
  }, [rel.id])

  useEffect(() => {
    const q = hrefFor('investigate', { r: rel.id, a, b, c: compare === 'none' ? undefined : compare, from, to, view: view === 'scatter' ? 'scatter' : undefined, mode: view === 'scatter' && mode === 'changes' ? 'changes' : undefined })
    if (window.location.hash !== q) window.history.replaceState(null, '', q)
  }, [rel.id, a, b, compare, from, to, view, mode])

  function chooseRelationship(id: string) {
    const r = relationshipById(id)
    setRelId(id)
    setA(r.left.default)
    setB(r.right.default)
    setCompare(r.defaultCompare ?? 'none')
    setRange(defaultRange(r.left.default, r.right.default))
    setHoverYear(null)
  }

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
  const cmp = compare === 'none' ? null : compare
  const leftOpts = (rel.left.options.length ? rel.left.options : Object.keys(INDICATORS)).filter((id) => rel.id !== 'custom' || INDICATORS[id].dimension === A.dimension)
  const rightOpts = (rel.right.options.length ? rel.right.options : Object.keys(INDICATORS)).filter((id) => rel.id !== 'custom' || INDICATORS[id].dimension === B.dimension)
  const compareOpts = COMPARE_OPTIONS.filter((g) => g === 'none' || (A.data[g] && B.data[g])).map((g) => ({ value: g, label: g === 'none' ? 'nothing else' : COUNTRIES[g].name, hint: g === 'none' ? 'Spain only' : undefined }))
  const sparkA = useMemo(() => series(a, 'ES'), [a])
  const sparkB = useMemo(() => series(b, 'ES'), [b])
  const events = EVENTS.filter((e) => e.end >= from && e.start <= to && (!e.only || e.only.includes(A.dimension) || e.only.includes(B.dimension)))

  const covA = coverage(a)
  const covB = coverage(b)
  const valueAt = (id: string, y: number) => INDICATORS[id].data.ES?.[String(y)]

  const handleHover = (y: number | null) => {
    if (playing) setPlaying(false)
    setHoverYear(y)
  }

  return (
    <div className="investigate">
      <section className="inv-hero">
        <p className="eyebrow">Investigation · Spain, {MIN}–{MAX}</p>
        <h1 className="inv-title">Spain: What’s really happening?</h1>
        <p className="inv-sub">Explore how immigration, crime, economic growth, housing and living standards have evolved over the last 25 years.</p>
      </section>

      <nav className="rel-tabs" aria-label="Relationships">
        <div className="rel-tabs-inner" ref={tabsRef}>
          {RELATIONSHIPS.map((r) => (
            <button key={r.id} className={r.id === rel.id ? 'active' : ''} onClick={() => chooseRelationship(r.id)}>
              {r.shortQuestion}
              {r.id === rel.id && <motion.span layoutId="tab-underline" className="tab-underline" />}
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.section key={rel.id} className="question-block" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
          <p className="eyebrow">{rel.kicker}</p>
          <h2 className="question">{rel.question}</h2>
          <div className="sentence">
            Compare{' '}
            <InlinePicker label="Left indicator" tone="a" value={a} onChange={(v) => { setA(v); setHoverYear(null) }} options={leftOpts.map(optionFor)} />{' '}
            with{' '}
            <InlinePicker label="Right indicator" tone="b" value={b} onChange={(v) => { setB(v); setHoverYear(null) }} options={rightOpts.map(optionFor)} />{' '}
            in Spain, alongside{' '}
            <InlinePicker label="Comparison" value={compare} onChange={setCompare} options={compareOpts} display={compare === 'none' ? 'nothing else' : COUNTRIES[compare].name} />
            , from {from} to {to}.
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="View">
          <button role="tab" aria-selected={view === 'time'} className={view === 'time' ? 'on' : ''} onClick={() => setView('time')}>Over time</button>
          <button role="tab" aria-selected={view === 'scatter'} className={view === 'scatter' ? 'on' : ''} onClick={() => setView('scatter')}>Relationship</button>
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

      <AnimatePresence mode="wait">
        {view === 'time' ? (
          <motion.div key="time" className="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="year-strip" aria-live="polite">
              {hoverYear == null ? (
                <span>Hover, tap or drag across either chart to compare the same year in both.</span>
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
            <TimeChart indicator={A} compare={cmp && A.data[cmp] ? cmp : null} from={from} to={to} hoverYear={hoverYear} onHover={handleHover} tone="a" showEventLabels />
            <TimeChart indicator={B} compare={cmp && B.data[cmp] ? cmp : null} from={from} to={to} hoverYear={hoverYear} onHover={handleHover} tone="b" />
            {covA && covB && (covA[0] !== covB[0] || covA[1] !== covB[1]) && (
              <p className="coverage-note">
                The two series cover different years: <strong className="tone-a-text">{lowerFirst(A.short)}</strong> {covA[0]}–{covA[1]}, <strong className="tone-b-text">{lowerFirst(B.short)}</strong> {covB[0]}–{covB[1]}. Hatched areas mark years with no observation; they are gaps, not zero values, and nothing is estimated to fill them.
              </p>
            )}
            <ul className="event-legend">
              {events.map((e) => (
                <li key={e.id}>
                  <strong>{e.start === e.end ? e.start : `${e.start}–${String(e.end).slice(2)}`}</strong> {e.detail}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div key="scatter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScatterChart a={a} b={b} from={from} to={to} mode={mode} hoverYear={hoverYear} onHover={setHoverYear} />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="dims-line">
        Showing <span className="tone-a-text">{DIMENSIONS[A.dimension].label.toLowerCase()}</span> and <span className="tone-b-text">{DIMENSIONS[B.dimension].label.toLowerCase()}</span> on separate scales, because they are measured in different units.
      </p>

      <Interpretation rel={rel} a={a} b={b} compare={cmp} from={from} to={to} />
      <DataNotes ids={[a, b]} />
    </div>
  )
}
