import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { ALCOHOL, BURSTS, FIT_FAT, SLEEP, SLEEP_WEEKS, STEPS, STEPS_7K, VITAMINS, WARRIOR } from '../../data/health'
import { useCount, useTiming } from './motion'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const ci = ([lo, hi]: readonly [number, number]) => `95% CI ${lo.toFixed(2)}–${hi.toFixed(2)}`

/** One neutral figure; fitness is shown by the ring, never by body shape. */
function Figure({ fit }: { fit: boolean }) {
  return (
    <svg viewBox="0 0 40 52" className={`v-hl-figure${fit ? ' is-fit' : ''}`} aria-hidden="true">
      <circle cx={20} cy={11} r={7} />
      <path d="M8 50 C8 30 12 22 20 22 C28 22 32 30 32 50 Z" />
    </svg>
  )
}

/** Q1: six people, the same silhouette, with each group's hazard ratio. */
function FitFatVisual() {
  const t = useTiming()
  const x = (hr: number) => `${(Math.log(hr / 0.5) / Math.log(6)) * 100}%`
  return (
    <div className="v-hl-fitfat">
      <div className="v-hl-people" role="img" aria-label={FIT_FAT.map(({ bmi, fit, hr }) => `${fit ? 'Fit' : 'Unfit'}, ${bmi.toLowerCase()}: ${hr.toFixed(2)}`).join('; ')}>
        {FIT_FAT.map(({ id, bmi, fit, hr, ci: range }, i) => (
          <motion.figure key={id} className={`v-hl-person${hr > 1.5 ? ' is-high' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(0.1 + i * 0.12, 0.5)}>
            <Figure fit={fit} />
            <figcaption><b>{fit ? 'Fit' : 'Unfit'}</b>{bmi}</figcaption>
            <strong>{hr === 1 ? '1.00' : hr.toFixed(2)}</strong>
            <span className="v-hl-ci" aria-hidden="true">
              <i className="v-hl-one" style={{ left: x(1) }} />
              {range && <motion.i className="v-hl-range" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.9 + i * 0.1, 0.5)} style={{ left: x(range[0]), width: `calc(${x(range[1])} - ${x(range[0])})` }} />}
              <motion.i className="v-hl-dot" initial={{ left: x(1) }} animate={{ left: x(hr) }} transition={t(0.9 + i * 0.1, 0.9)} />
            </span>
          </motion.figure>
        ))}
      </div>
      <p className="v-note">Risk of dying from any cause against fit people of normal weight (1.00); lines show 95% confidence intervals. The figures are deliberately identical.</p>
    </div>
  )
}

/** Q2: two weeks of eight-hour nights, one regular and one not. */
function SleepWeekVisual() {
  const t = useTiming()
  const row = (nights: readonly (readonly [number, number])[], label: string, delay: number) => (
    <figure className="v-hl-week">
      <figcaption>{label}</figcaption>
      {nights.map(([bed, hours], i) => {
        const start = ((bed < 12 ? bed + 24 : bed) - 20) / 16
        return (
          <div key={i} className="v-hl-night">
            <span>{DAYS[i]}</span>
            <span className="v-hl-track"><motion.i style={{ left: `${start * 100}%`, width: `${(hours / 16) * 100}%` }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={t(delay + i * 0.08, 0.5)} /></span>
          </div>
        )
      })}
    </figure>
  )
  return (
    <div className="v-hl-sleep">
      <div className="v-hl-weeks" role="img" aria-label="Illustration: two weeks that both average eight hours of sleep, one with the same bedtime every night and one with bedtimes from 9.30pm to 2am.">
        {row(SLEEP_WEEKS.regular, 'Same time every night', 0.1)}
        {row(SLEEP_WEEKS.irregular, 'Timing changes', 0.6)}
        <p className="v-hl-axis"><span>8pm</span><span>midnight</span><span>4am</span><span>8am</span><span>noon</span></p>
      </div>
      <p className="v-hl-headline"><span className="v-big">−{Math.round((1 - SLEEP.full.hr) * 100)}%</span> risk of dying, most vs least regular sleepers <small>HR {SLEEP.full.hr.toFixed(2)}, {ci(SLEEP.full.ci)}</small></p>
      <p className="v-note">Both weeks are illustrations. The figure is from the fully adjusted model; adjusting only for age, sex and ethnicity it was {SLEEP.minimal.hr.toFixed(2)}.</p>
    </div>
  )
}

/** A risk marker against 1.00 on a shared scale from 0.5 to 1.3. */
function Risk({ label, value, range, tone, delay }: { label: string; value: number; range: readonly [number, number]; tone: string; delay: number }) {
  const t = useTiming()
  const x = (v: number) => `${((v - 0.5) / 0.8) * 100}%`
  return (
    <div className={`v-hl-risk is-${tone}`}>
      <p>{label} <strong>{value.toFixed(2)}</strong> <small>{ci(range)}</small></p>
      <span className="v-hl-ci" aria-hidden="true">
        <i className="v-hl-one" style={{ left: x(1) }} />
        <motion.i className="v-hl-range" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(delay + 0.3, 0.5)} style={{ left: x(range[0]), width: `calc(${x(range[1])} - ${x(range[0])})` }} />
        <motion.i className="v-hl-dot" initial={{ left: x(1) }} animate={{ left: x(value) }} transition={t(delay, 0.9)} />
      </span>
    </div>
  )
}

/** Q3: the same 150 minutes, spread out or squeezed into the weekend. */
function WarriorVisual() {
  const t = useTiming()
  const week = (minutes: readonly number[], label: string, delay: number) => (
    <figure className="v-hl-cal">
      <figcaption>{label}</figcaption>
      <div>
        {minutes.map((m, i) => (
          <span key={i} className="v-hl-day"><b>{DAYS[i][0]}</b><span><motion.i initial={{ height: 0 }} animate={{ height: `${(m / 75) * 100}%` }} transition={t(delay + i * 0.06, 0.6)} /></span><small>{m ? `${m}′` : ''}</small></span>
        ))}
      </div>
    </figure>
  )
  return (
    <div className="v-hl-warrior">
      <div className="v-hl-cals" role="img" aria-label="Illustration: 30 minutes on five weekdays, or 75 minutes on Saturday and Sunday. Both are 150 minutes.">
        {week([30, 30, 30, 30, 30, 0, 0], 'Spread through the week', 0.1)}
        {week([0, 0, 0, 0, 0, 75, 75], 'Weekend warrior', 0.5)}
      </div>
      <p className="v-kicker">Risk of dying, against inactive people (1.00)</p>
      <Risk label="Weekend warriors" value={WARRIOR.weekend.rr} range={WARRIOR.weekend.ci} tone="amber" delay={1} />
      <Risk label="Regularly active" value={WARRIOR.regular.rr} range={WARRIOR.regular.ci} tone="teal" delay={1.2} />
      <p className="v-hl-aside">Compared directly, in {WARRIOR.direct.people.toLocaleString('en-GB')} people: <strong>{WARRIOR.direct.hr.toFixed(2)}</strong> ({ci(WARRIOR.direct.ci)}), no clear difference, very low certainty.</p>
      <p className="v-note">The calendars are illustrations; the risk figures come from different sets of studies.</p>
    </div>
  )
}

const MOMENTS = [{ at: 8.2, label: 'Stairs to the platform' }, { at: 13.1, label: 'Fast walk uphill' }, { at: 18.5, label: 'Carrying the shopping' }] as const

/** Q4: an ordinary day with three short bursts. */
function BurstsVisual() {
  const t = useTiming()
  const x = (h: number) => `${((h - 7) / 15) * 100}%`
  const cut = useCount(BURSTS.median[1], 0, 1200, 1500)
  return (
    <div className="v-hl-bursts">
      <div className="v-hl-day-line" role="img" aria-label="Illustration: one day from 7am to 10pm with three bursts of one to two minutes: stairs, a fast walk uphill and carrying shopping.">
        <span className="v-hl-line" aria-hidden="true" />
        {MOMENTS.map(({ at, label }, i) => (
          <motion.span key={label} className={`v-hl-burst${i === 1 ? ' is-up' : ''}`} style={{ left: x(at) }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={t(0.3 + i * 0.45, 0.5)}>
            <i /><small>{label}</small>
          </motion.span>
        ))}
        <p className="v-hl-axis"><span>7am</span><span>noon</span><span>5pm</span><span>10pm</span></p>
      </div>
      <p className="v-hl-headline"><span className="v-big">−{Math.round(cut)}%</span> risk of dying with three bursts a day <small>38–40%, against none, in people who didn’t exercise</small></p>
      <p className="v-hl-aside">Fewer than two bursts: <strong>{BURSTS.few[0]}–{BURSTS.few[1]}%</strong> lower. About {BURSTS.minutes} minutes a day in total: <strong>{BURSTS.minutesCut[0]}–{BURSTS.minutesCut[1]}%</strong> lower.</p>
      <p className="v-note">The day is an illustration. Figures are for {BURSTS.people.toLocaleString('en-GB')} UK adults over {BURSTS.years} years.</p>
    </div>
  )
}

/** Q5: walk along the real step curve, one quarter of participants at a time. */
function StepsVisual() {
  const t = useTiming()
  const [at, setAt] = useState(2)
  const x = (s: number) => 8 + ((s - 2000) / 10000) * 300
  const y = (hr: number) => 10 + ((1.05 - hr) / 0.65) * 120
  const path = STEPS.map(({ steps, hr }, i) => `${i ? 'L' : 'M'}${x(steps)} ${y(hr)}`).join(' ')
  const point = STEPS[at]
  return (
    <div className="v-hl-steps">
      <svg viewBox="0 0 316 150" className="v-hl-curve" role="img" aria-label={`Risk of dying by daily steps: ${STEPS.map(({ steps, hr }) => `${steps.toLocaleString('en-GB')} steps ${hr.toFixed(2)}`).join(', ')}.`}>
        <line x1={x(10000)} x2={x(10000)} y1={6} y2={136} className="v-hl-target" />
        <text x={x(10000) - 4} y={16} textAnchor="end" className="v-hl-label">10,000 target</text>
        <motion.path d={path} className="v-hl-path" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.2, 1.4)} />
        {STEPS.map(({ steps, hr }, i) => <circle key={steps} cx={x(steps)} cy={y(hr)} r={i === at ? 0 : 3.5} className="v-hl-node" />)}
        <motion.circle r={7} className="v-hl-walker" initial={false} animate={{ cx: x(point.steps), cy: y(point.hr) }} transition={t(0, 0.6)} />
        <text x={8} y={146} className="v-hl-label">2,000</text>
        <text x={308} y={146} textAnchor="end" className="v-hl-label">12,000 steps</text>
      </svg>
      <div className="v-hl-stops" role="group" aria-label="Choose a step count">
        {STEPS.map(({ steps }, i) => <button key={steps} type="button" aria-pressed={i === at} onClick={() => setAt(i)}>{steps.toLocaleString('en-GB')}</button>)}
      </div>
      <p className="v-hl-readout" aria-live="polite">{point.hr === 1 ? 'Reference group: the least active quarter.' : <><strong>{Math.round((1 - point.hr) * 100)}% lower</strong> risk of dying than the least active quarter ({ci(point.ci)})</>}</p>
      <p className="v-hl-aside">7,000 vs 2,000 steps a day, across 57 studies: <strong>{Math.round((1 - STEPS_7K.hr) * 100)}% lower</strong> risk ({ci(STEPS_7K.ci)}).</p>
      <p className="v-note">Each point is the median of a quarter of 47,471 adults. Lines connect the estimates.</p>
    </div>
  )
}

/** Q6: users looked healthier, yet weren’t longer-lived. */
function VitaminsVisual() {
  return (
    <div className="v-hl-vitamins">
      <p className="v-hl-headline"><span className="v-big">1.04</span> risk of dying for daily users <small>1.00 = non-users</small></p>
      <Risk label="First half of follow-up" value={VITAMINS.early.hr} range={VITAMINS.early.ci} tone="amber" delay={0.3} />
      <Risk label="Second half" value={VITAMINS.late.hr} range={VITAMINS.late.ci} tone="teal" delay={0.5} />
      <p className="v-hl-aside">Users looked healthier on paper: <strong>{VITAMINS.smokers.users.toFixed(0)}%</strong> smoked, against {VITAMINS.smokers.non.toFixed(0)}% of non-users.</p>
      <p className="v-note">{VITAMINS.people.toLocaleString('en-GB')} adults, followed for up to {VITAMINS.years} years. Hazard ratios with 95% confidence intervals.</p>
    </div>
  )
}

/** Q7: the same studies before and after correcting for who counts as a non-drinker. */
function AlcoholVisual() {
  const t = useTiming()
  const [view, setView] = useState<'raw' | 'adjusted'>('adjusted')
  const x = (i: number) => 34 + i * 64
  const y = (rr: number) => 12 + ((1.5 - rr) / 0.75) * 120
  return (
    <div className="v-hl-alcohol">
      <div className="v-hl-stops" role="group" aria-label="Choose the comparison">
        <button type="button" aria-pressed={view === 'raw'} onClick={() => setView('raw')}>Before correcting</button>
        <button type="button" aria-pressed={view === 'adjusted'} onClick={() => setView('adjusted')}>After correcting for bias</button>
      </div>
      <svg viewBox="0 0 316 172" className="v-hl-curve" role="img" aria-label={ALCOHOL.map(({ label, raw, adjusted }) => `${label}: ${raw.rr.toFixed(2)} before, ${adjusted.rr.toFixed(2)} after`).join('; ')}>
        <line x1={10} x2={306} y1={y(1)} y2={y(1)} className="v-hl-target" />
        <text x={306} y={y(1) - 5} textAnchor="end" className="v-hl-label">Lifetime non-drinkers</text>
        {ALCOHOL.map((row, i) => {
          const { rr, ci: [lo, hi] } = row[view]
          return (
            <g key={row.id}>
              <motion.line x1={x(i)} x2={x(i)} initial={false} animate={{ y1: y(hi), y2: y(lo) }} transition={t(0, 0.6)} className="v-hl-whisker" />
              <motion.circle cx={x(i)} r={6} initial={false} animate={{ cy: y(rr) }} transition={t(0, 0.6)} className={rr < 1 && hi < 1 ? 'v-hl-node is-low' : rr > 1 && lo > 1 ? 'v-hl-node is-high' : 'v-hl-node'} />
              <text x={x(i)} y={158} textAnchor="middle" className="v-hl-label">{row.label}</text>
              <text x={x(i)} y={169} textAnchor="middle" className="v-hl-label is-small">{row.grams}</text>
            </g>
          )
        })}
      </svg>
      <p className="v-hl-readout" aria-live="polite">{view === 'raw' ? <>Low drinkers looked <strong>15% less likely</strong> to die.</> : <>Low drinkers: <strong>0.93</strong>, no longer a clear benefit. Risk rises from 45 g a day.</>}</p>
      <p className="v-note">Relative risk with 95% confidence intervals across 107 studies. Correcting means separating former drinkers and accounting for study quality.</p>
    </div>
  )
}

export function HealthVisual({ question }: { question: ChapterQuestion }) {
  switch (question.visual) {
    case 'fitfat': return <FitFatVisual />
    case 'sleepweek': return <SleepWeekVisual />
    case 'warrior': return <WarriorVisual />
    case 'bursts': return <BurstsVisual />
    case 'steps': return <StepsVisual />
    case 'vitamins': return <VitaminsVisual />
    case 'alcohol': return <AlcoholVisual />
    default: return null
  }
}
