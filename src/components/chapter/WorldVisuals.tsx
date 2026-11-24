import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { adoptionPenalties, gallupMoreCrime, permitCrime, violentCrime2025 } from '../../data/studyEvidence'
import { FERTILITY_INCOME, FERTILITY_YEARS, type FertilityYear } from '../../data/fertilityIncome'
import { useTiming } from './motion'

/** #4: two result cards on the same per-1,000 scale. */
function PermitCardsVisual() {
  const t = useTiming()
  const reduce = useReducedMotion()
  const cards = [
    { label: 'Got a permit', rate: Math.round((permitCrime.baseline - permitCrime.reduction) * 10), tone: 'got' },
    { label: 'Just missed out', rate: Math.round(permitCrime.baseline * 10), tone: 'missed' },
  ]
  return (
    <figure className="v-wd">
      <figcaption className="v-kicker">Recorded crime rate afterward · applicants near the cutoff</figcaption>
      <div className="v-permit-cards">
        {cards.map(({ label, rate, tone }, i) => (
          <motion.div key={label} className={`v-permit-card is-${tone}`} initial={reduce ? false : { rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }} transition={t(0.2 + i * 0.45, 0.55)}>
            <span className="v-permit-label">{label}</span>
            <strong>≈{rate} <small>in 1,000</small></strong>
            <span className="v-permit-dots" role="img" aria-label={`${rate} in 1,000`}>
              {Array.from({ length: 12 }, (_, j) => <i key={j} className={j < rate ? 'on' : ''} />)}
            </span>
          </motion.div>
        ))}
      </div>
      <p className="v-note">Same scale on both cards: each dot is 1 in 1,000. The study’s estimate: a 1.1% rate, cut by 0.6 points with a permit.</p>
    </figure>
  )
}

/** #5: earnings penalty paths from Table 2, before arrival and averaged over years 0–5 and 6–10. */
function AdoptionVisual() {
  const t = useTiming()
  const W = 340, H = 190, left = 44, right = 96, top = 18, bottom = 34
  const x = (i: number) => left + (i * (W - left - right)) / 2
  const y = (v: number) => top + (v / 20) * (H - top - bottom)
  const series = [
    { label: 'Gave birth', tone: 'birth', values: [0, adoptionPenalties.birth.short, adoptionPenalties.birth.long], dy: [16, -4] },
    { label: 'Adopted', tone: 'adopted', values: [0, adoptionPenalties.adopted.short, adoptionPenalties.adopted.long], dy: [-9, 12] },
  ]
  return (
    <figure className="v-wd">
      <figcaption className="v-kicker">Mothers’ earnings relative to fathers · change since before the child arrived</figcaption>
      <svg className="v-adopt" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Years 0 to 5: gave birth −${adoptionPenalties.birth.short}%, adopted −${adoptionPenalties.adopted.short}%. Years 6 to 10: gave birth −${adoptionPenalties.birth.long}%, adopted −${adoptionPenalties.adopted.long}%.`}>
        {[0, 10, 20].map((v) => <g key={v}><line x1={left} x2={W - right + 10} y1={y(v)} y2={y(v)} className="v-adopt-grid" /><text x={left - 8} y={y(v) + 4} textAnchor="end">{v ? `−${v}%` : '0'}</text></g>)}
        {['Before', 'Years 0–5', 'Years 6–10'].map((label, i) => <text key={label} x={x(i)} y={H - 10} textAnchor="middle">{label}</text>)}
        {series.map(({ label, tone, values, dy }, s) => (
          <g key={label} className={`is-${tone}`}>
            <motion.path d={values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.3 + s * 0.3, 1.1)} />
            {values.map((v, i) => <motion.circle key={i} cx={x(i)} cy={y(v)} r={4} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.4 + s * 0.3 + i * 0.35, 0.3)} />)}
            {values.slice(1).map((v, i) => <motion.text key={i} x={x(i + 1) + (i ? 8 : 0)} y={y(v) + dy[i]} textAnchor={i ? 'start' : 'middle'} className="v-adopt-value"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.9 + s * 0.3 + i * 0.35, 0.3)}>−{v}%{i ? ` ${label}` : ''}</motion.text>)}
          </g>
        ))}
      </svg>
      <p className="v-note">The study’s estimates (Table 2): averages over the first five years and years 6–10. The first-years gap of 3.7 points closes later on.</p>
    </figure>
  )
}

function Bars({ rows, max }: { rows: readonly { label: string; value: number; display: string; strong?: boolean }[]; max: number }) {
  const t = useTiming()
  return (
    <ul className="v-wd-bars">
      {rows.map(({ label, value, display, strong }, i) => (
        <li key={label} className={strong ? 'is-strong' : ''}>
          <span>{label}</span>
          <span className="v-wd-track"><motion.i initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={t(0.2 + i * 0.15, 0.7)} /></span>
          <strong>{display}</strong>
        </li>
      ))}
    </ul>
  )
}

/** #8: recorded violent crime first, then the separate Gallup panel. */
function CrimeDropVisual() {
  const t = useTiming()
  const after = 100 + violentCrime2025.change
  return (
    <div className="v-wd v-crime">
      <section>
        <p className="v-kicker">Recorded violent crime · FBI national estimates · 2024 = 100</p>
        <Bars max={100} rows={[{ label: '2024', value: 100, display: '100' }, { label: '2025', value: after, display: after.toFixed(1), strong: true }]} />
        <p className="v-note"><strong>{violentCrime2025.change}%</strong>, the largest one-year drop since the FBI’s estimates began in {violentCrime2025.since}.</p>
      </section>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={t(1.1, 0.5)}>
        <p className="v-kicker">What people said · Gallup, each October</p>
        <Bars max={100} rows={gallupMoreCrime.map(({ year, value }) => ({ label: String(year), value, display: `${value}%`, strong: year === 2026 }))} />
        <p className="v-note">Share of U.S. adults saying there is more crime in the U.S. than a year ago.</p>
      </motion.section>
    </div>
  )
}

function fit(points: readonly { x: number; y: number }[]) {
  const n = points.length
  const mx = points.reduce((s, p) => s + p.x, 0) / n, my = points.reduce((s, p) => s + p.y, 0) / n
  const sxy = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0), syy = points.reduce((s, p) => s + (p.y - my) ** 2, 0)
  const slope = sxy / sxx
  return { slope, intercept: my - slope * mx, r: sxy / Math.sqrt(sxx * syy) }
}

const SHORT_NAMES: Readonly<Record<string, string>> = { 'United States': 'US', Netherlands: 'Neth.' }

/** Puts each label right or left of its dot, then nudges it up or down, until it clears the labels already placed. */
function placeLabels(points: readonly { country: string; x: number; y: number }[], width: number) {
  const placed: { country: string; lx: number; ly: number; anchor: 'start' | 'end'; left: number; right: number }[] = []
  const free = (left: number, right: number, ly: number) => left > 0 && right < width && !placed.some((p) => p.left < right + 2 && left - 2 < p.right && Math.abs(p.ly - ly) < 10)
  for (const point of [...points].sort((a, b) => a.y - b.y)) {
    const name = SHORT_NAMES[point.country] ?? point.country
    const size = name.length * 5.2
    const options = [0, -9, 9, -16, 16].flatMap((step) => (['start', 'end'] as const).map((anchor) => {
      const lx = anchor === 'start' ? point.x + 7 : point.x - 7
      return { lx, ly: point.y + 3 + step, anchor, left: anchor === 'start' ? lx : lx - size, right: anchor === 'start' ? lx + size : lx }
    }))
    const spot = options.find(({ left, right, ly }) => free(left, right, ly)) ?? options[0]
    placed.push({ country: name, ...spot })
  }
  return placed
}

const usd = (v: number) => `$${Math.round(v / 1000)}k`

/** #9: one dot per country; switch between the three years. */
function FertilityVisual() {
  const [year, setYear] = useState<FertilityYear>(2024)
  const t = useTiming()
  const rows = FERTILITY_INCOME[year]
  const W = 360, H = 260, left = 40, right = 18, top = 14, bottom = 36
  const logs = rows.map(({ gdp }) => Math.log(gdp))
  const lo = Math.min(...logs) - 0.08, hi = Math.max(...logs) + 0.08
  const x = (gdp: number) => left + ((Math.log(gdp) - lo) / (hi - lo)) * (W - left - right)
  const y = (births: number) => top + ((2.4 - births) / 1.4) * (H - top - bottom)
  const { slope, intercept, r } = fit(rows.map(({ gdp, births }) => ({ x: Math.log(gdp), y: births })))
  const line = [lo + 0.05, hi - 0.05].map((v) => ({ x: left + ((v - lo) / (hi - lo)) * (W - left - right), y: y(intercept + slope * v) }))
  const rising = r > 0
  const labels = placeLabels(rows.map(({ country, gdp, births }) => ({ country, x: x(gdp), y: y(births) })), W)
  return (
    <figure className="v-wd v-fert">
      <div className="v-toggle" role="group" aria-label="Year">
        {FERTILITY_YEARS.map((option) => <button key={option} type="button" aria-pressed={year === option} onClick={() => setYear(option)}>{option}</button>)}
      </div>
      <p className={`v-fert-trend ${rising ? 'is-up' : 'is-down'}`}>{year}: richer countries had {rising ? 'more' : 'fewer'} births per woman {rising ? '↗' : '↘'} <span>correlation {r > 0 ? '+' : '−'}{Math.abs(r).toFixed(2)}</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${year}: ${rows.map(({ country, births, gdp }) => `${country} ${births} births per woman, ${usd(gdp)}`).join('; ')}`}>
        {[1.0, 1.5, 2.0].map((v) => <g key={v} className="v-fert-grid"><line x1={left} x2={W - right} y1={y(v)} y2={y(v)} /><text x={left - 6} y={y(v) + 3} textAnchor="end">{v.toFixed(1)}</text></g>)}
        <text className="v-fert-axis" x={left} y={H - 6}>{usd(Math.exp(lo + 0.08))}</text>
        <text className="v-fert-axis" x={W - right} y={H - 6} textAnchor="end">{usd(Math.exp(hi - 0.08))}</text>
        <text className="v-fert-axis" x={(W + left - right) / 2} y={H - 6} textAnchor="middle">GDP per person (log scale) →</text>
        <motion.line key={`fit-${year}`} x1={line[0].x} y1={line[0].y} x2={line[1].x} y2={line[1].y} className="v-fert-fit"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.4, 0.8)} />
        {rows.map(({ country, gdp, births }) => (
          <motion.circle key={country} r={4.5} initial={false} animate={{ cx: x(gdp), cy: y(births) }} transition={t(0, 0.6)} />
        ))}
        {labels.map(({ country, lx, ly, anchor }) => (
          <motion.text key={country} className="v-fert-label" textAnchor={anchor} initial={false} animate={{ x: lx, y: ly }} transition={t(0, 0.6)}>{country}</motion.text>
        ))}
      </svg>
      <p className="v-note">Births per woman (vertical) against GDP per person in current US dollars (horizontal), World Bank data. The line is the best fit within each year.</p>
    </figure>
  )
}

export function WorldVisual({ question }: { question: ChapterQuestion }) {
  switch (question.visual) {
    case 'permitcards': return <PermitCardsVisual />
    case 'adoption': return <AdoptionVisual />
    case 'crimedrop': return <CrimeDropVisual />
    case 'fertility': return <FertilityVisual />
    default: return null
  }
}
