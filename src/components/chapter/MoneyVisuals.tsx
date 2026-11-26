import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion, RowsQuestion, Side, SlidersQuestion } from '../../data/menWomen'
import { DOMINANCE_EFFECTS, MOTHERHOOD_INDEX, POWER_COMPARISONS, RISK_AGAIN, VERBAL_SHIFT, WEEK_PREFERENCES } from '../../data/moneyPower'
import { parseRows, parseSliders, parseWeek } from '../../lib/chapterScore'
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

/** Q2: what each side got from the deal, then how partners felt about it. */
function NegotiateVisual() {
  const t = useTiming()
  return (
    <div className="v-outcomes">
      <div className="v-outcome-pair">
        <motion.section className="v-outcome" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(0.1, 0.5)}>
          <span className="v-kicker">The deal</span>
          <p className="v-outcome-title">Financial outcomes</p>
          <p className="v-outcome-scale" aria-hidden="true"><span className="v-men-text">Men</span><b>≈</b><span className="v-women-text">Women</span></p>
          <p className="v-outcome-text">No significant gender difference in the points people won, face to face or in anonymous chats.</p>
        </motion.section>
        <motion.section className="v-outcome is-strong" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(0.7, 0.5)}>
          <span className="v-kicker">The relationship</span>
          <p className="v-outcome-title">How partners felt</p>
          <p className="v-outcome-scale" aria-hidden="true"><span className="v-women-text">Women</span><b>›</b><span className="v-men-text">Men</span></p>
          <p className="v-outcome-text">Partners liked women more and more often wanted to negotiate with them again, as teammates or opponents.</p>
        </motion.section>
      </div>
      <motion.p className="v-outcome-anon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.3, 0.5)}>
        <strong>Even when gender was hidden.</strong> In anonymous online chats, people still liked negotiating with women more, though a separate group couldn’t tell the negotiators’ gender better than chance.
      </motion.p>
      <p className="v-note">Financial outcomes are deal points, measured from what was agreed. How partners felt is what they reported afterwards.</p>
    </div>
  )
}

/** Q3: the same choice to compete, in a maths contest and a verbal one. */
function CompeteVisual() {
  const t = useTiming()
  const contests = [
    { id: 'maths', kicker: 'Maths contests', title: 'Men entered more often', text: 'The largest gaps: lab maths contests among students.' },
    { id: 'verbal', kicker: 'Verbal contests', title: 'Almost no gap', text: `The gap was ${VERBAL_SHIFT} percentage points smaller.` },
  ]
  return (
    <div className="v-contests">
      <div className="v-contest-pair">
        {contests.map(({ id, kicker, title, text }, i) => (
          <motion.figure key={id} className={`v-contest is-${id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(0.15 + i * 0.6, 0.5)}>
            <span className="v-kicker">{kicker}</span>
            <span className="v-contest-gap" aria-hidden="true"><i className="v-men" /><i className="v-women" /></span>
            <figcaption><strong>{title}</strong>{text}</figcaption>
          </motion.figure>
        ))}
      </div>
      <p className="v-note">The meta-analysis reports how much smaller the gap is in verbal tasks, not a separately measured gap for each task, so the markers show direction, not size.</p>
    </div>
  )
}

/** Q4: choosing the risky pay again after good or bad news, for men and women alike. */
function RiskVisual() {
  const t = useTiming()
  const rows = [
    { label: 'After positive feedback', value: RISK_AGAIN.positive },
    { label: 'After negative feedback', value: RISK_AGAIN.negative },
  ]
  return (
    <div className="v-feedback">
      <span className="v-kicker">Chose the risky pay again</span>
      <div role="img" aria-label={rows.map(({ label, value }) => `${label}: ${value}%`).join('. ')}>
        {rows.map(({ label, value }, i) => (
          <div key={label} className="v-feedback-row">
            <span>{label}</span>
            <span className="v-pair-track"><motion.i initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={t(0.2 + i * 0.5, 0.8)} /></span>
            <strong>{value}%</strong>
          </div>
        ))}
      </div>
      <motion.p className="v-feedback-gender" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.3, 0.5)}>
        <span className="v-men-text">Men</span> <b aria-hidden="true">=</b> <span className="v-women-text">Women</span>: no statistically significant difference in how they responded.
      </motion.p>
      <div className="v-insight">
        <span className="v-kicker">Additional insight</span>
        <p>In separate surveys, men reported more positive outcomes from risks they had taken at work, and were readier to take them again. These outcomes were self-reported, not independently verified.</p>
      </div>
      <p className="v-note">Of the {RISK_AGAIN.analysed} participants who first chose the risky pay.</p>
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

function MiniWeek({ label, days, detail, tone }: { label: string; days: number; detail?: string; tone?: string }) {
  const t = useTiming()
  return (
    <figure className={`v-week ${tone ?? ''}`}>
      <figcaption>{label}<strong>{detail ?? `${days} ${days === 1 ? 'day' : 'days'}`}</strong></figcaption>
      <div className="v-week-cells" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => {
          const fill = Math.min(1, Math.max(0, days * 2 - i))
          return <i key={i}>{fill > 0 && <motion.b initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }} transition={t(0.2 + i * 0.05, 0.3)} />}</i>
        })}
      </div>
    </figure>
  )
}

const asDays = (hours: number) => Math.round(hours / 8 * 10) / 10
const leaning = (self: number, partner: number) => self > partner ? 'more days for yourself than for your partner' : self < partner ? 'more days for your partner than for yourself' : 'the same number of days for both of you'

/** Q6 (not scored): the player's ideal week next to what research participants wanted. */
function WeekVisual({ pick }: { pick?: string }) {
  const t = useTiming()
  const days = parseWeek(pick)
  const [menSelf, menPartner, womenSelf, womenPartner] = WEEK_PREFERENCES.map(({ hours }) => asDays(hours))
  return (
    <div className="v-weeks">
      {days && <>
        <p className="v-kicker">You, a Data Detective player</p>
        <div className="v-week-pair">
          <MiniWeek label="You" days={days[0]} />
          <MiniWeek label="Your partner" days={days[1]} />
        </div>
        <p className="v-yours">You chose {leaning(days[0], days[1])}.</p>
      </>}
      <p className="v-kicker">Research participants, on average</p>
      <div className="v-week-grid" role="img" aria-label={WEEK_PREFERENCES.map(({ label, hours }) => `${label}: ${hours} hours a week, about ${asDays(hours)} days`).join('. ')}>
        {WEEK_PREFERENCES.map(({ who, label, hours }) => (
          <MiniWeek key={label} label={label} days={hours / 8} detail={`${asDays(hours)} days`} tone={`v-${who}`} />
        ))}
      </div>
      <motion.div className="v-week-finding" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={t(1, 0.5)}>
        <div className="v-week-sides">
          <span className="v-men-text">Men: about {menSelf} days for themselves, {menPartner} for their partner</span>
          <span className="v-women-text">Women: about {womenSelf} days for themselves, {womenPartner} for their partner</span>
        </div>
      </motion.div>
      <p className="v-note">Participants: 678 employed adults in Sweden, the UK and the Netherlands, in a 2015/16 survey experiment. They gave hours a week, shown here as 8-hour days. Your answer isn’t part of the study.</p>
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

/** Q9: the two comparisons, then one square per gender difference. */
function PowerVisual() {
  const reduce = useReducedMotion()
  const { total, same, opposite } = POWER_COMPARISONS
  const kind = (i: number) => i < same ? 'same' : i < same + opposite ? 'opposite' : 'none'
  return (
    <div className="v-power">
      <div className="v-power-sources">
        <p><span className="v-kicker">Comparison 1</span>Men vs women: {total} psychological differences from meta-analyses</p>
        <p><span className="v-kicker">Comparison 2</span>More vs less power: people randomly given power in experiments</p>
      </div>
      <div className="v-power-grid" style={{ '--cols': 17 } as CSSProperties} role="img" aria-label={`Of ${total} gender differences, ${same} matched the effect of power, ${opposite} pointed the opposite way and ${POWER_COMPARISONS.none} showed no meaningful gender difference.`}>
        {Array.from({ length: total }, (_, i) => (
          <motion.span key={i} className={`v-cell is-${kind(i)}`} initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { delay: 0.2 + i * 0.018, duration: 0.25 }} />
        ))}
      </div>
      <ul className="v-power-key">
        <li><i className="is-same" /> Matched <strong>{same}</strong></li>
        <li><i className="is-opposite" /> Opposite <strong>{opposite}</strong></li>
        <li><i className="is-none" /> No meaningful gender difference <strong>{POWER_COMPARISONS.none}</strong></li>
      </ul>
      <p className="v-note">Each square is one documented gender difference. Matching direction is not proof that power causes the difference.</p>
    </div>
  )
}

export function MoneyVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'leader': return question.kind === 'rows' ? <LeaderVisual question={question} pick={pick} /> : null
    case 'negotiate': return <NegotiateVisual />
    case 'compete': return <CompeteVisual />
    case 'risk': return <RiskVisual />
    case 'backlash': return <BacklashVisual />
    case 'week': return <WeekVisual pick={pick} />
    case 'budget': return question.kind === 'sliders' ? <BudgetVisual question={question} pick={pick} /> : null
    case 'timeline': return <TimelineVisual />
    case 'power': return <PowerVisual />
    default: return null
  }
}
