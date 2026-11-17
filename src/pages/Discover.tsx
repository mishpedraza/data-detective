import { motion } from 'framer-motion'
import * as d3 from 'd3'
import { hrefFor } from '../lib/route'
import { INDICATORS, series } from '../data/indicators'
import { RELATIONSHIPS } from '../data/relationships'
import { change } from '../lib/compare'

const FROM = 2000

function Line({ id, tone }: { id: string; tone: 'a' | 'b' }) {
  const s = series(id, 'ES').filter((p) => p.year >= FROM)
  if (s.length < 2) return null
  const ind = INDICATORS[id]
  const x = d3.scaleLinear().domain([FROM, 2025]).range([2, 178])
  const y = d3.scaleLinear().domain(d3.extent(s, (p) => p.value) as [number, number]).range([30, 4])
  const d = s.map((p, i) => `${i && p.year === s[i - 1].year + 1 ? 'L' : 'M'}${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const last = s[s.length - 1]
  const c = change(ind, 'ES', s[0].year, last.year)
  const delta = c ? (c.pct != null ? `${c.pct >= 0 ? '+' : '−'}${Math.abs(c.pct).toFixed(0)}%` : `${c.abs >= 0 ? '+' : '−'}${Math.abs(c.abs).toFixed(1)} pts`) : ''
  return (
    <span className={`feat-line tone-${tone}`}>
      <svg viewBox="0 0 180 34" width="180" height="34" aria-hidden>
        <path d={d} className="spark-line" />
        <circle cx={x(last.year)} cy={y(last.value)} r={2.5} className="spark-dot" />
      </svg>
      <span className="feat-stat">
        <b>{delta}</b> {ind.short.replace(/\s*\(.*?\)/g, '').toLowerCase()} <i>{s[0].year}–{last.year}</i>
      </span>
    </span>
  )
}

type Featured = { q: string; a: string; b: string; rel?: string; note?: string }
const FEATURED: Featured[] = [
  { q: 'Why has housing become so unaffordable?', a: 'house_price_real', b: 'disp_income_real', rel: 'housing-affordability' },
  { q: 'Does immigration increase crime?', a: 'foreign_born_share', b: 'crime_homicide_long', rel: 'immigration-crime' },
  { q: 'Is the economy growing while ordinary people get poorer?', a: 'gdp_pc_real', b: 'real_wage', rel: 'growth-wages' },
]
const COMING = ['Are younger generations economically worse off than their parents?']

export function Discover({ navigate }: { navigate: (h: string) => void }) {
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); navigate(hrefFor('investigate', { r: id })) }
  const more = RELATIONSHIPS.filter((r) => !FEATURED.some((f) => f.rel === r.id))
  return (
    <div className="discover">
      <section className="hero">
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          Big questions.<br /> <em>Real evidence.</em>
        </motion.h1>
        <motion.p className="hero-sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          Explore what the data reveals about the issues shaping our lives.
        </motion.p>
      </section>

      <section className="featured" aria-label="Featured questions">
        <ol>
          {FEATURED.map((f, i) => {
            const body = (
              <>
                <span className="q-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="feat-text">
                  <span className="feat-q">{f.q}</span>
                  {f.note && <span className="feat-note">{f.note}</span>}
                </span>
                <span className="feat-viz">
                  <Line id={f.a} tone="a" />
                  <Line id={f.b} tone="b" />
                </span>
                {f.rel && <span className="q-go" aria-hidden>→</span>}
              </>
            )
            return (
              <motion.li key={f.q} className={f.rel ? '' : 'soon'} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}>
                {f.rel ? <a href={hrefFor('investigate', { r: f.rel })} onClick={go(f.rel)}>{body}</a> : <div>{body}</div>}
              </motion.li>
            )
          })}
        </ol>
      </section>

      <section className="more-q" aria-label="More questions">
        <h2 className="section-label">More questions to investigate</h2>
        <ol>
          {more.map((r, i) => (
            <li key={r.id}>
              <a href={hrefFor('investigate', { r: r.id })} onClick={go(r.id)}>
                <span className="q-num">{String(FEATURED.length + i + 1).padStart(2, '0')}</span>
                <span className="more-text">{r.question}</span>
                <span className="q-go" aria-hidden>→</span>
              </a>
            </li>
          ))}
          {COMING.map((q, i) => (
            <li key={q} className="soon">
              <div>
                <span className="q-num">{String(FEATURED.length + more.length + i + 1).padStart(2, '0')}</span>
                <span className="more-text">{q}<span className="feat-note">In preparation</span></span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="principles">
        <div>
          <h3>Real data only</h3>
          <p>Every line comes from Eurostat, the OECD, the World Bank/UNODC or Spain’s official statistics, with its source one click away.</p>
        </div>
        <div>
          <h3>Breaks are flagged</h3>
          <p>When definitions or methods change, the line breaks rather than pretending the series is continuous.</p>
        </div>
        <div>
          <h3>Correlation is not cause</h3>
          <p>We show how things moved together, what research suggests, and what the data cannot tell us.</p>
        </div>
      </section>
    </div>
  )
}
