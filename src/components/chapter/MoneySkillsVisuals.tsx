import { useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { FEES, FUNDS, GAP, LUMP, WEALTH, finalValue } from '../../data/moneySkills'
import { splitPick } from '../../lib/chapterScore'
import { useTiming } from './motion'

const euro = (value: number) => `€${Math.round(value).toLocaleString('en-GB')}`

function Dots({ on, label }: { on: number; label: string }) {
  const reduce = useReducedMotion()
  return (
    <div className="mh-dots" style={{ '--cols': 20 } as CSSProperties} role="img" aria-label={label}>
      {Array.from({ length: 100 }, (_, i) => (
        <motion.i key={i} className={i < on ? 'is-on' : ''} initial={reduce ? false : { opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 0.1 + i * 0.008, duration: 0.25 }} />
      ))}
    </div>
  )
}

/** Q1: share of historical one-year periods won by each approach. */
function LumpVisual() {
  return (
    <div className="mm-lump">
      <p className="v-kicker">100 historical one-year periods, global stocks 1976–2022</p>
      <Dots on={LUMP.lumpBeatsAveraging} label={`Investing at once came out ahead in ${LUMP.lumpBeatsAveraging} of every 100 periods, and spreading it over three months in ${100 - LUMP.lumpBeatsAveraging}.`} />
      <p className="mh-legend"><i className="is-on" /> Investing at once won ({LUMP.lumpBeatsAveraging}) <i /> Spreading it out won ({100 - LUMP.lumpBeatsAveraging})</p>
      <div className="mh-extra">
        <p className="v-kicker">Both beat waiting</p>
        <p>Either way of investing beat leaving the money in cash about 7 times in 10 ({LUMP.lumpBeatsCash}% and {LUMP.averagingBeatsCash}%). Waiting in cash has a cost: missed growth.</p>
      </div>
    </div>
  )
}

/** Q2: leaderboard of the December 2020 top-quartile funds, year by year. */
function FundsVisual() {
  const t = useTiming()
  const rows = [{ year: 2020, share: 100 }, ...FUNDS.years]
  return (
    <div className="mm-board">
      <p className="v-kicker">Top-quarter US stock funds of 2020, still in the top quarter</p>
      <ol role="img" aria-label={`Of ${FUNDS.start} top-quarter funds at the end of 2020, ${Math.round(FUNDS.start * FUNDS.years[0].share / 100)} were still in the top quarter after one year, and none after two, three and four years.`}>
        {rows.map(({ year, share }, i) => {
          const funds = Math.round(FUNDS.start * share / 100)
          return (
            <li key={year} className={funds === 0 ? 'is-zero' : ''}>
              <span className="mm-board-year">{i === 0 ? 'End 2020' : `${i} year${i > 1 ? 's' : ''} on`}</span>
              <span className="mm-board-track"><motion.span className="mm-board-bar" initial={{ width: '100%' }} animate={{ width: `${Math.max(share, funds ? 1.5 : 0)}%` }} transition={t(0.3 + i * 0.4, 0.7)} /></span>
              <span className="mm-board-count">{funds} {funds === 1 ? 'fund' : 'funds'}</span>
            </li>
          )
        })}
      </ol>
      <p className="v-note">{FUNDS.categories.map(({ label, funds }) => `${label} ${funds}`).join(' · ')}. In every group, none lasted four years.</p>
      <div className="mh-extra">
        <p className="v-kicker">Pure luck would do better</p>
        <p>If rankings were random, about 1 fund in 256 would stay on top four years running: 2 of these 512.</p>
      </div>
    </div>
  )
}

function Range({ label, value, min, max, step, show, onChange }: {
  label: string; value: number; min: number; max: number; step: number; show: string; onChange: (value: number) => void
}) {
  return (
    <label className="mm-range">
      <span><span>{label}</span><strong>{show}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} aria-valuetext={show} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

/** Q3: two compounding paths, then a calculator to change the assumptions. */
function FeesVisual() {
  const t = useTiming()
  const [amount, setAmount] = useState<number>(FEES.amount)
  const [gross, setGross] = useState<number>(FEES.gross)
  const [cheap, setCheap] = useState<number>(FEES.cheap)
  const [dear, setDear] = useState<number>(FEES.dear)
  const [years, setYears] = useState<number>(FEES.years)
  const low = finalValue(amount, gross, cheap, years)
  const high = finalValue(amount, gross, dear, years)
  const top = Math.max(low, high, amount)
  const path = (fee: number) => Array.from({ length: years + 1 }, (_, y) =>
    `${y ? 'L' : 'M'}${(30 + (y / years) * 280).toFixed(1)} ${(150 - (finalValue(amount, gross, fee, y) / top) * 130).toFixed(1)}`).join(' ')
  const lines = [{ id: 'cheap', fee: cheap, value: low }, { id: 'dear', fee: dear, value: high }]
  return (
    <div className="mm-fees">
      <p className="v-kicker">Hypothetical illustration, not a forecast</p>
      <svg viewBox="0 0 400 170" className="mm-chart" role="img" aria-label={`${euro(amount)} growing at ${gross}% a year before fees for ${years} years: ${euro(low)} with a ${cheap}% fee and ${euro(high)} with a ${dear}% fee, a difference of ${euro(Math.abs(low - high))}.`}>
        <line x1="30" y1="150" x2="310" y2="150" className="mh-axis" />
        <line x1="30" y1="150" x2="30" y2="15" className="mh-axis" />
        <text x="30" y="164" className="mh-axis-label">Year 0</text>
        <text x="310" y="164" textAnchor="end" className="mh-axis-label">Year {years}</text>
        {lines.map(({ id, fee, value }, i) => (
          <g key={`${id}-${amount}-${gross}-${fee}-${years}`} className={`is-${id}`}>
            <motion.path d={path(fee)} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.2 + i * 0.2, 1.4)} />
            <text x="316" y={150 - (value / top) * 130 + (value === Math.max(low, high) ? 0 : 10)}>{fee}%: {euro(value)}</text>
          </g>
        ))}
      </svg>
      <p className="mm-fees-gap">Difference: <strong>{euro(Math.abs(low - high))}</strong></p>
      <details className="mm-calc">
        <summary>Change the assumptions</summary>
        <div className="mm-calc-grid">
          <Range label="Invested once" value={amount} min={1000} max={500000} step={1000} show={euro(amount)} onChange={setAmount} />
          <Range label="Return before fees" value={gross} min={0} max={12} step={0.5} show={`${gross}% a year`} onChange={setGross} />
          <Range label="Lower fee" value={cheap} min={0} max={3} step={0.05} show={`${cheap}% a year`} onChange={setCheap} />
          <Range label="Higher fee" value={dear} min={0} max={3} step={0.05} show={`${dear}% a year`} onChange={setDear} />
          <Range label="Years invested" value={years} min={1} max={50} step={1} show={`${years} years`} onChange={setYears} />
        </div>
        <p className="v-note">Fees are subtracted from a steady yearly return. No taxes, inflation or further contributions. Not investment advice.</p>
      </details>
    </div>
  )
}

/** Q4: same fund, different timing; then Morningstar's aggregate figures. */
function GapVisual() {
  const t = useTiming()
  const investors = [
    { id: 'a', name: 'Investor A', plan: '€10,000 at the start', end: 10800, put: 10000 },
    { id: 'b', name: 'Investor B', plan: '€1,000 at the start, €9,000 after year 1', end: 9180, put: 10000 },
  ]
  const bars = [
    { label: 'All US funds and ETFs', fund: GAP.total, investor: GAP.investor },
    { label: 'US stock funds', fund: GAP.stocks.total, investor: GAP.stocks.investor },
  ]
  return (
    <div className="mm-gap">
      <p className="v-kicker">Same fund, different timing (illustration)</p>
      <p className="v-note">The fund rises 20% in year 1 and falls 10% in year 2: +8% overall for anyone who held it throughout.</p>
      <div className="mh-pair">
        {investors.map(({ id, name, plan, end, put }) => (
          <section key={id}>
            <strong>{name}</strong>
            <p>{plan}</p>
            <p>Ends with <strong>{euro(end)}</strong> ({end >= put ? '+' : '−'}{Math.abs(Math.round((end / put - 1) * 1000) / 10)}% on {euro(put)})</p>
          </section>
        ))}
      </div>
      <p className="v-kicker">Real figures, 10 years to 2025, a year</p>
      <div className="mm-bars" role="img" aria-label={bars.map(({ label, fund, investor }) => `${label}: funds ${fund}%, investors ${investor}%`).join('. ')}>
        {bars.map(({ label, fund, investor }, i) => (
          <div key={label} className="mm-bars-group">
            <span className="mm-bars-label">{label}</span>
            {[{ id: 'fund', name: 'Fund', value: fund }, { id: 'investor', name: 'Investors', value: investor }].map(({ id, name, value }) => (
              <span key={id} className={`mm-bars-row is-${id}`}>
                <span>{name}</span>
                <span className="mm-board-track"><motion.span className="mm-board-bar" initial={{ width: 0 }} animate={{ width: `${(value / 14) * 100}%` }} transition={t(0.3 + i * 0.3, 0.8)} /></span>
                <strong>{value}%</strong>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mh-extra">
        <p className="v-kicker">Timing or mistakes?</p>
        <p>Investor B made no mistake: they simply had more money in during the fall. Re-analysing Morningstar's previous edition (2015–2024), a 2026 study put the cost of bad timing at about {GAP.timing} points a year.</p>
      </div>
    </div>
  )
}

/** Q5: the player's own answer, then the direction and moderators of the effect. */
function CashlessVisual({ pick }: { pick?: string }) {
  const t = useTiming()
  const warm = pick ? splitPick(pick).warm : undefined
  const notes = [
    { tag: 'Stronger', text: 'for things other people can see' },
    { tag: 'Weaker', text: 'for spending on others, like donations' },
    { tag: 'Shrinking', text: 'in more recent studies' },
    { tag: 'Not just credit', text: 'payment features did not explain it' },
  ]
  return (
    <div className="mm-cashless">
      {warm && <p className="v-note">You said: <strong>{warm === 'yes' ? 'yes, add the pastry' : 'no, just the coffee'}</strong>.</p>}
      <p className="v-kicker">Average effect across 71 papers</p>
      <div className="mm-scale" role="img" aria-label="On average, people spent slightly more without cash: a small effect.">
        <span>More with cash</span>
        <span className="mm-scale-track"><i className="mm-scale-mid" /><motion.i className="mm-scale-dot" initial={{ left: '50%' }} animate={{ left: '62%' }} transition={t(0.3, 0.8)} /></span>
        <span>More without cash</span>
      </div>
      <p className="v-note">Small but real. The dot shows the direction, not an exact size.</p>
      <ul className="mm-tags">{notes.map(({ tag, text }) => <li key={tag}><strong>{tag}</strong> {text}</li>)}</ul>
    </div>
  )
}

/** Q6: standardised coefficients from one model (Table 7, column 7). */
function PredictorsVisual() {
  const t = useTiming()
  const rows = [
    { id: 'planning', label: 'Planning years ahead', value: WEALTH.planning },
    { id: 'selfcontrol', label: 'Self-control (measured by exercise)', value: WEALTH.selfControl },
    { id: 'numeracy', label: 'Being good with numbers', value: WEALTH.numeracy },
  ]
  return (
    <div className="mm-predictors">
      <p className="v-kicker">Strength of link with financial wealth (standardised)</p>
      <div className="mm-bars" role="img" aria-label={rows.map(({ label, value }) => `${label}: ${value}`).join('. ')}>
        {rows.map(({ id, label, value }, i) => (
          <span key={id} className={`mm-bars-row is-${id}`}>
            <span>{label}</span>
            <span className="mm-board-track"><motion.span className="mm-board-bar" initial={{ width: 0 }} animate={{ width: `${(value / 0.25) * 100}%` }} transition={t(0.3 + i * 0.25, 0.8)} /></span>
            <strong>{value.toFixed(2)}</strong>
          </span>
        ))}
      </div>
      <p className="v-note">Longer bars mean a stronger association, not a percentage change in wealth. One working paper; {WEALTH.planners}% of the sample planned years ahead.</p>
    </div>
  )
}

export function MoneySkillsVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'lumpsum': return <LumpVisual />
    case 'funds': return <FundsVisual />
    case 'fees': return <FeesVisual />
    case 'gap': return <GapVisual />
    case 'cashless': return <CashlessVisual pick={pick} />
    case 'predictors': return <PredictorsVisual />
    default: return null
  }
}
