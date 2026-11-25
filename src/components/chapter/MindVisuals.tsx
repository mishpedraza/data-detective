import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion } from '../../data/menWomen'
import { AI_STORIES, HALF_STORY, IDEAS, IDEAS_GROUPS, LIES, LURE, MERGE_CASE, NEWS, SLEEP_LIST } from '../../data/humanMind'
import { splitPick } from '../../lib/chapterScore'
import { useCount, useTiming } from './motion'

function Dots({ total, on, cols, label, tone, soft = 0 }: { total: number; on: number; cols: number; label: string; tone: string; soft?: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="v-hm-dots" style={{ '--cols': cols } as CSSProperties} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <motion.span key={i} className={i < on ? `is-${tone}` : i < on + soft ? 'is-soft' : ''} initial={reduce ? false : { opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 0.2 + i * 0.01, duration: 0.3 }} />
      ))}
    </div>
  )
}

/** Q1: the same feeling of being informed, with three arguments never seen. */
function HalfStoryVisual() {
  const t = useTiming()
  const page = (lines: readonly ('merge' | 'separate' | 'neutral' | 'missing')[], title: string, delay: number) => (
    <figure className="v-hm-page">
      <figcaption>{title}</figcaption>
      <div className="v-hm-sheet" aria-hidden="true">
        {lines.map((kind, i) => <motion.i key={i} className={`is-${kind}`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={t(delay + i * 0.08, 0.4)} />)}
      </div>
      <p className="v-hm-meter-label">Felt informed</p>
      <span className="v-hm-meter" aria-hidden="true"><motion.i initial={{ width: 0 }} animate={{ width: '78%' }} transition={t(delay + 0.7, 1)} /></span>
    </figure>
  )
  return (
    <div className="v-hm-half">
      <div className="v-hm-pages" role="img" aria-label="People who read all seven points and people who read only four felt equally well informed: a difference of 0.00 on the study's scale.">
        {page(['merge', 'merge', 'merge', 'neutral', 'separate', 'separate', 'separate'], 'Read both sides', 0.1)}
        {page(['merge', 'merge', 'merge', 'neutral', 'missing', 'missing', 'missing'], 'Read one side', 0.35)}
      </div>
      <p className="v-hm-headline"><span className="v-big">0.00</span> difference in how informed they felt <small>95% CI {HALF_STORY.adequacy.low.toFixed(2)} to +{HALF_STORY.adequacy.high.toFixed(2)}</small></p>
      <p className="v-kicker">What the pro-merger readers never saw</p>
      <ul className="v-hm-unseen">
        {MERGE_CASE.separate.map((line, i) => <motion.li key={line} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={t(1.6 + i * 0.25, 0.4)}>{line}</motion.li>)}
      </ul>
      <p className="v-kicker">Average guess of how many people would agree with them</p>
      <ul className="v-hm-agree">
        {HALF_STORY.agree.map(({ id, label, share }, i) => (
          <li key={id}>
            <span>{label}</span>
            <span className="v-hm-line" aria-hidden="true"><b style={{ left: '50%' }} /><motion.i initial={{ left: '50%' }} animate={{ left: `${share}%` }} transition={t(2.2 + i * 0.15, 0.8)} /></span>
            <strong>{share}%</strong>
          </li>
        ))}
      </ul>
      <p className="v-note">The bars and “felt informed” levels are illustrations; the numbers are the study’s. The tick marks 50%.</p>
    </div>
  )
}

// Fixed pseudo-random positions so the illustration is identical on every visit.
const STARS = Array.from({ length: 22 }, (_, i) => {
  const a = i * 2.39996, r = 0.25 + ((i * 37) % 22) / 30
  return { x: 50 + Math.cos(a) * r * 38, y: 50 + Math.sin(a) * r * 38 }
})

/** Q2: each story is a dot; with AI ideas they drift towards the same place. */
function AiStoryVisual() {
  const t = useTiming()
  const novelty = useCount(AI_STORIES.novelty.five, 0, 1100, 900)
  const field = (pull: number, title: string) => (
    <figure className="v-hm-field">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {pull > 0 && <motion.circle cx={50} cy={50} r={4} className="v-hm-ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.2, 0.5)} />}
        {STARS.map(({ x, y }, i) => (
          <motion.circle key={i} r={2.6} className="v-hm-story" initial={{ cx: x, cy: y }} animate={{ cx: x + (50 - x) * pull, cy: y + (50 - y) * pull }} transition={t(0.5 + i * 0.02, 1.4)} />
        ))}
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  )
  return (
    <div className="v-hm-ai-visual">
      <div className="v-hm-fields" role="img" aria-label="Illustration: stories written without AI are spread out; stories written with AI ideas cluster closer together and around the AI's ideas.">
        {field(0, 'Without AI')}
        {field(0.45, 'With AI ideas')}
      </div>
      <div className="v-hm-pair">
        <p><span className="v-big v-hm-violet">+{novelty.toFixed(1)}%</span>Each story: rated more novel, with five AI ideas</p>
        <p><span className="v-big v-hm-amber">+{AI_STORIES.similarityOfRange.five}%</span>The collection, with five AI ideas: more alike, as a share of the range among stories without AI</p>
      </div>
      <p className="v-hm-aside">For the least creative writers, stories were rated up to <strong>{AI_STORIES.lowCreative.wellWritten}%</strong> better written.</p>
      <p className="v-note">The dots are an illustration, not the study’s stories. Each dot is a story; closer dots are more similar; the centre mark is the AI’s ideas.</p>
    </div>
  )
}

const HUMBLE_EFFECTS = ['Trusted more', 'Research believed more', 'Advice followed more', 'More of their work sought out'] as const

/** Q3: the same result, said two ways. */
function HumbleVisual() {
  const t = useTiming()
  return (
    <div className="v-hm-humble">
      <figure className="v-hm-voice">
        <blockquote>“Our results clearly show this works.”</blockquote>
        <figcaption>Dr A, sure of it</figcaption>
      </figure>
      <figure className="v-hm-voice is-humble">
        <blockquote>“Our results suggest this works, but I could be wrong.”</blockquote>
        <figcaption>Dr B, open about limits</figcaption>
        <ul aria-label="Compared with less humble scientists">
          {HUMBLE_EFFECTS.map((effect, i) => (
            <motion.li key={effect} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={t(0.5 + i * 0.22, 0.45)}><span aria-hidden="true">↑</span> {effect}</motion.li>
          ))}
        </ul>
      </figure>
      <p className="v-note">Direction only: the open abstract doesn’t give effect sizes. Quotes are illustrations of the study’s high- and low-humility descriptions.</p>
    </div>
  )
}

/** Q4: two in three right either way, and age as a gain in discernment. */
function NewsVisual() {
  const t = useTiming()
  const trueRight = Math.round(NEWS.trueRight), falseRight = Math.round(NEWS.falseRight)
  return (
    <div className="v-hm-news">
      <div className="v-hm-grids">
        <figure>
          <figcaption><span className="v-big v-hm-sage">{NEWS.trueRight.toFixed(1)}%</span>of true headlines called true</figcaption>
          <Dots total={100} on={trueRight} cols={10} tone="sage" label={`Of every 100 true headlines, about ${trueRight} were correctly judged true.`} />
        </figure>
        <figure>
          <figcaption><span className="v-big v-hm-violet">{NEWS.falseRight.toFixed(1)}%</span>of false headlines called false</figcaption>
          <Dots total={100} on={falseRight} cols={10} tone="violet" label={`Of every 100 false headlines, about ${falseRight} were correctly judged false.`} />
        </figure>
      </div>
      <p className="v-kicker">Telling true from false, by age</p>
      <svg className="v-hm-age" viewBox="0 0 320 90" role="img" aria-label="Direction only: discernment rises with age.">
        <line x1={20} x2={300} y1={70} y2={70} className="v-grid" />
        <motion.path d="M20 64 C 110 56, 200 40, 300 22" className="v-hm-rise" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t(0.8, 1.2)} />
        <text x={20} y={86} className="v-tick">younger</text>
        <text x={300} y={86} className="v-tick" textAnchor="end">older</text>
        <motion.text x={300} y={14} className="v-value v-strong" textAnchor="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(1.8, 0.4)}>β = {NEWS.age}</motion.text>
      </svg>
      <p className="v-note">Pooled across {NEWS.experiments} US experiments. The age curve shows direction only. Older adults also leaned more towards calling headlines false.</p>
    </div>
  )
}

/** Q5: the list, the word that was never there, and how often it was “remembered”. */
function LureVisual({ pick }: { pick?: string }) {
  const t = useTiming()
  const warm = pick ? splitPick(pick).warm : undefined
  const rows = [
    { label: 'Words on the list', value: LURE.hits, tone: 'ink' },
    { label: '“Sleep”-type words, never shown', value: LURE.lure, tone: 'violet' },
    { label: 'Unrelated words, never shown', value: LURE.unrelated, tone: 'sage' },
  ]
  return (
    <div className="v-hm-lure">
      <div className="v-hm-cloud" aria-hidden="true">
        {SLEEP_LIST.map((word, i) => <span key={word} style={{ '--i': i } as CSSProperties}>{word}</span>)}
        <motion.strong initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={t(0.6, 0.9)}>sleep</motion.strong>
      </div>
      {warm && <p className="v-hm-aside">{warm === 'yes' ? 'You said “sleep” was there. It wasn’t, and most people in the study felt the same.' : 'You said “sleep” wasn’t there. Right: it never appeared, though most people in the study said it had.'}</p>}
      <p className="v-kicker">Said “I saw it”, out of 20</p>
      <ul className="v-hm-rows" aria-label="Share of words people said they had seen">
        {rows.map(({ label, value, tone }) => (
          <li key={label}>
            <span>{label}</span>
            <Dots total={20} on={Math.round(value / 5)} cols={20} tone={tone} label={`${label}: ${value}%`} />
            <strong>{value}%</strong>
          </li>
        ))}
      </ul>
      <p className="v-note">Bayoud, Pierce &amp; Gallo (2026), first experiment. Dots are rounded to the nearest 5%.</p>
    </div>
  )
}

/** Q6: people, a coin and an algorithm on one line. */
function LiesVisual() {
  const t = useTiming()
  const x = (v: number) => 4 + ((v - 30) / 50) * 312
  const accused = Math.round(LIES.accuse), caught = Math.round(LIES.accuse * LIES.accuseRight / 100)
  return (
    <div className="v-hm-lies">
      <svg className="v-hm-track" viewBox="0 0 320 72" role="img" aria-label={`People were ${LIES.human}% accurate, guessing gives 50%, the algorithm was ${LIES.algorithm}% accurate.`}>
        <line x1={4} x2={316} y1={34} y2={34} className="v-hm-axis" />
        <text x={x(50)} y={16} className="v-hm-label" textAnchor="middle">Coin flip 50%</text>
        <circle cx={x(50)} cy={34} r={7} className="v-hm-coin" />
        <motion.g initial={{ x: x(50) - x(LIES.human), opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={t(0.4, 1)}>
          <circle cx={x(LIES.human)} cy={34} r={7} className="v-hm-people" />
          <text x={x(LIES.human) + 4} y={60} className="v-hm-label is-people" textAnchor="end">People {LIES.human.toFixed(1)}%</text>
        </motion.g>
        <motion.g initial={{ x: x(50) - x(LIES.algorithm), opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={t(1, 1)}>
          <circle cx={x(LIES.algorithm)} cy={34} r={7} className="v-hm-algo" />
          <text x={x(LIES.algorithm)} y={60} className="v-hm-label is-algo" textAnchor="middle">Algorithm {LIES.algorithm.toFixed(1)}%</text>
        </motion.g>
      </svg>
      <p className="v-kicker">Of every 100 statements</p>
      <Dots total={100} on={caught} soft={accused - caught} cols={20} tone="violet" label={`People accused about ${accused} of every 100 statements of being lies; about ${caught} of those really were.`} />
      <ul className="v-hm-key">
        <li><i className="is-violet" /> Accused, and really a lie <strong>{caught}</strong></li>
        <li><i className="is-soft" /> Accused, but true <strong>{accused - caught}</strong></li>
      </ul>
      <p className="v-hm-aside">Across 12 earlier studies, confidence didn’t predict who was right.</p>
      <p className="v-note">Without the algorithm. Track runs from 30% to 80%.</p>
    </div>
  )
}

/** Q7: two rooms, then who came out ahead on each outcome (direction only). */
function IdeasVisual() {
  const t = useTiming()
  const seats = [[0, -26], [-26, 18], [26, 18]] as const
  const room = (cx: number, kind: 'talk' | 'write', title: string) => (
    <g>
      <text x={cx} y={14} textAnchor="middle" className={`v-hm-label is-${kind}`}>{title}</text>
      <circle cx={cx} cy={66} r={22} className="v-hm-table" />
      {seats.map(([dx, dy], i) => <circle key={i} cx={cx + dx * 1.45} cy={66 + dy * 1.45} r={6} className="v-hm-seat" />)}
      {kind === 'talk'
        ? seats.map(([dx, dy], i) => (
          <motion.path key={i} d={`M${cx + dx * 1.45 + 9} ${66 + dy * 1.45 - 16} h16 a4 4 0 0 1 4 4 v6 a4 4 0 0 1 -4 4 h-10 l-5 4 v-4 h-1 a4 4 0 0 1 -4 -4 v-6 a4 4 0 0 1 4 -4 z`} className="v-hm-bubble"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0.25] }} transition={{ ...t(0.3 + i * 0.9, 0.9), times: [0, 0.2, 0.8, 1] }} />
        ))
        : seats.flatMap(([dx, dy], i) => [0, 1, 2].map((n) => (
          <motion.rect key={`${i}-${n}`} x={cx + dx * 0.5 - 5 + n * 3} y={66 + dy * 0.5 - 6 - n * 3} width={10} height={10} rx={1.5} className="v-hm-note"
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={t(0.3 + n * 0.8 + i * 0.1, 0.4)} />
        )))}
    </g>
  )
  return (
    <div className="v-hm-ideas">
      <svg viewBox="0 0 320 112" className="v-hm-rooms" role="img" aria-label="Illustration: one group takes turns talking; the other writes ideas silently at the same time.">
        {room(80, 'talk', 'Talking it through')}
        {room(240, 'write', 'Writing silently')}
      </svg>
      <div className="v-hm-tug" role="list" aria-label="Who came out ahead">
        <p className="v-hm-tug-head" aria-hidden="true"><span className="is-talk">Talking</span><span>came out ahead</span><span className="is-write">Writing</span></p>
        {IDEAS.map(({ outcome, winner }, i) => (
          <div key={outcome} className={`v-hm-tug-row is-${winner}`} role="listitem" aria-label={`${outcome}: ${winner === 'write' ? 'writing' : 'talking'} came out ahead`}>
            <span className="v-hm-tug-label">{outcome}</span>
            <span className="v-hm-tug-track" aria-hidden="true">
              <motion.i initial={{ left: '50%' }} animate={{ left: winner === 'write' ? '88%' : '12%' }} transition={t(0.6 + i * 0.25, 0.8)} />
            </span>
          </div>
        ))}
      </div>
      <p className="v-hm-aside">Not on video: pairs meeting in person came up with <strong>more creative ideas</strong> than pairs on a video call, but weren’t better at choosing one.</p>
      <p className="v-note">Illustration above. Rows show only who came out ahead, not by how much: the first three from {IDEAS_GROUPS.online} online groups (2025), the last two from {IDEAS_GROUPS.cohesion} three-person groups (2026).</p>
    </div>
  )
}

export function MindVisual({ question, pick }: { question: ChapterQuestion; pick?: string }) {
  switch (question.visual) {
    case 'halfstory': return <HalfStoryVisual />
    case 'aistory': return <AiStoryVisual />
    case 'humble': return <HumbleVisual />
    case 'news': return <NewsVisual />
    case 'lure': return <LureVisual pick={pick} />
    case 'lies': return <LiesVisual />
    case 'ideas': return <IdeasVisual />
    default: return null
  }
}
