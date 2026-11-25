import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion, RowsQuestion, Side, SlidersQuestion } from '../../data/menWomen'
import { overlap, parseRows, parseSliders } from '../../lib/chapterScore'
import { MoneyVisual } from './MoneyVisuals'
import { NatureVisual } from './NatureVisuals'
import { HousingVisual } from './HousingVisuals'
import { CitiesVisual } from './CitiesVisuals'
import { HappinessVisual } from './HappinessVisuals'
import { MindVisual } from './MindVisuals'
import { HealthVisual } from './HealthVisuals'
import { WorldVisual } from './WorldVisuals'
import { useCount, useTiming } from './motion'

function AgeVisual() {
  const t = useTiming()
  const x = (age: number) => 24 + (age - 40) * (312 / 18)
  const rows = [
    { label: 'Men', own: 48.5, max: 48.0, y: 46, tone: 'men' },
    { label: 'Women', own: 45.0, max: 53.7, y: 122, tone: 'women' },
  ]
  return (
    <div className="v-age" role="img" aria-label="Stated preferences: men's average own age 48.5 and oldest acceptable partner 48.0; women's 45.0 and 53.7. On real dates, both were slightly more attracted to younger partners, equally.">
      <p className="v-kicker">What they said they’d accept</p>
      <svg viewBox="0 0 360 184" aria-hidden="true">
        {[40, 45, 50, 55].map((age) => <g key={age}>
          <line x1={x(age)} x2={x(age)} y1={14} y2={150} className="v-grid" />
          <text x={x(age)} y={166} className="v-tick" textAnchor="middle">{age}</text>
        </g>)}
        {rows.map(({ label, own, max, y, tone }, i) => <g key={label} className={`v-${tone}`}>
          <text x={24} y={y - 20} className="v-label">{label}</text>
          <motion.line x1={x(own)} x2={x(own)} y1={y} y2={y} className="v-link" animate={{ x2: x(max) }} transition={t(0.3 + i * 0.25, 1.1)} />
          <motion.circle cy={y} r={10} className="v-ring" initial={{ cx: x(own), opacity: 0 }} animate={{ cx: x(max), opacity: 1 }} transition={t(0.3 + i * 0.25, 1.1)} />
          <circle cx={x(own)} cy={y} r={6} className="v-dot" />
          <text x={x(own)} y={y + 26} className="v-value" textAnchor="middle">{own.toFixed(1)}</text>
          <motion.text x={x(max) + (own > max ? -14 : 14)} y={y + 4} className="v-value v-strong" textAnchor={own > max ? 'end' : 'start'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.2 + i * 0.25, 0.4)}>{max.toFixed(1)}</motion.text>
        </g>)}
        <g className="v-legend">
          <circle cx={30} cy={180} r={4.5} className="v-dot" /><text x={40} y={184}>own age</text>
          <circle cx={110} cy={180} r={6} className="v-ring" /><text x={122} y={184}>oldest partner they’d accept</text>
        </g>
      </svg>
      <div className="v-age-stated">
        <p><span className="v-big v-men-text">−0.5</span>years for men</p>
        <p><span className="v-big v-women-text">+8.7</span>years for women</p>
      </div>
      <p className="v-kicker">What happened on the date</p>
      {rows.map(({ label, tone }, i) => (
        <div key={label} className={`v-age-pull v-${tone}`}>
          <span className="v-age-who">{label}</span>
          <span className="v-age-track"><motion.i initial={{ width: 0 }} animate={{ width: '34%' }} transition={t(1.6 + i * 0.1, 0.8)} /></span>
        </div>
      ))}
      <p className="v-note">← Slightly more attracted to younger partners, by the same amount for both. Direction only; the effect was small.</p>
    </div>
  )
}

function Gauge({ label, r, delay }: { label: string; r: number; delay: number }) {
  const t = useTiming()
  const value = useCount(r, 0, 1200, delay * 1000)
  return (
    <figure className="v-gauge">
      <svg viewBox="0 0 160 96" aria-hidden="true">
        <path d="M14 86 A66 66 0 0 1 146 86" className="v-track" />
        <motion.path d="M14 86 A66 66 0 0 1 146 86" className="v-arc" pathLength={1} initial={{ pathLength: 0 }} animate={{ pathLength: r }} transition={t(delay, 1.2)} />
        <line x1={80} y1={86} x2={80 - 56 * Math.cos(Math.PI * value)} y2={86 - 56 * Math.sin(Math.PI * value)} className="v-needle" />
        <circle cx={80} cy={86} r={4} className="v-hub" />
      </svg>
      <figcaption><span className="v-big">≈ .{Math.round(value * 100).toString().padStart(2, '0')}</span>{label}</figcaption>
    </figure>
  )
}

function GaugesVisual() {
  return (
    <div className="v-gauges" role="img" aria-label="Correlation with romantic evaluations: physical attractiveness about 0.40, earning prospects about 0.10, similar for men and women.">
      <Gauge label="Physical attractiveness" r={0.4} delay={0.2} />
      <Gauge label="Earning prospects" r={0.1} delay={0.5} />
      <p className="v-note">Correlation (r) with romantic evaluations, for men and women alike. Not a percentage or a cause.</p>
    </div>
  )
}

function Scene({ movers, verdict, index }: { movers: 'men' | 'women'; verdict: string; index: number }) {
  const reduce = useReducedMotion()
  const sitters = movers === 'men' ? 'women' : 'men'
  const tables = [0, 1, 2, 3, 4]
  const gap = 64
  return (
    <figure className="v-scene">
      <figcaption><span className="v-kicker">Event {index + 1}</span><span className={`v-${movers}-text`}>{movers === 'men' ? 'Men' : 'Women'}</span> move, <span className={`v-${sitters}-text`}>{sitters}</span> sit</figcaption>
      <svg viewBox="0 0 340 92" aria-hidden="true">
        {tables.map((i) => <g key={i}>
          <rect x={22 + i * gap} y={38} width={40} height={14} rx={3} className="v-table" />
          <circle cx={42 + i * gap} cy={22} r={8} className={`v-dot v-${sitters}`} />
        </g>)}
        <motion.g animate={reduce ? undefined : { x: [0, 0, gap] }}
          transition={reduce ? undefined : { duration: 2.4, times: [0, 0.55, 1], repeat: Infinity, ease: 'easeInOut', delay: index * 0.6 }}>
          {[-1, ...tables].map((i) => <circle key={i} cx={42 + i * gap} cy={70} r={8} className={`v-dot v-${movers}`} opacity={i < 0 ? 0 : 1} />)}
        </motion.g>
      </svg>
      <p className="v-verdict">{verdict}</p>
    </figure>
  )
}

function RotationVisual() {
  return (
    <div className="v-rotation" role="img" aria-label="When men rotated, women were more selective. When women rotated, the gender gap in selectivity was no longer significant.">
      <Scene movers="men" verdict="Women more selective" index={0} />
      <Scene movers="women" verdict="Gap no longer significant" index={1} />
      <p className="v-note">Rotators said yes to more people, and felt more confident.</p>
    </div>
  )
}

const pdf = (x: number, mean: number) => Math.exp(-((x - mean) ** 2) / 2) / Math.sqrt(2 * Math.PI)

function CurvesVisual() {
  const d = useCount(0.54, 0.69, 1400, 700)
  const xs = Array.from({ length: 121 }, (_, i) => -3.6 + (i * 7.2) / 120)
  const sx = (x: number) => 180 + x * 46
  const sy = (y: number) => 150 - y * 300
  const path = (mean: number) => xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(pdf(x, mean)).toFixed(1)}`).join('')
  const shared = `M${sx(xs[0])},${sy(0)}` + xs.map((x) => `L${sx(x).toFixed(1)},${sy(Math.min(pdf(x, -d / 2), pdf(x, d / 2))).toFixed(1)}`).join('') + `L${sx(xs[xs.length - 1])},${sy(0)}Z`
  const share = Math.round(overlap(d) * 100)
  return (
    <div className="v-curves">
      <div className="v-headline"><span className="v-big">{share}%</span><span>overlap after adjustment</span></div>
      <svg viewBox="0 0 360 172" role="img" aria-label={`Illustrative distributions of sexual desire. Adjusting for reporting bias reduces the difference from 0.69 to 0.54 standard deviations, leaving about 79% overlap.`}>
        <path d={shared} className="v-overlap" />
        <path d={path(-d / 2)} className="v-curve v-women" />
        <path d={path(d / 2)} className="v-curve v-men" />
        <line x1={sx(-d / 2)} x2={sx(-d / 2)} y1={sy(pdf(0, 0))} y2={150} className="v-mean v-women" />
        <line x1={sx(d / 2)} x2={sx(d / 2)} y1={sy(pdf(0, 0))} y2={150} className="v-mean v-men" />
        <line x1={20} x2={340} y1={150} y2={150} className="v-base" />
        <text x={sx(-d / 2) - 6} y={sy(pdf(0, 0)) - 6} textAnchor="end" className="v-label v-women-text">Women</text>
        <text x={sx(d / 2) + 6} y={sy(pdf(0, 0)) - 6} className="v-label v-men-text">Men</text>
        <text x={180} y={166} textAnchor="middle" className="v-tick">gap {d.toFixed(2)} SD · reported 0.69 → adjusted 0.54</text>
      </svg>
      <p className="v-note">Illustrative curves assuming normal distributions with equal spread, not observed population data.</p>
    </div>
  )
}

const sideLabel: Record<Side, string> = { men: 'Men', similar: 'Similar', women: 'Women' }

function DivergingVisual({ question, pick }: { question: RowsQuestion; pick?: string }) {
  const t = useTiming()
  const picks = pick ? parseRows(question, pick) : undefined
  const max = 0.42
  return (
    <div className="v-diverging" role="img" aria-label={question.rows.map(({ label, answer, d }, i) => `${label}: ${answer} higher, d = ${(d ?? 0).toFixed(2)}${picks ? `; you said ${sideLabel[picks[i]].toLowerCase()}, ${picks[i] === answer ? 'correct' : 'not correct'}` : ''}`).join('. ')}>
      <div className="v-axis-labels" aria-hidden="true"><span className="v-men-text">← Men higher</span><span className="v-women-text">Women higher →</span></div>
      {question.rows.map(({ id, label, answer, d }, i) => {
        const right = picks?.[i] === answer
        return <div key={id} className="v-div-row">
          <p className="v-div-label">{label}
            {picks && <span className={right ? 'v-hit' : 'v-miss'}>{right ? '✓' : '✗'} you said {sideLabel[picks[i]].toLowerCase()}</span>}</p>
          <div className="v-div-track" aria-hidden="true">
            <motion.span className={`v-div-bar v-${answer}`} style={{ [answer === 'men' ? 'right' : 'left']: '50%' }}
              initial={{ width: 0 }} animate={{ width: `${((d ?? 0) / max) * 50}%` }} transition={t(0.2 + i * 0.15, 0.9)} />
            <span className="v-div-value" style={{ [answer === 'men' ? 'right' : 'left']: `calc(50% + ${((d ?? 0) / max) * 50}% + .4rem)` }}>{(d ?? 0).toFixed(2)}</span>
          </div>
        </div>
      })}
      <p className="v-note">Standardized difference (Cohen’s d). Around 0.2 is small; 0.5 is medium.</p>
    </div>
  )
}

function DumbbellVisual({ question, pick }: { question: SlidersQuestion; pick?: string }) {
  const t = useTiming()
  const guess = pick ? parseSliders(question, pick) : undefined
  return (
    <div className="v-dumbbell" role="img" aria-label={(question.sources ?? []).map(({ label, men, women }) => `${label}: men ${men}%, women ${women}%`).join('. ')}>
      <div className="v-axis-labels" aria-hidden="true"><span><i className="v-key v-men" /> Men</span><span><i className="v-key v-women" /> Women</span>{guess && <span><i className="v-key v-guess" /> Your guesses</span>}</div>
      {(question.sources ?? []).map(({ label, men, women }, i) => (
        <div key={label} className={`v-db-row${i === 0 ? ' v-db-lead' : ''}`}>
          <p className="v-div-label">{label}</p>
          <div className="v-db-track" aria-hidden="true">
            <motion.span className="v-db-line" initial={{ left: `${men}%`, width: 0 }} animate={{ left: `${Math.min(men, women)}%`, width: `${Math.abs(women - men)}%` }} transition={t(0.3 + i * 0.12)} />
            {i === 0 && guess && <>
              <span className="v-db-dot v-guess" style={{ left: `${guess.men}%` }} title={`Your guess for men: ${guess.men}%`} />
              <span className="v-db-dot v-guess" style={{ left: `${guess.women}%` }} title={`Your guess for women: ${guess.women}%`} />
            </>}
            <motion.span className="v-db-dot v-men" initial={{ left: `${men}%`, scale: 0 }} animate={{ scale: 1 }} transition={t(0.15 + i * 0.12, 0.5)} />
            <motion.span className="v-db-dot v-women" initial={{ left: `${men}%`, scale: 0 }} animate={{ left: `${women}%`, scale: 1 }} transition={t(0.3 + i * 0.12)} />
            {men === women
              ? <span className="v-db-value" style={{ left: `${men}%` }}>{men}%</span>
              : <>
                <span className={`v-db-value v-men-text${women - men < 8 ? ' v-db-before' : ''}`} style={{ left: `${men}%` }}>{men}</span>
                <span className={`v-db-value v-women-text${women - men < 8 ? ' v-db-after' : ''}`} style={{ left: `${women}%` }}>{women}</span>
              </>}
          </div>
        </div>
      ))}
      <p className="v-note">% extremely or very likely to turn to each for emotional support.</p>
    </div>
  )
}

function Grid({ lit, label, delay, size = 'large' }: { lit: number; label: string; delay: number; size?: 'large' | 'small' }) {
  const reduce = useReducedMotion()
  const value = useCount(lit, 0, 900, delay * 1000)
  return (
    <figure className={`v-grid-figure v-grid-${size}`}>
      <div className="v-dots" aria-hidden="true">
        {Array.from({ length: 100 }, (_, i) => <motion.span key={i} className={i < lit ? 'on' : ''}
          initial={i < lit && !reduce ? { scale: 0.3, opacity: 0.25 } : false} animate={{ scale: 1, opacity: 1 }}
          transition={reduce ? { duration: 0 } : { delay: delay + i * 0.025, duration: 0.3 }} />)}
      </div>
      <figcaption><span className="v-big">{Math.round(value)}%</span>{label}</figcaption>
    </figure>
  )
}

function GridsVisual() {
  return (
    <div className="v-grids" role="img" aria-label="Feel lonely or isolated all or most of the time: under 50, 22%; 50 and older, 9%; men, 16%; women, 15%.">
      <div className="v-grid-pair">
        <Grid lit={22} label="Under 50" delay={0.2} />
        <Grid lit={9} label="50 and older" delay={0.5} />
      </div>
      <div className="v-grid-pair v-grid-pair-small">
        <Grid lit={16} label="Men" delay={1} size="small" />
        <Grid lit={15} label="Women" delay={1.2} size="small" />
      </div>
      <p className="v-note">Each dot is one percentage point: share who feel lonely or isolated all or most of the time.</p>
    </div>
  )
}

function BarsVisual({ question }: { question: ChapterQuestion }) {
  const timing = useTiming()
  const largest = Math.max(...(question.bars ?? []).map(({ amount }) => amount))
  return (
    <figure className="ch-bars">
      {question.measure && <figcaption className="discovery-measure">{question.measure}</figcaption>}
      <ul className="story-bars discovery-bars">
        {question.bars?.map(({ label, value, amount }, i) => (
          <li key={label}>
            <span>{label}</span><strong>{value}</strong>
            <span className="story-bar" aria-hidden="true">
              <motion.span initial={{ width: 0 }} animate={{ width: `${100 * amount / largest}%` }} transition={timing(0.25 + i * 0.12)} />
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function FactsVisual({ question }: { question: ChapterQuestion }) {
  const timing = useTiming()
  if (!question.facts?.length) return null
  return (
    <figure className="ch-bars">
      {question.measure && <figcaption className="discovery-measure">{question.measure}</figcaption>}
      <dl className="discovery-facts">
        {question.facts?.map(({ label, value }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={timing(0.25 + i * 0.15, 0.5)}>
            <dt>{label}</dt><dd>{value}</dd>
          </motion.div>
        ))}
      </dl>
    </figure>
  )
}

export function FindingVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'age': return <AgeVisual />
    case 'gauges': return <GaugesVisual />
    case 'rotation': return <RotationVisual />
    case 'curves': return <CurvesVisual />
    case 'diverging': return question.kind === 'rows' ? <DivergingVisual question={question} pick={pick} /> : null
    case 'dumbbell': return question.kind === 'sliders' ? <DumbbellVisual question={question} pick={pick} /> : null
    case 'grids': return <GridsVisual />
    case 'bars': return <BarsVisual question={question} />
    case 'facts': return <FactsVisual question={question} />
    case 'eyes': case 'maths': case 'moral': case 'paradox': return <NatureVisual question={question} pick={pick} />
    case 'permitcards': case 'adoption': case 'crimedrop': case 'fertility': return <WorldVisual question={question} />
    case 'chain':
    case 'rentcontrol':
    case 'airbnb':
    case 'twostudies':
    case 'ratio':
    case 'vacant':
    case 'permits':
    case 'auckland':
      return <HousingVisual question={question} pick={pick} />
    case 'pedestrian': case 'freefare': case 'height': case 'roads': case 'bikelanes': case 'citywage': case 'cooling': case 'tourism':
      return <CitiesVisual question={question} />
    case 'ceiling': case 'rank': case 'smarts': case 'ambition': case 'youth': case 'giving': case 'choiceset':
      return <HappinessVisual question={question} pick={pick} />
    case 'halfstory': case 'aistory': case 'humble': case 'news': case 'lure': case 'lies': case 'ideas':
      return <MindVisual question={question} pick={pick} />
    case 'fitfat': case 'sleepweek': case 'warrior': case 'bursts': case 'steps': case 'vitamins': case 'alcohol':
      return <HealthVisual question={question} />
    default: return <MoneyVisual question={question} pick={pick} />
  }
}
