import { useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { AIRBNB, CHAIN, PERMITS, RATIO, VACANT } from '../../data/housing'
import { parseEstimate } from '../../lib/chapterScore'
import { useTiming } from './motion'

function Grid({ total, on, cols, label, tone = 'on' }: { total: number; on: number; cols: number; label: string; tone?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className="v-hs-grid" style={{ '--cols': cols } as CSSProperties} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <motion.span key={i} className={`v-hs-cell ${i < on ? `is-${tone}` : ''}`} initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 0.15 + i * 0.012, duration: 0.25 }} />
      ))}
    </div>
  )
}

const STEPS = ['New home near the centre', 'Their old flat', 'The next flat along', 'Further out, cheaper areas'] as const

/** Q1: an illustrative chain of moves, then the measured vacancies. */
function ChainVisual() {
  const t = useTiming()
  return (
    <div className="v-hs-chain">
      <p className="v-kicker">How one move frees another (illustration)</p>
      <ol className="v-hs-steps">
        {STEPS.map((step, i) => (
          <motion.li key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={t(0.2 + i * 0.35, 0.4)}>
            <span className="v-hs-house" style={{ '--shade': i } as CSSProperties} aria-hidden="true" />
            <span>{step}</span>
          </motion.li>
        ))}
      </ol>
      <p className="v-kicker">What the Helsinki data showed, per 100 new homes</p>
      <Grid total={100} on={CHAIN.bottomHalf} cols={20} label={`Of every 100 new homes, ${CHAIN.bottomHalf} vacancies opened in below-median-income neighbourhoods, ${CHAIN.bottomFifth} of them in the poorest fifth.`} />
      <ul className="v-hs-key">
        <li><i className="is-on" /> Vacancy in a below-median-income area <strong>{CHAIN.bottomHalf}</strong></li>
        <li>of which in the poorest fifth of areas <strong>{CHAIN.bottomFifth}</strong></li>
      </ul>
      <p className="v-note">Followed for {CHAIN.rounds} rounds of moves. The top row is a simplified illustration, not real households.</p>
    </div>
  )
}

/** Q2: today's renter vs tomorrow's, with 100 rental homes becoming 85. */
function RentControlVisual() {
  return (
    <div className="v-hs-split">
      <section>
        <p className="v-kicker">Today’s renter</p>
        <p className="v-hs-big">−20%</p>
        <p>less likely to move. More stability, and less likely to leave San Francisco.</p>
      </section>
      <section>
        <p className="v-kicker">Tomorrow’s renter</p>
        <p className="v-hs-big">−15%</p>
        <Grid total={100} on={85} cols={10} label="Illustration: of 100 rental homes in covered buildings, 85 remained for rent." />
        <p className="v-note">Illustration of the 15% drop: landlords sold to owner-occupiers, converted or redeveloped.</p>
      </section>
    </div>
  )
}

function Bars({ rows, max, unit = '%' }: { rows: readonly { label: string; value: number; tone?: string }[]; max: number; unit?: string }) {
  const t = useTiming()
  return (
    <ul className="v-hs-bars">
      {rows.map(({ label, value, tone }, i) => (
        <li key={label} className={tone ? `is-${tone}` : ''}>
          <span className="v-hs-bar-label">{label}</span>
          <span className="v-hs-track"><motion.i initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={t(0.2 + i * 0.15, 0.8)} /></span>
          <strong>{value}{unit}</strong>
        </li>
      ))}
    </ul>
  )
}

/** Q3: estimated increases due to Airbnb, average vs top-decile neighbourhoods. */
function AirbnbVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  const [measure, setMeasure] = useState<(typeof AIRBNB)[number]['id']>('rents')
  const guess = pick ? parseEstimate(question, pick) : undefined
  const row = AIRBNB.find(({ id }) => id === measure)!
  return (
    <div className="v-hs-airbnb">
      {guess !== undefined && <p className="v-yours">You guessed <strong>{guess}%</strong>.</p>}
      <div className="v-toggle" role="group" aria-label="Measure">
        {AIRBNB.map(({ id, label }) => <button key={id} type="button" aria-pressed={measure === id} onClick={() => setMeasure(id)}>{label}</button>)}
      </div>
      <Bars key={measure} max={20} rows={[
        { label: 'Average neighbourhood', value: row.average },
        { label: 'Top 10% for Airbnb', value: row.top, tone: 'strong' },
      ]} />
      <p className="v-note">Estimated increases due to Airbnb activity, 2012–2016. Neighbourhood bars are a comparison, not a map.</p>
    </div>
  )
}

/** Q4: the two Catalonia studies side by side. */
function TwoStudiesVisual() {
  const rows = [
    ['Rents', 'Down 4–6%', 'Down about 5%; up at the cheap end'],
    ['Rental supply', 'No fall found', 'About 10% fewer new contracts'],
    ['Supply measured as', 'Contracts signed and ended, active stock', 'New contracts above and below the cap'],
    ['Status', 'Peer-reviewed, 2023', 'Working paper, 2023'],
  ] as const
  return (
    <div className="v-hs-studies" role="table" aria-label="Two studies of Catalonia’s 2020 rent cap">
      <div role="row" className="v-hs-studies-head"><span role="columnheader" /><span role="columnheader">Study A</span><span role="columnheader">Study B</span></div>
      {rows.map(([label, a, b]) => (
        <div role="row" key={label}><span role="rowheader">{label}</span><span role="cell">{a}</span><span role="cell">{b}</span></div>
      ))}
      <p className="v-note">Same policy and the same official deposit register, different definitions of supply. The cap applied from September 2020 until it was struck down in March 2022.</p>
    </div>
  )
}

/** Q5: verified benchmark years only, 1990s = 100. */
function RatioVisual() {
  const t = useTiming()
  return (
    <div className="v-hs-ratio" role="img" aria-label="House price to income ratio, 1990s = 100: 2007 about 171, 2025 140.">
      {RATIO.map(({ year, value, note }, i) => (
        <div key={year} className="v-hs-col">
          <strong>{value}</strong>
          <motion.i initial={{ height: 0 }} animate={{ height: `${(value / 180) * 10}rem` }} transition={t(0.2 + i * 0.25, 0.8)} />
          <span>{year}</span><small>{note}</small>
        </div>
      ))}
      <p className="v-note">Price-to-income ratio, 1990s = 100. Only these benchmark years are shown; 2007 is calculated from the report.</p>
    </div>
  )
}

/** Q6: share of people vs share of empty homes. */
function VacantVisual() {
  return (
    <div className="v-hs-vacant">
      {VACANT.map(({ id, label, people, vacant }) => (
        <section key={id}>
          <p className="v-kicker">{label}</p>
          <Bars max={50} rows={[{ label: 'Share of people', value: people }, { label: 'Share of empty homes', value: vacant, tone: 'strong' }]} />
        </section>
      ))}
      <p className="v-note">2021 census. Empty means no electricity contract or almost no use all year; occasional-use homes are counted separately.</p>
    </div>
  )
}

/** Q7: 100 new households vs 57 permitted homes. */
function PermitsVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  const guess = pick ? parseEstimate(question, pick) : undefined
  return (
    <div className="v-hs-permits">
      {guess !== undefined && <p className="v-yours">You guessed <strong>{guess}</strong>.</p>}
      <p className="v-kicker">100 new households</p>
      <Grid total={100} on={100} cols={20} tone="household" label="100 new households" />
      <p className="v-kicker">{PERMITS.per100} new homes permitted</p>
      <Grid total={100} on={PERMITS.per100} cols={20} label={`${PERMITS.per100} permitted homes for every 100 new households`} />
      <p className="v-note">{PERMITS.permits.toLocaleString('en')} permits vs {PERMITS.households.toLocaleString('en')} new households, 2022–2024. Permits aren’t finished homes.</p>
    </div>
  )
}

/** Q8: a skyline gaining homes, then rents vs the estimated no-reform path. */
function AucklandVisual() {
  const t = useTiming()
  const heights = [2, 3, 2, 4, 3, 5, 2, 3, 4, 2, 3, 5]
  return (
    <div className="v-hs-auckland">
      <div className="v-hs-skyline" aria-hidden="true">
        {heights.map((h, i) => (
          <motion.i key={i} initial={{ height: `${h * 8}%` }} animate={{ height: `${h * 8 + 30}%` }} transition={t(0.2 + i * 0.06, 0.7)} />
        ))}
      </div>
      <Bars max={100} unit="" rows={[
        { label: 'Estimated rents without the reform', value: 100 },
        { label: 'Actual rents with the reform', value: 77, tone: 'strong' },
      ]} />
      <p className="v-note">Rents on new tenancies in 2024, estimated no-reform path = 100. The skyline is illustrative. Rents still rose, just more slowly.</p>
    </div>
  )
}

export function HousingVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'chain': return <ChainVisual />
    case 'rentcontrol': return <RentControlVisual />
    case 'airbnb': return <AirbnbVisual question={question} pick={pick} />
    case 'twostudies': return <TwoStudiesVisual />
    case 'ratio': return <RatioVisual />
    case 'vacant': return <VacantVisual />
    case 'permits': return <PermitsVisual question={question} pick={pick} />
    case 'auckland': return <AucklandVisual />
    default: return null
  }
}
