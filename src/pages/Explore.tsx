import { useMemo, useState } from 'react'
import { hrefFor } from '../lib/route'
import { ScatterChart } from '../components/ScatterChart'
import { DIMENSIONS, INDICATORS, coverage, indicatorsFor } from '../data/indicators'
import { editorialQuestionForRelationship } from '../data/editorial'
import { RELATIONSHIPS } from '../data/relationships'
import type { DimensionId } from '../data/types'

const PERIODS: { label: string; from: number; to: number }[] = [
  { label: 'Everything', from: 2000, to: 2025 },
  { label: 'The boom, 2000–2007', from: 2000, to: 2007 },
  { label: 'Crisis years, 2008–2013', from: 2008, to: 2013 },
  { label: 'Recovery, 2014–2019', from: 2014, to: 2019 },
  { label: 'Since COVID, 2020–2025', from: 2020, to: 2025 },
]
const DIMS = Object.keys(DIMENSIONS) as DimensionId[]

function Column({ value, onChange, tone, title }: { value: string; onChange: (v: string) => void; tone: 'a' | 'b'; title: string }) {
  return (
    <div className={`explore-col tone-${tone}`}>
      <h3>{title}</h3>
      {DIMS.map((d) => (
        <div key={d} className="explore-group">
          <h4>{DIMENSIONS[d].label}</h4>
          <ul>
            {indicatorsFor(d).map((i) => {
              const c = coverage(i.id)
              return (
                <li key={i.id}>
                  <button className={value === i.id ? 'on' : ''} onClick={() => onChange(i.id)}>
                    {i.short}
                    <small>{c ? `${c[0]}–${c[1]}` : ''}</small>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function Explore({ navigate }: { navigate: (h: string) => void }) {
  const [a, setA] = useState('imm_rate')
  const [b, setB] = useState('house_price_real')
  const [period, setPeriod] = useState(PERIODS[0])
  const curated = useMemo(
    () => RELATIONSHIPS.find((r) => r.left.options.includes(a) && r.right.options.includes(b)),
    [a, b],
  )
  const editorial = curated && editorialQuestionForRelationship(curated.id)
  const href = hrefFor('investigate', { r: curated?.id ?? 'custom', a, b, from: period.from, to: period.to })
  return (
    <div className="explore">
      <section className="explore-hero">
        <p className="eyebrow">Explore</p>
        <h1>Put any two things side by side.</h1>
        <p className="hero-sub">Choose a measure on each side and a period. You’ll see how they moved together in Spain, then open the full investigation.</p>
      </section>
      <div className="periods" role="radiogroup" aria-label="Period">
        {PERIODS.map((p) => (
          <button key={p.label} role="radio" aria-checked={period === p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="explore-grid">
        <Column value={a} onChange={setA} tone="a" title="This…" />
        <div className="explore-preview">
          <p className="preview-q">
            <span className="tone-a-text">{INDICATORS[a].short}</span> and <span className="tone-b-text">{INDICATORS[b].short}</span>, {period.from}–{period.to}
          </p>
          <ScatterChart a={a} b={b} from={period.from} to={period.to} mode="levels" hoverYear={null} onHover={() => {}} />
          <a className="cta" href={href} onClick={(e) => { e.preventDefault(); navigate(href) }}>
            {editorial?.status === 'available' ? `Open “${editorial.question}”` : 'Open this comparison'} <span aria-hidden>→</span>
          </a>
        </div>
        <Column value={b} onChange={setB} tone="b" title="…against this" />
      </div>
    </div>
  )
}
