import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { EYES_COUNTRIES, MATHS_GAPS, MORAL_GAPS } from '../../data/natureNurture'
import { overlap, splitPick } from '../../lib/chapterScore'
import { useCount, useTiming } from './motion'

function EyesVisual({ pick }: { pick?: string }) {
  const reduce = useReducedMotion()
  const { total, women, none, men } = EYES_COUNTRIES
  const guess = pick ? Number(splitPick(pick).main) : undefined
  return (
    <div className="v-eyes">
      {guess !== undefined && <p className="v-yours">You picked <strong>{guess}</strong>.</p>}
      <div className="v-eyes-grid" role="img" aria-label={`Of ${total} countries, women scored significantly higher in ${women}, there was no significant difference in ${none}, and men scored significantly higher in ${men}.`}>
        {Array.from({ length: total }, (_, i) => (
          <motion.span key={i} className={`v-country ${i < women ? 'is-women' : 'is-none'}${guess !== undefined && i === guess - 1 ? ' is-guess' : ''}`}
            initial={reduce ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { delay: 0.15 + i * 0.025, duration: 0.3 }} />
        ))}
      </div>
      <ul className="v-power-key">
        <li><i className="is-women" /> Women significantly higher <strong>{women}</strong></li>
        <li><i className="is-none" /> No significant difference <strong>{none}</strong></li>
        <li><i className="is-men" /> Men significantly higher <strong>{men}</strong></li>
      </ul>
      <p className="v-note">Each square is one country. Countries are not shown in any geographic order.</p>
    </div>
  )
}

const pdf = (x: number, mean: number) => Math.exp(-((x - mean) ** 2) / 2) / Math.sqrt(2 * Math.PI)

function MathsVisual() {
  const [view, setView] = useState<(typeof MATHS_GAPS)[number]['id']>('all')
  const target = MATHS_GAPS.find(({ id }) => id === view)!
  const d = useCount(target.d, 0, 900, 150)
  const xs = Array.from({ length: 121 }, (_, i) => -3.6 + (i * 7.2) / 120)
  const sx = (x: number) => 180 + x * 46
  const sy = (y: number) => 150 - y * 300
  const path = (mean: number) => xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(pdf(x, mean)).toFixed(1)}`).join('')
  const shared = `M${sx(xs[0])},${sy(0)}` + xs.map((x) => `L${sx(x).toFixed(1)},${sy(Math.min(pdf(x, -d / 2), pdf(x, d / 2))).toFixed(1)}`).join('') + `L${sx(xs[xs.length - 1])},${sy(0)}Z`
  return (
    <div className="v-curves v-maths">
      <div className="v-toggle" role="group" aria-label="Which studies">
        {MATHS_GAPS.map(({ id, label }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}
      </div>
      <div className="v-headline"><span className="v-big">{Math.round(overlap(target.d) * 100)}%</span><span>overlap · gap {target.d.toFixed(2)} SD</span></div>
      <svg viewBox="0 0 360 172" role="img" aria-label={`Illustrative distributions of maths scores. ${target.label}: a gap of ${target.d} standard deviations favouring boys, leaving about ${Math.round(overlap(target.d) * 100)}% overlap.`}>
        <path d={shared} className="v-overlap" />
        <path d={path(-d / 2)} className="v-curve v-women" />
        <path d={path(d / 2)} className="v-curve v-men" />
        <line x1={20} x2={340} y1={150} y2={150} className="v-base" />
        <text x={sx(-d / 2) - 8} y={sy(pdf(0, 0)) - 6} textAnchor="end" className="v-label v-women-text">Girls</text>
        <text x={sx(d / 2) + 8} y={sy(pdf(0, 0)) - 6} className="v-label v-men-text">Boys</text>
        <text x={180} y={166} textAnchor="middle" className="v-tick">lower scores ← → higher scores</text>
      </svg>
      <p className="v-note">Illustrative curves assuming normal distributions with equal spread, drawn from the meta-analysis’s average gaps, not observed score data.</p>
    </div>
  )
}

function MoralVisual({ pick }: { pick?: string }) {
  const t = useTiming()
  const guess = pick ? splitPick(pick).main : undefined
  const scale = 0.5
  return (
    <figure className="v-moral">
      <figcaption className="v-kicker">How much higher women rated each value · points on a 0–5 scale</figcaption>
      <ul>
        {MORAL_GAPS.map(({ id, label, detail, gap }, i) => (
          <li key={id} className={guess === id ? 'is-guess' : ''}>
            <span className="v-moral-label"><strong>{label}</strong> {detail}</span>
            <span className="v-moral-track" aria-hidden="true">
              <motion.i initial={{ width: 0 }} animate={{ width: `${Math.max(gap / scale * 100, 0.8)}%` }} transition={t(0.2 + i * 0.15, 0.8)} />
            </span>
            <span className="v-moral-value">{gap < 0.01 ? '≈ 0' : `+${gap.toFixed(2)}`}</span>
          </li>
        ))}
      </ul>
      <p className="v-note">Even the largest gap, Care, is under half a point out of five, so most men and women gave similar answers.</p>
    </figure>
  )
}

/** Three made-up cultural regions: within each, more equality goes with smaller gaps, but the regions differ, so pooling them shows the opposite. */
const REGIONS: readonly { id: 'a' | 'b' | 'c'; label: string; points: readonly (readonly [number, number])[] }[] = [
  { id: 'a', label: 'Region A', points: [[18, 30], [26, 27], [34, 25], [42, 22], [50, 21], [58, 18]] },
  { id: 'b', label: 'Region B', points: [[40, 48], [48, 46], [56, 43], [64, 41], [72, 39], [80, 36]] },
  { id: 'c', label: 'Region C', points: [[62, 68], [70, 66], [78, 63], [86, 61], [94, 58], [100, 57]] },
]

function fit(points: readonly (readonly [number, number])[]) {
  const n = points.length
  const mx = points.reduce((s, [x]) => s + x, 0) / n
  const my = points.reduce((s, [, y]) => s + y, 0) / n
  const slope = points.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / points.reduce((s, [x]) => s + (x - mx) ** 2, 0)
  const xs = points.map(([x]) => x)
  const from = Math.min(...xs), to = Math.max(...xs)
  return { x1: from, y1: my + slope * (from - mx), x2: to, y2: my + slope * (to - mx) }
}

function ParadoxVisual() {
  const [grouped, setGrouped] = useState(false)
  const t = useTiming()
  const sx = (x: number) => 40 + x * 3
  const sy = (y: number) => 160 - y * 1.9
  const all = fit(REGIONS.flatMap(({ points }) => points))
  return (
    <div className="v-paradox">
      <div className="v-toggle" role="group" aria-label="How countries are compared">
        <button type="button" aria-pressed={!grouped} onClick={() => setGrouped(false)}>All countries together</button>
        <button type="button" aria-pressed={grouped} onClick={() => setGrouped(true)}>Within cultural regions</button>
      </div>
      <svg viewBox="0 0 360 190" role="img" aria-label={grouped
        ? 'Illustration: within each of three cultural regions, more equal countries show smaller gender gaps.'
        : 'Illustration: pooling all countries, more equal countries appear to show larger gender gaps.'}>
        <line x1={40} x2={345} y1={160} y2={160} className="v-base" />
        <line x1={40} x2={40} y1={20} y2={160} className="v-base" />
        <text x={192} y={182} textAnchor="middle" className="v-tick">gender equality →</text>
        <text x={14} y={90} textAnchor="middle" className="v-tick" transform="rotate(-90 14 90)">gender gap →</text>
        {REGIONS.map(({ id, points }) => points.map(([x, y], i) => (
          <circle key={`${id}${i}`} cx={sx(x)} cy={sy(y)} r={5} className={`v-region ${grouped ? `is-${id}` : ''}`} />
        )))}
        {!grouped && <motion.line key="all" x1={sx(all.x1)} y1={sy(all.y1)} x2={sx(all.x2)} y2={sy(all.y2)} className="v-fit"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.2, 0.8)} />}
        {grouped && REGIONS.map(({ id, label, points }, i) => {
          const line = fit(points)
          return <g key={id}>
            <motion.line x1={sx(line.x1)} y1={sy(line.y1)} x2={sx(line.x2)} y2={sy(line.y2)} className={`v-fit is-${id}`}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.15 + i * 0.15, 0.6)} />
            <text x={sx(line.x2) + 4} y={sy(line.y2) - 8} className={`v-tick v-region-label is-${id}`}>{label}</text>
          </g>
        })}
      </svg>
      <p className="v-yours">{grouped ? 'Within every region, the trend runs the other way.' : 'Pooled together, equality seems to widen the gap.'}</p>
      <p className="v-note">Illustrative data, not real countries: it shows how comparing across cultural regions can reverse a trend (Simpson’s paradox).</p>
    </div>
  )
}

export function NatureVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'eyes': return <EyesVisual pick={pick} />
    case 'maths': return <MathsVisual />
    case 'moral': return <MoralVisual pick={pick} />
    case 'paradox': return <ParadoxVisual />
    default: return null
  }
}
