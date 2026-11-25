import { useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { ASPIRATIONS, DESTINATIONS, RANK, YOUTH } from '../../data/moneyHappiness'
import { parseEstimate, parseHoliday, splitPick } from '../../lib/chapterScore'
import { useTiming } from './motion'

function Dots({ total, on, label, cols }: { total: number; on: number; label: string; cols: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="mh-dots" style={{ '--cols': cols } as CSSProperties} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <motion.i key={i} className={i < on ? 'is-on' : ''} initial={reduce ? false : { opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 0.1 + i * 0.008, duration: 0.25 }} />
      ))}
    </div>
  )
}

const CURVES = [
  { id: 'happiest', label: 'Happiest people', d: 'M10 150 C 120 140, 220 100, 290 20' },
  { id: 'middle', label: 'Most people', d: 'M10 150 L 290 60' },
  { id: 'least', label: 'Least happy people', d: 'M10 150 C 80 110, 140 100, 290 100' },
] as const

/** Q1: the three shapes reported by Killingsworth, Kahneman & Mellers (illustrative, not plotted data). */
function CeilingVisual() {
  const t = useTiming()
  return (
    <div className="mh-ceiling">
      <p className="v-kicker">Everyday happiness as income rises (shape of the findings)</p>
      <svg viewBox="0 0 400 170" className="mh-curves" role="img" aria-label="Illustration: for the least happy people, happiness levels off as income rises. For most people it keeps rising, and for the happiest people it rises faster at higher incomes.">
        <line x1="10" y1="160" x2="295" y2="160" className="mh-axis" />
        {CURVES.map(({ id, label, d }, i) => (
          <g key={id} className={`is-${id}`}>
            <motion.path d={d} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.2 + i * 0.35, 1.1)} />
            <text x="298" y={id === 'happiest' ? 23 : id === 'middle' ? 63 : 103}>{label}</text>
          </g>
        ))}
        <text x="295" y="169" textAnchor="end" className="mh-axis-label">Higher income →</text>
      </svg>
      <div className="mh-extra">
        <p className="v-kicker">Another twist</p>
        <p>Among 2.05 million U.S. adults surveyed in 2008–2017, life satisfaction rose with income, but <strong>stress became more common above about $63,000</strong>.</p>
      </div>
      <p className="v-note">The curves are an illustration of the published shapes, not plotted data. U.S. data only.</p>
    </div>
  )
}

const OFFERS = [
  { id: 'more', label: '$100,000 a year, while most people around you earn considerably more' },
  { id: 'less', label: '$70,000 a year, while most people around you earn considerably less' },
] as const

/** Q2: 80 of every 100 countries, the two moderators and an unscored thought experiment. */
function RankVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  const guess = pick && question.kind === 'estimate' ? parseEstimate(question, pick) : undefined
  const [offer, setOffer] = useState<string>()
  return (
    <div className="mh-rank">
      <p className="v-kicker">Per 100 countries studied</p>
      <Dots total={100} on={RANK.share} cols={20} label={`In ${RANK.share} of every 100 countries, income rank was more strongly linked to well-being than absolute income.`} />
      <p className="mh-legend"><i className="is-on" /> Rank mattered more{guess !== undefined && <span> · You guessed <strong>{guess}%</strong></span>}</p>
      <div className="mh-pair">
        <section><strong>×{RANK.materialism}</strong><span>Rank links were over three times larger in the most materialistic countries.</span></section>
        <section><strong>−{RANK.civic}%</strong><span>They were about 80% smaller where civic engagement was highest.</span></section>
      </div>
      <div className="mh-thought">
        <p className="v-kicker">Thought experiment · not scored</p>
        <p>Which job offer would you take?</p>
        <div className="mh-offers" role="group" aria-label="Which job offer would you take?">
          {OFFERS.map(({ id, label }) => <button key={id} type="button" className={`mh-offer${offer === id ? ' is-chosen' : ''}`} aria-pressed={offer === id} onClick={() => setOffer(id)}>{label}</button>)}
        </div>
        {offer && <p className="v-note" role="status">The study compared people, it did not assign salaries, so it cannot say which offer would make you happier. Earning less is not a route to happiness.</p>}
      </div>
    </div>
  )
}

const GOALS = [
  { id: 'intrinsic', title: 'Growth, relationships, community', r: ASPIRATIONS.intrinsic, note: 'Clear positive link' },
  { id: 'extrinsic', title: 'Wealth, fame, good looks', r: ASPIRATIONS.extrinsic, note: 'Almost no link (not significant)' },
  { id: 'predominance', title: 'Wealth and status outweighing the rest', r: ASPIRATIONS.predominance, note: 'Negative link' },
] as const

/** Q5: three ambition cards on one correlation scale from −0.3 to +0.3. */
function AmbitionVisual() {
  const t = useTiming()
  return (
    <div className="mh-goals">
      {GOALS.map(({ id, title, r, note }, i) => (
        <motion.section key={id} className={`mh-goal is-${id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={t(0.15 + i * 0.25, 0.5)}>
          <p className="mh-goal-title">{title}</p>
          <div className="mh-scale" role="img" aria-label={`Correlation with well-being r = ${r}`}>
            <span className="mh-zero" aria-hidden="true" />
            <motion.i className={r < 0 ? 'is-neg' : ''} style={{ [r < 0 ? 'right' : 'left']: '50%' }} initial={{ width: 0 }} animate={{ width: `${(Math.abs(r) / 0.3) * 50}%` }} transition={t(0.4 + i * 0.25, 0.8)} />
          </div>
          <p className="mh-goal-r"><strong>r = {r > 0 ? '+' : r < 0 ? '−' : ''}{Math.abs(r).toFixed(2)}</strong> {note}</p>
        </motion.section>
      ))}
      <p className="v-note">Correlations with well-being across 105 studies. The scale runs from −0.3 to +0.3. Correlations are not percentages or causes.</p>
    </div>
  )
}

/** Q6: 136 countries, 85 with happier under-25s, and the North America and Oceania drop. */
function YouthVisual() {
  return (
    <div className="mh-youth">
      <p className="v-kicker">Under-25s, 2023–2025 vs 2006–2010</p>
      <Dots total={YOUTH.countries} on={YOUTH.higher} cols={17} label={`In ${YOUTH.higher} of ${YOUTH.countries} countries, under-25s rated their lives higher than in 2006–2010.`} />
      <p className="mh-legend"><i className="is-on" /> Higher in {YOUTH.higher} countries <i /> Not higher in {YOUTH.countries - YOUTH.higher}</p>
      <div className="mh-pair">
        <section><strong>−{YOUTH.nanzDrop}</strong><span>points on a 0–10 scale: the average drop for under-25s in the United States, Canada, Australia and New Zealand.</span></section>
        <section><strong>2 of 10</strong><span>world regions saw young people’s ratings fall: that group and Western Europe.</span></section>
      </div>
      <p className="v-note">Each dot is a country. This compares different young people in two periods. It does not show that any age is happiest.</p>
    </div>
  )
}

/** Q8: the two spending choices and when giving tends to help. */
function GivingVisual() {
  const t = useTiming()
  return (
    <div className="mh-giving">
      <div className="mh-pair">
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.1, 0.5)}><span className="v-kicker">€20 on yourself</span><span>A pleasant treat, with a smaller mood lift on average.</span></motion.section>
        <motion.section className="is-strong" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.4, 0.5)}><span className="v-kicker">€20 on someone else</span><span>Tended to lift people’s mood more in large preregistered experiments.</span></motion.section>
      </div>
      <p className="v-kicker">The boost was more likely when people</p>
      <ul className="mh-ticks"><li>chose freely to give</li><li>could see the difference it made</li></ul>
      <p className="v-note">Based on 15 preregistered experiments. Results were somewhat mixed, and they cover short-term emotions, not long-term life satisfaction.</p>
    </div>
  )
}

const FEEL = { s: 'the short list of 4', l: 'the long list of 16', n: 'neither list' } as const

/** Q9: how choosing feels vs how the result is valued, from two separate sets of experiments. */
function ChoiceSetVisual({ pick }: { pick?: string }) {
  const t = useTiming()
  const warm = pick ? parseHoliday(splitPick(pick).warm) : undefined
  return (
    <div className="mh-choice">
      <div className="mh-pair">
        <section>
          <p className="v-kicker">While choosing · 2025 experiments</p>
          <svg viewBox="0 0 200 100" className="mh-curves" role="img" aria-label="Illustration: the pleasantness of choosing peaks at about four options, then falls as options increase.">
            <line x1="5" y1="92" x2="195" y2="92" className="mh-axis" />
            <motion.path d="M5 80 C 30 30, 50 18, 60 18 C 90 18, 140 55, 195 72" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.2, 1)} />
            <text x="60" y="12" textAnchor="middle">≈4 options</text>
            <text x="195" y="100" textAnchor="end" className="mh-axis-label">More options →</text>
          </svg>
          <p>Pleasantness and sense of control peaked around four options. More options meant more effort.</p>
        </section>
        <section>
          <p className="v-kicker">After choosing · 2024 experiments</p>
          <div className="mh-value" role="img" aria-label="Illustration: people valued their chosen option more when it came from a larger set.">
            <span><motion.i initial={{ height: 0 }} animate={{ height: '45%' }} transition={t(0.5, 0.7)} /><small>Small set</small></span>
            <span className="is-strong"><motion.i initial={{ height: 0 }} animate={{ height: '80%' }} transition={t(0.7, 0.7)} /><small>Large set</small></span>
          </div>
          <p>People valued the option they picked more when it came from more options, linked to a stronger sense of ownership.</p>
        </section>
      </div>
      {warm && <p className="mh-you">You picked <strong>{DESTINATIONS[warm.short]}</strong> from 4 and <strong>{DESTINATIONS[warm.long]}</strong> from 16, and found {FEEL[warm.feel]} more enjoyable to choose from.</p>}
      <div className="mh-extra">
        <p className="v-kicker">When more choice helps or hurts</p>
        <p>Reviews of choice-overload research find it depends on context: how complex the options are, whether you already know what you like, and how much the decision matters.</p>
      </div>
      <p className="v-note">Both panels are illustrations of the direction of each finding, not plotted data. The two findings come from different studies.</p>
    </div>
  )
}

export function HappinessVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'ceiling': return <CeilingVisual />
    case 'rank': return <RankVisual question={question} pick={pick} />
    case 'ambition': return <AmbitionVisual />
    case 'youth': return <YouthVisual />
    case 'giving': return <GivingVisual />
    case 'choiceset': return <ChoiceSetVisual pick={pick} />
    default: return null
  }
}
