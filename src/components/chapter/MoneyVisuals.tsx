import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion, ChoiceQuestion, RowsQuestion, Side, SlidersQuestion } from '../../data/menWomen'
import { COMPETITION_SHIFTS, DOMINANCE_EFFECTS, MOTHERHOOD_INDEX, POWER_COMPARISONS } from '../../data/moneyPower'
import { parseEstimate, parseRows, parseSliders, parseWeek, splitPick } from '../../lib/chapterScore'
import { useCount, useTiming } from './motion'

const SAID: Record<Side, string> = { men: 'Men rated higher', similar: 'No significant difference', women: 'Women rated higher' }

function Picks({ question, pick }: { question: RowsQuestion; pick?: string }) {
  const picks = pick ? parseRows(question, pick) : undefined
  if (!picks) return null
  return (
    <ul className="v-picks">
      {question.rows.map(({ id, label, answer }, i) => (
        <li key={id} className={picks[i] === answer ? 'v-hit' : 'v-miss'}>
          <span aria-hidden="true">{picks[i] === answer ? '✓' : '✗'}</span><span className="v-sr">{picks[i] === answer ? 'Correct: ' : 'Not correct: '}</span> {label}
        </li>
      ))}
    </ul>
  )
}

function Dial({ answer, title, delay }: { answer: Side; title: string; delay: number }) {
  const angle = useCount(answer === 'men' ? -38 : answer === 'women' ? 38 : 0, 0, 1000, delay * 1000)
  const rad = (angle * Math.PI) / 180
  return (
    <figure className="v-dial">
      <svg viewBox="0 0 140 92" aria-hidden="true">
        <path d="M14 76 A56 56 0 0 1 126 76" className="v-track" />
        <line x1={70} y1={14} x2={70} y2={24} className="v-dial-mid" />
        <line x1={70} y1={76} x2={70 + 46 * Math.sin(rad)} y2={76 - 46 * Math.cos(rad)} className={`v-needle v-${answer}`} />
        <circle cx={70} cy={76} r={5} className="v-hub" />
        <text x={14} y={90} textAnchor="middle" className="v-tick v-men-fill">Men</text>
        <text x={126} y={90} textAnchor="middle" className="v-tick v-women-fill">Women</text>
      </svg>
      <figcaption><span className="v-kicker">{title}</span><span className={`v-dial-verdict v-${answer}-text`}>{SAID[answer]}</span></figcaption>
    </figure>
  )
}

/** Q1: a needle per kind of rating, tilting towards whoever was rated higher. Direction only. */
function LeaderVisual({ question, pick }: { question: RowsQuestion; pick?: string }) {
  const titles = ['How leaders see themselves', 'How others see them', 'Everything combined']
  return (
    <div className="v-leader">
      <div className="v-leader-dials" role="img" aria-label={question.rows.map(({ label, answer }) => `${label}: ${SAID[answer].toLowerCase()}`).join('. ')}>
        {question.rows.map(({ id, answer }, i) => <Dial key={id} answer={answer} title={titles[i]} delay={0.3 + i * 0.4} />)}
      </div>
      <Picks question={question} pick={pick} />
      <p className="v-note">The needle shows which way the difference went, not its size.</p>
    </div>
  )
}

function PairBars({ title, values, max = 100, delay, strong }: { title: string; values: { men: number; women: number }; max?: number; delay: number; strong?: boolean }) {
  const t = useTiming()
  return (
    <motion.div className={`v-pair${strong ? ' is-strong' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(delay, 0.4)}>
      <p className="v-pair-title">{title}</p>
      {(['men', 'women'] as const).map((side) => (
        <div key={side} className={`v-pair-row v-${side}`}>
          <span className="v-pair-who">{side === 'men' ? 'Men' : 'Women'}</span>
          <span className="v-pair-track"><motion.i initial={{ width: 0 }} animate={{ width: `${(values[side] / max) * 100}%` }} transition={t(delay + 0.15, 0.8)} /></span>
          <span className="v-pair-value">{values[side]}%</span>
        </div>
      ))}
    </motion.div>
  )
}

/** Q2: the player's guess, the public's guess, then what graduates reported. */
function NegotiateVisual({ question, pick }: { question: SlidersQuestion; pick?: string }) {
  const guess = pick ? parseSliders(question, pick) : undefined
  return (
    <div className="v-negotiate" role="img" aria-label={`Share who negotiated their job offer. Public guess: men ${question.expected?.men}%, women ${question.expected?.women}%. Reported: men ${question.actual.men}%, women ${question.actual.women}%.`}>
      {guess && <PairBars title="Your guess" values={guess} delay={0.1} />}
      {question.expected && <PairBars title="What the public guessed" values={question.expected} delay={0.8} />}
      <PairBars title="What MBA graduates reported" values={question.actual} delay={1.5} strong />
      <p className="v-note">% of graduating MBA students who said they negotiated their job offer.</p>
    </div>
  )
}

/** Q3: change one thing about the contest and see how much the gap shrinks. */
function CompeteVisual({ question, pick }: { question: ChoiceQuestion; pick?: string }) {
  const [shift, setShift] = useState<string>(COMPETITION_SHIFTS[0].id)
  const reduce = useReducedMotion()
  const warm = pick && question.warmup?.kind === 'choice' ? question.warmup.options.find(({ id }) => id === splitPick(pick).warm) : undefined
  const average = useCount(13, 0, 1000, 200)
  const active = COMPETITION_SHIFTS.find(({ id }) => id === shift)!
  const widest = Math.max(...COMPETITION_SHIFTS.map(({ amount }) => amount))
  return (
    <div className="v-compete">
      {warm && <p className="v-yours">You chose <strong>{warm.id === 'tournament' ? 'to compete' : 'the safe pay'}</strong>.</p>}
      <div className="v-headline"><span className="v-big">{Math.round(average)}</span><span>points: how much more often men chose to compete, on average across 409 estimates</span></div>
      <p className="v-kicker">Change the contest</p>
      <div className="v-shift-buttons" role="group" aria-label="Change the contest">
        {COMPETITION_SHIFTS.map(({ id, label }) => (
          <button key={id} type="button" className={id === shift ? 'is-on' : ''} aria-pressed={id === shift} onClick={() => setShift(id)}>{label}</button>
        ))}
      </div>
      <div className="v-shift" aria-live="polite">
        <span className="v-shift-track" aria-hidden="true">
          <motion.i animate={{ width: `${(active.amount / widest) * 100}%` }} transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
        </span>
        <AnimatePresence mode="wait">
          <motion.p key={active.id} className="v-shift-text" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }}>
            The gap is <strong>{active.smaller} points smaller</strong>
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="v-note">Compared with an otherwise similar lab maths contest among students, where gaps were largest. In verbal tasks the remaining gap was almost negligible.</p>
    </div>
  )
}

/** Q4: an illustrated branching scenario. */
function RiskVisual({ question, pick }: { question: RowsQuestion; pick?: string }) {
  const t = useTiming()
  const steps = [
    { title: 'The risk', a: 'Volunteers to lead a high-stakes pitch', b: 'Volunteers to lead a high-stakes pitch', same: true },
    { title: 'What happens', a: 'Praised, and handed the next big project', b: 'Told she overreached' },
    { title: 'Next time', a: 'Volunteers again', b: 'Thinks twice' },
    { title: 'If she had been praised too', a: 'Volunteers again', b: 'Volunteers again', same: true },
  ]
  return (
    <div className="v-risk">
      <p className="v-kicker">Illustration: two fictional employees</p>
      <div className="v-risk-people" aria-hidden="true"><span className="v-men-text">Daniel</span><span className="v-women-text">Sofia</span></div>
      <ol className="v-risk-steps">
        {steps.map(({ title, a, b, same }, i) => (
          <motion.li key={title} className={same ? 'is-same' : 'is-split'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={t(0.2 + i * 0.45, 0.5)}>
            <p className="v-risk-title">{title}</p>
            <div className="v-risk-lanes">
              <p className="v-men"><span className="v-sr">Daniel: </span>{a}</p>
              <p className="v-women"><span className="v-sr">Sofia: </span>{b}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <Picks question={question} pick={pick} />
      <p className="v-note">The names and events are invented to illustrate the findings, which come from people’s accounts and scenarios.</p>
    </div>
  )
}

/** Q5: the same sentence, then how evaluations of the woman diverge. */
function BacklashVisual() {
  const t = useTiming()
  const max = 0.8
  return (
    <div className="v-backlash" role="img" aria-label={DOMINANCE_EFFECTS.map(({ label, d }) => `${label}: d = ${d}`).join('. ')}>
      <div className="v-quotes" aria-hidden="true">
        {(['men', 'women'] as const).map((side) => (
          <figure key={side} className={`v-quote v-${side}`}>
            <figcaption>{side === 'men' ? 'Manager A · man' : 'Manager B · woman'}</figcaption>
            <p>“I expect this to be completed by Friday.”</p>
          </figure>
        ))}
      </div>
      <div className="v-axis-labels" aria-hidden="true"><span>← Worse for the woman</span><span>Better →</span></div>
      {DOMINANCE_EFFECTS.map(({ id, label, d }, i) => (
        <div key={id} className="v-div-row">
          <p className="v-div-label">{label}</p>
          <div className="v-div-track" aria-hidden="true">
            <motion.span className={`v-div-bar ${d < 0 ? 'v-loss' : 'v-even'}`} style={{ [d < 0 ? 'right' : 'left']: '50%' }}
              initial={{ width: 0 }} animate={{ width: `${Math.max((Math.abs(d) / max) * 50, 0.6)}%` }} transition={t(0.4 + i * 0.3, 0.9)} />
            <span className="v-div-value" style={{ [d < 0 ? 'right' : 'left']: `calc(50% + ${(Math.abs(d) / max) * 50}% + .4rem)` }}>{d > 0 ? '+' : d < 0 ? '−' : ''}{Math.abs(d).toFixed(2)}</span>
          </div>
        </div>
      ))}
      <p className="v-note">Standardized differences (Cohen’s d), not percentages. Around 0.2 is small; 0.5 is medium. The managers are an illustration.</p>
    </div>
  )
}

function MiniWeek({ label, days, tone }: { label: string; days: number; tone?: string }) {
  return (
    <figure className={`v-week ${tone ?? ''}`}>
      <figcaption>{label}<strong>{days} {days === 1 ? 'day' : 'days'}</strong></figcaption>
      <div className="v-week-cells" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < days * 2 ? 'on' : ''} />)}
      </div>
    </figure>
  )
}

/** Q6: the player's own week, then the pattern the study found. */
function WeekVisual({ pick }: { pick?: string }) {
  const t = useTiming()
  const days = pick ? parseWeek(splitPick(pick).warm) : undefined
  const rows = [
    { title: 'Hours for themselves', men: 'Men', women: 'Women', verdict: 'About the same', same: true },
    { title: 'Hours for their partner', men: 'Men wanted her to work less', women: 'Women wanted him to work more', verdict: 'Both put the father ahead' },
  ]
  return (
    <div className="v-weeks">
      {days && <div className="v-week-pair">
        <MiniWeek label="You" days={days[0]} />
        <MiniWeek label="Your partner" days={days[1]} />
      </div>}
      <p className="v-kicker">What the study found</p>
      {rows.map(({ title, men, women, verdict, same }, i) => (
        <motion.div key={title} className={`v-week-finding${same ? ' is-same' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(0.3 + i * 0.5, 0.5)}>
          <p className="v-pair-title">{title}</p>
          <div className="v-week-sides"><span className="v-men-text">{men}</span><span className="v-women-text">{women}</span></div>
          <p className="v-verdict">{verdict}</p>
        </motion.div>
      ))}
      <p className="v-note">Stated preferences in a survey experiment, not actual working hours.</p>
    </div>
  )
}

/** Q7: weekly hours by activity, then the leisure gap in days a year. */
function BudgetVisual({ question, pick }: { question: SlidersQuestion; pick?: string }) {
  const t = useTiming()
  const guess = pick ? parseSliders(question, pick) : undefined
  const rows = question.sources ?? []
  const max = Math.max(45, guess?.men ?? 0, guess?.women ?? 0)
  const gap = question.actual.men - question.actual.women
  const days = Math.round((gap * 52) / 24)
  const shown = useCount(days, 0, 1000, 1800)
  return (
    <div className="v-budget">
      <div role="img" aria-label={rows.map(({ label, men, women }) => `${label}: husbands ${men} hours, wives ${women} hours`).join('. ') + (guess ? `. Your leisure guesses: husband ${guess.men}, wife ${guess.women}.` : '')}>
      <div className="v-axis-labels" aria-hidden="true"><span><i className="v-key v-men" /> Husband</span><span><i className="v-key v-women" /> Wife</span>{guess && <span><i className="v-key v-guess" /> Your guesses</span>}</div>
      {rows.map(({ label, men, women }, i) => {
        const leisure = label === 'Leisure'
        return (
          <div key={label} className={`v-budget-row${leisure ? ' is-lead' : ''}`}>
            <p className="v-div-label">{label}</p>
            {([['men', men], ['women', women]] as const).map(([side, hours]) => (
              <div key={side} className={`v-budget-bar v-${side}`}>
                <span className="v-pair-track">
                  <motion.i initial={{ width: 0 }} animate={{ width: `${(hours / max) * 100}%` }} transition={t(0.2 + i * 0.2, 0.8)} />
                  {leisure && guess && <span className="v-budget-guess" style={{ left: `${(guess[side] / max) * 100}%` }} />}
                </span>
                <span className="v-pair-value">{hours.toFixed(1)} h</span>
              </div>
            ))}
          </div>
        )
      })}
      </div>
      <div className="v-days">
        <p className="v-headline"><span className="v-big">{Math.round(shown)}</span><span>full days more leisure a year for husbands, if the 8.8-hour weekly gap holds</span></p>
        <div className="v-days-cells" aria-hidden="true">
          {Array.from({ length: days }, (_, i) => <motion.i key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={t(1.8 + i * 0.05, 0.3)} />)}
        </div>
      </div>
      <dl className="discovery-facts v-sole">
        <div><dt>Where the wife is the only earner</dt><dd>Husbands have the most leisure of any marriage type, 47.2 hours a week, and do more caregiving than their wives (6.1 vs 4.1 hours).</dd></div>
      </dl>
      <p className="v-note">Hours a week. Paid work is usual hours; the rest comes from time diaries, so the rows don’t add up to a full week.</p>
    </div>
  )
}

/** Q8: employment before and after the first child. Only the published points are drawn. */
function TimelineVisual() {
  const t = useTiming()
  const x = (year: number) => year < 0 ? 40 : year === 1 ? 130 : 320
  const y = (index: number) => 30 + (100 - index) * 4.4
  const [before, after, later] = MOTHERHOOD_INDEX
  return (
    <div className="v-timeline">
      <svg viewBox="0 0 360 190" role="img" aria-label="Mothers' probability of working, relative to the year before the first child: 100, then 75 one year after, then 79 fifteen years after. Fathers: no significant change.">
        <line x1={x(before.year)} x2={x(later.year)} y1={y(100)} y2={y(100)} className="v-father" />
        <text x={x(later.year)} y={y(100) - 8} textAnchor="end" className="v-tick">Fathers: no significant change</text>
        <motion.line x1={x(before.year)} y1={y(100)} initial={{ x2: x(before.year), y2: y(100) }} animate={{ x2: x(after.year), y2: y(after.mothers) }} className="v-mother" transition={t(0.4, 0.8)} />
        <motion.text x={(x(after.year) + x(later.year)) / 2} y={y(77) + 4} textAnchor="middle" className="v-tick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.4, 0.4)}>· · · 14 years · · ·</motion.text>
        {MOTHERHOOD_INDEX.map(({ label, year, mothers }, i) => (
          <g key={label}>
            <motion.circle cx={x(year)} r={7} className="v-dot v-mother-dot" initial={{ cy: y(100), opacity: 0 }} animate={{ cy: y(mothers), opacity: 1 }} transition={t(0.4 + i * 0.5, 0.8)} />
            <motion.text x={x(year)} y={y(mothers) + 24} textAnchor="middle" className="v-value v-strong" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.9 + i * 0.5, 0.4)}>{mothers}</motion.text>
            <text x={x(year)} y={184} textAnchor="middle" className="v-tick">{label}</text>
          </g>
        ))}
      </svg>
      <dl className="discovery-facts">
        <div><dt>Mothers working part-time, if employed</dt><dd>About 60% more likely</dd></div>
        <div><dt>Mothers becoming self-employed</dt><dd>About 60% more likely</dd></div>
      </dl>
      <p className="v-note">Mothers’ probability of working, with the year before the first child = 100. Only the published years are shown.</p>
    </div>
  )
}

/** Q9: 102 comparisons, coloured by whether gender and power point the same way. */
function PowerVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  const reduce = useReducedMotion()
  const guess = pick ? parseEstimate(question, pick) : undefined
  const { total, same, opposite } = POWER_COMPARISONS
  const kind = (i: number) => i < same ? 'same' : i < same + opposite ? 'opposite' : 'none'
  return (
    <div className="v-power">
      {guess !== undefined && <p className="v-yours">You guessed <strong>{guess}%</strong>.</p>}
      <div className="v-power-grid" style={{ '--cols': 17 } as CSSProperties} role="img" aria-label={`Of ${total} comparisons, ${same} pointed the same way, ${opposite} the opposite way and ${POWER_COMPARISONS.none} showed no meaningful gender difference.`}>
        {Array.from({ length: total }, (_, i) => (
          <motion.span key={i} className={`v-cell is-${kind(i)}`} initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { delay: 0.2 + i * 0.018, duration: 0.25 }} />
        ))}
      </div>
      <ul className="v-power-key">
        <li><i className="is-same" /> Same direction <strong>{same}</strong></li>
        <li><i className="is-opposite" /> Opposite <strong>{opposite}</strong></li>
        <li><i className="is-none" /> No meaningful gender difference <strong>{POWER_COMPARISONS.none}</strong></li>
      </ul>
      <p className="v-note">Each square is one documented gender difference. For communion, how much people focus on others, 80% matched the power effect. Agreement in direction is not proof that power causes the difference.</p>
    </div>
  )
}

export function MoneyVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'leader': return question.kind === 'rows' ? <LeaderVisual question={question} pick={pick} /> : null
    case 'negotiate': return question.kind === 'sliders' ? <NegotiateVisual question={question} pick={pick} /> : null
    case 'compete': return question.kind === 'choice' ? <CompeteVisual question={question} pick={pick} /> : null
    case 'risk': return question.kind === 'rows' ? <RiskVisual question={question} pick={pick} /> : null
    case 'backlash': return <BacklashVisual />
    case 'week': return <WeekVisual pick={pick} />
    case 'budget': return question.kind === 'sliders' ? <BudgetVisual question={question} pick={pick} /> : null
    case 'timeline': return <TimelineVisual />
    case 'power': return <PowerVisual question={question} pick={pick} />
    default: return null
  }
}
