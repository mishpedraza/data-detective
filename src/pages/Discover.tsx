import { motion } from 'framer-motion'
import * as d3 from 'd3'
import { hrefFor } from '../lib/route'
import { INDICATORS, formatValue, series } from '../data/indicators'
import { RELATIONSHIPS } from '../data/relationships'

function Spark({ id, tone }: { id: string; tone: 'a' | 'b' }) {
  const s = series(id, 'ES').filter((p) => p.year >= 2000)
  if (s.length < 2) return null
  const x = d3.scaleLinear().domain([2000, 2025]).range([2, 158])
  const y = d3.scaleLinear().domain(d3.extent(s, (p) => p.value) as [number, number]).range([34, 4])
  const d = d3.line<{ year: number; value: number }>().x((p) => x(p.year)).y((p) => y(p.value)).curve(d3.curveMonotoneX)(s) ?? ''
  const last = s[s.length - 1]
  return (
    <span className={`spark-item tone-${tone}`}>
      <svg width="160" height="38" aria-hidden>
        <path d={d} className="spark-line" />
        <circle cx={x(last.year)} cy={y(last.value)} r={2.5} className="spark-dot" />
      </svg>
      <span className="spark-label">
        {INDICATORS[id].short} <b>{formatValue(last.value, INDICATORS[id].format)}</b> <i>{last.year}</i>
      </span>
    </span>
  )
}

const COMING = ['Are younger generations economically worse off than their parents?']

export function Discover({ navigate }: { navigate: (h: string) => void }) {
  return (
    <div className="discover">
      <section className="hero">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          Data Detective
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          Question what you <em>think</em> you know.
        </motion.h1>
        <motion.p className="hero-sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          Popular beliefs about immigration, crime, housing and living standards, tested against 25 years of official statistics. Pick a question to start investigating.
        </motion.p>
        <motion.a className="cta" href={hrefFor('investigate')} onClick={(e) => { e.preventDefault(); navigate(hrefFor('investigate')) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Start with Spain <span aria-hidden>→</span>
        </motion.a>
      </section>

      <section className="questions" aria-label="Questions">
        <h2 className="section-label">Questions people argue about</h2>
        <ol>
          {RELATIONSHIPS.map((r, i) => (
            <motion.li key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.05 }}>
              <a href={hrefFor('investigate', { r: r.id })} onClick={(e) => { e.preventDefault(); navigate(hrefFor('investigate', { r: r.id })) }}>
                <span className="q-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="q-text">{r.question}</span>
                <span className="q-sparks">
                  <Spark id={r.left.default} tone="a" />
                  <Spark id={r.right.default} tone="b" />
                </span>
                <span className="q-go" aria-hidden>→</span>
              </a>
            </motion.li>
          ))}
          {COMING.map((q, i) => (
            <li key={q} className="coming">
              <div>
                <span className="q-num">{String(RELATIONSHIPS.length + i + 1).padStart(2, '0')}</span>
                <span className="q-text">{q}</span>
                <span className="q-soon">In preparation: needs income and home-ownership data by age</span>
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
