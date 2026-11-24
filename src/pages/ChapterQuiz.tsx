import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion, ChoiceQuestion, Side, Warmup } from '../data/menWomen'
import { QUIZZES, hasChapterList, quizQuestions, type Quiz, type QuizChapter } from '../data/quizzes'
import { StorySources } from '../components/StoryEvidence'
import { FindingVisual } from '../components/chapter/Visuals'
import { useCount } from '../components/chapter/motion'
import { SIDES, chapterAnswers, chapterQuestions, recordAnswer, chapterResult, formatPoints, parseEstimate, parseRows, parseSliders, parseWeek, scoreQuestion, splitPick, totalPoints } from '../lib/chapterScore'
import { challengeReaction, partialReaction } from '../lib/discoveryChallenge'
import { readDiscoveryProgress, type DiscoveryProgress } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'
import { follow } from '../lib/quizEntry'
import { shareLink } from '../lib/site'
import { ScoreShare } from '../components/ScoreShare'
import type { Scorecard } from '../lib/scorecard'
import { chapterProgress, pointSequence, themeProgress, themeVersion } from '../lib/themeProgress'
import { nextAttempt, shareOrigin, shareProps } from '../lib/shareTracking'
import { ThemeNext, ThemeResults } from './ThemeResults'

const plainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

const sideLabel: Record<Side, string> = { men: 'Men', similar: 'Similar', women: 'Women' }

const unitOf = (question: ChapterQuestion) => question.kind === 'sliders' && question.unit === 'h' ? ' h' : '%'
const off = (guess: number, actual: number, unit: string) => {
  const gap = Math.round(Math.abs(guess - actual) * 10) / 10
  return gap === 0 ? 'spot on' : `${gap}${unit === '%' ? ' points' : ' hours'} off`
}

function verdictDetail(question: ChapterQuestion, pick: string) {
  // The options already mark the pick and the answer.
  if (question.kind === 'choice') return null
  if (question.kind === 'rows') return `${parseRows(question, pick)!.filter((side, i) => side === question.rows[i].answer).length} of ${question.rows.length} predictions matched.`
  if (question.kind === 'estimate') {
    const guess = parseEstimate(question, pick)!
    return `You guessed ${guess}%; it was ${question.actual}% (${off(guess, question.actual, '%')}).`
  }
  const guess = parseSliders(question, pick)!
  const unit = unitOf(question)
  const { men, women } = question.labels ?? { men: 'Men', women: 'Women' }
  return `${men}: you guessed ${guess.men}${unit}, it was ${question.actual.men}${unit} (${off(guess.men, question.actual.men, unit)}). ${women}: ${guess.women}${unit} vs ${question.actual.women}${unit} (${off(guess.women, question.actual.women, unit)}).`
}

function Verdict({ question, pick, points, index }: { question: ChapterQuestion; pick: string; points: number; index: number }) {
  // The line rotates by question so a run doesn't repeat itself.
  const line = points === 1 ? challengeReaction(index, true) : points > 0 ? partialReaction(index) : challengeReaction(index, false)
  return (
    <p className={`ch-verdict ${points === 1 ? 'is-right' : points > 0 ? 'is-partial' : 'is-wrong'}`}>
      <strong>{line}</strong> {verdictDetail(question, pick)} <span className="ch-points">+{formatPoints(points)} {points === 1 ? 'point' : 'points'}</span>
    </p>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

/** Five days in half-day cells. Only the total is stored, so a locked week is shown filled from Monday. */
export function WeekCalendar({ label, days, onChange }: { label: string; days?: number; onChange?: (days: number) => void }) {
  const [cells, setCells] = useState<boolean[]>(() => Array.from({ length: 10 }, (_, i) => i < (days ?? 0) * 2))
  const value = cells.filter(Boolean).length / 2
  return (
    <fieldset className={`ch-week${onChange ? '' : ' is-locked'}`}>
      <legend><span>{label}</span><span className="ch-week-value">{days === undefined && onChange && !cells.some(Boolean) ? '—' : `${onChange ? value : days} ${(onChange ? value : days) === 1 ? 'day' : 'days'}`}</span></legend>
      <div className="ch-week-days">
        {DAYS.map((day, d) => (
          <div key={day} className="ch-week-day">
            <span className="ch-week-name">{day}</span>
            {[0, 1].map((half) => {
              const i = d * 2 + half
              const name = `${day} ${half ? 'afternoon' : 'morning'}`
              return onChange
                ? <button key={half} type="button" className={cells[i] ? 'on' : ''} aria-pressed={cells[i]} aria-label={`${label}: work ${name}`}
                  onClick={() => { const next = cells.map((on, j) => j === i ? !on : on); setCells(next); onChange(next.filter(Boolean).length / 2) }} />
                : <i key={half} className={cells[i] ? 'on' : ''} />
            })}
          </div>
        ))}
      </div>
    </fieldset>
  )
}

function WarmupInput({ warmup, value, onDone }: { warmup: Warmup; value?: string; onDone?: (warm: string) => void }) {
  const [days, setDays] = useState<[number?, number?]>([])
  const locked = value !== undefined
  if (warmup.kind === 'choice') return (
    <div className="ch-warmup">
      <p className="ch-warmup-kicker">Not scored</p>
      <p className="ch-warmup-prompt">{warmup.prompt}</p>
      <div className={`ch-options${locked ? ' is-revealed' : ''}`} role="group" aria-label="Your choice">
        {warmup.options.map(({ id, label }, i) => (
          <button key={id} type="button" className={`ch-option${locked ? id === value ? ' is-chosen' : ' is-other' : ''}`} disabled={locked} aria-pressed={value === id} onClick={() => onDone?.(id)}>
            <span className="ch-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
  const saved = parseWeek(value)
  const ready = days[0] !== undefined && days[1] !== undefined
  return (
    <div className="ch-warmup">
      <p className="ch-warmup-kicker">Not scored</p>
      <p className="ch-warmup-prompt">{warmup.prompt}</p>
      <p className="ch-warmup-hint">{locked ? 'Your ideal week' : 'Tap each half day to work it.'}</p>
      <WeekCalendar key={`you-${locked}`} label="You" days={saved?.[0]} onChange={locked ? undefined : (d) => setDays(([, p]) => [d, p])} />
      <WeekCalendar key={`partner-${locked}`} label="Your partner" days={saved?.[1]} onChange={locked ? undefined : (d) => setDays(([y]) => [y, d])} />
      {!locked && <button type="button" className="challenge-primary ch-reveal" disabled={!ready} onClick={() => onDone?.(`${days[0]},${days[1]}`)}>
        {ready ? 'Continue →' : 'Set both weeks'}
      </button>}
    </div>
  )
}

function ChoiceInput({ question, pick, onPick }: { question: ChoiceQuestion; pick?: string; onPick: (pick: string) => void }) {
  const saved = pick ? splitPick(pick) : undefined
  const [warm, setWarm] = useState<string>()
  const warmed = saved?.warm ?? warm
  return (
    <>
      {question.warmup && <WarmupInput warmup={question.warmup} value={warmed} onDone={setWarm} />}
      {question.warmup && warmed !== undefined && <p className="ch-prompt">{question.prompt}</p>}
      {(!question.warmup || warmed !== undefined) && <div className={`ch-options${pick ? ' is-revealed' : ''}`} role="group" aria-label="Your prediction">
        {question.options.map(({ id, label }, i) => {
          const state = !saved ? '' : id === question.answer ? ' is-answer' : id === saved.main ? ' is-pick' : ' is-other'
          return (
            <button key={id} type="button" className={`ch-option${state}`} disabled={!!pick} aria-pressed={saved?.main === id} onClick={() => onPick(question.warmup ? `${id}|${warmed}` : id)}>
              <span className="ch-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
              <span>{label}</span>
              {saved && id === question.answer && <span className="ch-mark" aria-label="Correct answer">✓</span>}
              {saved && id === saved.main && id !== question.answer && <span className="ch-mark" aria-label="Your answer">✗</span>}
            </button>
          )
        })}
      </div>}
    </>
  )
}

function RowsInput({ question, pick, onPick }: { question: Extract<ChapterQuestion, { kind: 'rows' }>; pick?: string; onPick: (pick: string) => void }) {
  const [draft, setDraft] = useState<(Side | undefined)[]>(() => pick ? parseRows(question, pick)! : question.rows.map(() => undefined))
  const ready = draft.every(Boolean)
  if (pick) return null
  return (
    <div className="ch-rows">
      {question.rows.map(({ id, label }, i) => (
        <fieldset key={id} className="ch-row">
          <legend>{label}</legend>
          <div className="ch-segment">
            {SIDES.map((side) => (
              <label key={side} className={draft[i] === side ? 'is-on' : ''}>
                <input type="radio" name={id} value={side} checked={draft[i] === side}
                  onChange={() => setDraft((current) => current.map((value, j) => j === i ? side : value))} />
                {question.labels?.[side] ?? sideLabel[side]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" className="challenge-primary ch-reveal" disabled={!ready} onClick={() => onPick(draft.join(','))}>
        {ready ? 'Reveal the results →' : `Make all ${question.rows.length} predictions (${draft.filter(Boolean).length}/${question.rows.length})`}
      </button>
    </div>
  )
}

function Slider({ label, tone, value, onChange, unit = '%', max = 100 }: { label: string; tone: 'men' | 'women' | 'accent'; value?: number; onChange: (value: number) => void; unit?: '%' | 'h'; max?: number }) {
  const middle = Math.round(max / 2)
  const spoken = unit === 'h' ? 'hours a week' : 'percent'
  return (
    <label className={`ch-slider v-${tone}`}>
      <span className="ch-slider-head"><span>{label}</span><span className="ch-slider-value">{value === undefined ? '—' : `${value}${unit === 'h' ? ' h' : '%'}`}</span></span>
      <input type="range" min={0} max={max} step={1} value={value ?? middle} aria-valuetext={value === undefined ? 'Not set' : `${value} ${spoken}`}
        className={value === undefined ? 'is-unset' : ''} onChange={(event) => onChange(Number(event.target.value))}
        onPointerDown={() => value === undefined && onChange(middle)} />
      <span className="ch-people" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => <i key={i} className={value !== undefined && i < Math.round((value / max) * 20) ? 'on' : ''} />)}
      </span>
    </label>
  )
}

function SlidersInput({ question, pick, onPick }: { question: Extract<ChapterQuestion, { kind: 'sliders' }>; pick?: string; onPick: (pick: string) => void }) {
  const [men, setMen] = useState<number>()
  const [women, setWomen] = useState<number>()
  if (pick) return null
  const ready = men !== undefined && women !== undefined
  const labels = question.labels ?? { men: 'Men', women: 'Women' }
  return (
    <div className="ch-sliders">
      <p className="ch-scenario">{question.scenario}</p>
      <Slider label={labels.men} tone="men" value={men} onChange={setMen} unit={question.unit} max={question.max} />
      <Slider label={labels.women} tone="women" value={women} onChange={setWomen} unit={question.unit} max={question.max} />
      <button type="button" className="challenge-primary ch-reveal" disabled={!ready} onClick={() => onPick(`${men},${women}`)}>
        {ready ? 'Lock in my estimates →' : 'Set both estimates'}
      </button>
    </div>
  )
}

function EstimateInput({ question, pick, onPick }: { question: Extract<ChapterQuestion, { kind: 'estimate' }>; pick?: string; onPick: (pick: string) => void }) {
  const [value, setValue] = useState<number>()
  if (pick) return null
  return (
    <div className="ch-sliders">
      <Slider label={question.label} tone="accent" value={value} onChange={setValue} />
      <button type="button" className="challenge-primary ch-reveal" disabled={value === undefined} onClick={() => onPick(String(value))}>
        {value !== undefined ? 'Lock in my estimate →' : 'Set your estimate'}
      </button>
    </div>
  )
}

function Reveal({ question, pick, points, index, onEvidence, explore }: { question: ChapterQuestion; pick: string; points: number; index: number; onEvidence: () => void; explore?: ReactNode }) {
  const reduce = useReducedMotion()
  const { evidence } = question
  return (
    <motion.section className="ch-reveal-panel" aria-live="polite" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <Verdict question={question} pick={pick} points={points} index={index} />
      <p className="ch-finding">{question.finding}</p>
      <div className="ch-visual"><FindingVisual question={question} pick={pick} /></div>
      <p className="ch-takeaway">{question.takeaway}</p>
      <details className="ch-evidence" onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) onEvidence() }}>
        <summary>How we know</summary>
        {evidence ? <dl>
          <dt>Study</dt><dd><a href={evidence.url} target="_blank" rel="noreferrer">{evidence.citation} ↗</a></dd>
          <dt>Who</dt><dd>{evidence.sample}</dd>
          <dt>Method</dt><dd>{evidence.method}</dd>
          <dt>Limits</dt><dd>{evidence.limitation}</dd>
        </dl> : question.refs && <StorySources refs={question.refs} />}
      </details>
      {explore}
    </motion.section>
  )
}

function Results({ quiz, chapter, questions, attempt, restart, navigate, openQuestion }: {
  openQuestion: (id: string) => void
  quiz: Quiz; chapter: QuizChapter; questions: ChapterQuestion[]; attempt: DiscoveryProgress; restart: () => void; navigate: (href: string) => void
}) {
  const answers = chapterAnswers(attempt, questions, quiz.edition)
  const points = totalPoints(answers)
  const shown = useCount(points, 0, 1300, 200)
  const reduceMotion = useReducedMotion()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const theme = themeProgress(quiz, attempt)
  const own = theme.chapters.find((entry) => entry.chapter.id === chapter.id) ?? chapterProgress(quiz, chapter, attempt)
  const card: Scorecard = { kind: 'quiz', theme: quiz.title, title: chapter.title, points, total: questions.length, sequence: pointSequence(own), accent: quiz.accent }
  const nextInTheme = hasChapterList(quiz) && !theme.complete ? theme.chapters.find((entry) => entry.chapter.id !== chapter.id && entry.state !== 'completed') : undefined
  const combined = theme.complete && hrefFor('discover', { quiz: quiz.id, mode: 'theme' })

  const target = QUIZZES.find((entry) => entry.id !== quiz.id && quizQuestions(entry).length)
  const nextHref = nextInTheme && hrefFor('discover', { quiz: quiz.id, chapter: nextInTheme.chapter.id })
  const other = target && hrefFor('discover', { quiz: target.id })
  const browse = hrefFor('discover', { quiz: quiz.id, mode: 'browse' })
  return (
    <section className="discovery-reading ch-results chapter-results">
      <div className="chapter-result-hero">
        <p className="ch-score" aria-label={`${formatPoints(points)} out of ${questions.length} points`}>
          <span className="ch-score-big">{formatPoints(shown === points ? points : Math.round(shown * 4) / 4)}</span><span className="ch-score-of">/ {questions.length}</span>
        </p>
        <div>
          <p className="discovery-kicker">{chapter.title} · Results</p>
          <h1 ref={heading} tabIndex={-1}>{chapterResult(points, questions.length)}</h1>
        </div>
      </div>
      {hasChapterList(quiz) && <ThemeNext quiz={quiz} theme={theme} navigate={navigate} combined={combined || undefined}
        next={nextInTheme && nextHref ? { title: nextInTheme.chapter.title, href: nextHref, state: nextInTheme.state } : undefined} />}
      <h2 className="chapter-tally-heading" id="chapter-tally-heading">Your answers</h2>
      <ol className="ch-tally" aria-labelledby="chapter-tally-heading" style={{ '--steps': questions.length } as CSSProperties}>
        {questions.map((question, i) => {
          const answer = answers.find(({ id }) => id === question.id)
          const p = answer?.points ?? 0
          return (
            <li key={question.id}>
              <a href={hrefFor('discover', { quiz: quiz.id, q: question.id, mode: 'challenge' })} onClick={(event) => { if (!plainClick(event)) return; event.preventDefault(); openQuestion(question.id) }}>
                <span className="ch-tally-bar" aria-hidden="true"><motion.i initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${p * 100}%` }} transition={reduceMotion ? { duration: 0 } : { delay: 0.2 + i * 0.06, duration: 0.5 }} /></span>
                <span className="ch-tally-label">{question.short}</span>
                <span className="ch-tally-points">{formatPoints(p)} / 1</span>
              </a>
            </li>
          )
        })}
      </ol>
      <details className="chapter-scoring">
        <summary>How scoring works</summary>
        <p>{chapter.scoring ?? 'One point per question.'}</p>
      </details>
      <ScoreShare card={card} url={shareLink({ quiz: quiz.id, ...(hasChapterList(quiz) && { chapter: chapter.id }) }, 'quiz')}
        analytics={{ quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id, score: points, max_points: questions.length }} />
      <div className="ch-actions">
        {target && other && <a className="discovery-link" href={other} onClick={(event) => {
          if (!plainClick(event)) return
          event.preventDefault()
          track('another_quiz_started', { quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id, target_quiz_id: target.id })
          navigate(other)
        }}>Try “{target.title}” →</a>}
        {quiz.browse && <a className="discovery-link" href={browse} onClick={(event) => {
          if (!plainClick(event)) return
          event.preventDefault()
          navigate(browse)
        }}>Browse all discoveries →</a>}
        <button className="discovery-clue" type="button" onClick={restart}>Play again</button>
      </div>
    </section>
  )
}

export function ChapterQuiz({ quiz, navigate, selected, mode, chapterId }: { quiz: Quiz; navigate: (href: string) => void; selected: string | null; mode: string | null; chapterId: string | null }) {
  // Older links name a question but no chapter; open the chapter that holds it.
  const chapter = quiz.chapters.find(({ id }) => id === chapterId)
    ?? quiz.chapters.find(({ questionIds }) => questionIds.includes(selected ?? ''))
    ?? quiz.chapters[0]
  if (mode === 'theme' && hasChapterList(quiz)) return <ThemeResults quiz={quiz} navigate={navigate} />
  return <ChapterPlayer key={chapter.id} quiz={quiz} chapter={chapter} themed={hasChapterList(quiz)} navigate={navigate} selected={selected} mode={mode} />
}

function ChapterPlayer({ quiz, chapter, themed, navigate, selected, mode }: { quiz: Quiz; chapter: QuizChapter; themed: boolean; navigate: (href: string) => void; selected: string | null; mode: string | null }) {
  const questions = useMemo(() => chapterQuestions(quiz, chapter.id), [quiz, chapter.id])
  const total = questions.length
  const [attempt, setAttempt] = useState(() => readDiscoveryProgress(quiz.attemptKey))
  const answers = chapterAnswers(attempt, questions, quiz.edition)
  const complete = answers.length === total
  const firstOpen = questions.findIndex(({ id }) => !answers.some((answer) => answer.id === id))
  const lastReachable = firstOpen < 0 ? total - 1 : firstOpen
  // A link without a question opens the next one; stay on it after answering so the reveal shows.
  const [entered] = useState(() => (selected || complete ? null : questions[firstOpen].id))
  const current = selected ?? entered
  const requested = questions.findIndex(({ id }) => id === current)
  const index = Math.min(requested < 0 ? lastReachable : requested, lastReachable)
  const question = questions[index]
  const answer = answers.find(({ id }) => id === question.id)
  const view = (mode === 'results' || mode === 'review' || (!current && !mode)) && complete ? 'results' : 'question'
  // Opening a card replaces the focused link, so start on the question heading.
  const focusNext = useRef(true)
  const reduce = useReducedMotion()
  const link = (params: Record<string, string> = {}) => hrefFor('discover', { quiz: quiz.id, ...(themed && { chapter: chapter.id }), ...params })
  const ids = { quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id }

  useEffect(() => {
    try { localStorage.setItem(quiz.attemptKey, JSON.stringify(attempt)) } catch { /* Storage is optional. */ }
  }, [attempt, quiz.attemptKey])
  // The incoming heading mounts after the outgoing question's exit animation, so focus it on mount.
  const headline = (element: HTMLHeadingElement | null) => {
    if (element && focusNext.current) {
      element.focus({ preventScroll: true })
      focusNext.current = false
    }
  }

  const goTo = (position: number) => {
    if (position < 0 || position > lastReachable) return
    focusNext.current = true
    navigate(link({ q: questions[position].id, mode: 'challenge' }))
  }
  function restart() {
    track('quiz_restarted', ids)
    // Other chapters of the theme share this storage; only clear this one.
    // Start from what is stored, so a stale tab can't bring back answers another tab cleared.
    setAttempt(Object.fromEntries(Object.entries(readDiscoveryProgress(quiz.attemptKey))
      .filter(([id]) => !chapter.questionIds.includes(id))))
    focusNext.current = true
    navigate(link({ q: questions[0].id, mode: 'challenge' }))
  }
  function onPick(pick: string) {
    if (answer) return
    const points = scoreQuestion(question, pick) ?? 0
    const event = { ...ids, question_id: question.id, question_number: index + 1, points }
    track('quiz_question_answered', event)
    track('discovery_revealed', event)
    if (!answers.length && shareOrigin()) track('shared_quiz_started', { ...ids, ...shareProps() })
    if (answers.length + 1 === total) {
      const score = totalPoints(answers) + points
      track('quiz_completed', { ...ids, ...shareProps(), score, total_questions: total, max_points: total, score_pct: Math.round(score / total * 100),
        edition: quiz.edition, attempt_number: nextAttempt(`${quiz.id}/${chapter.id}`) })
      const theme = themeProgress(quiz)
      const others = theme.chapters.filter((entry) => entry.chapter.id !== chapter.id)
      if (hasChapterList(quiz) && others.length && others.every(({ state }) => state === 'completed')) {
        const combined = others.reduce((sum, entry) => sum + entry.points, score)
        track('theme_completed', { theme_id: quiz.id, quiz_id: quiz.id, ...shareProps(), score: combined, max_points: theme.total, score_pct: Math.round(combined / theme.total * 100),
          quiz_count: theme.chapters.length, theme_version: themeVersion(quiz), attempt_number: nextAttempt(quiz.id) })
      }
    }
    // Start from what other tabs saved; this tab only speaks for its own chapter, so a stale tab can't restore another chapter's cleared answers.
    setAttempt((current) => recordAnswer({ ...readDiscoveryProgress(quiz.attemptKey), ...Object.fromEntries(Object.entries(current).filter(([id]) => chapter.questionIds.includes(id))) },
      question.id, pick, quiz.edition))
  }

  const back = hrefFor('discover')
  const nav = (
    <nav className="discovery-reader-nav" aria-label="Quiz navigation">
      <a className="discovery-contents-trigger" href={back} onClick={follow(navigate, back)}>← All quizzes</a>
      {view === 'question' && answers.length > 0 && <button className="discovery-contents-trigger" type="button" onClick={() => {
        if (window.confirm('Start again? This clears your answers for this quiz.')) restart()
      }}>Start again</button>}
    </nav>
  )

  if (view === 'results') return (
    <div className="discover discover-edition discovery-reader chapter-quiz" style={{ '--accent': quiz.accent } as CSSProperties}>
      {nav}
      <Results quiz={quiz} chapter={chapter} questions={questions} attempt={attempt} restart={restart} navigate={navigate}
        openQuestion={(id) => { focusNext.current = true; navigate(link({ q: id, mode: 'challenge' })) }} />
    </div>
  )

  const next = questions[index + 1]
  const reactionIndex = quizQuestions(quiz).findIndex(({ id }) => id === question.id)
  return (
    <div className="discover discover-edition discovery-reader chapter-quiz" data-visual={question.visual}>
      {nav}
      <ol className="ch-rail" aria-label="Progress" style={{ '--steps': total } as CSSProperties}>
        {questions.map(({ id, short }, i) => {
          const done = answers.find((entry) => entry.id === id)
          return <li key={id}><button type="button" disabled={i > lastReachable} aria-current={i === index ? 'step' : undefined}
            aria-label={`Question ${i + 1}: ${short}${done ? `, ${formatPoints(done.points)} points` : ''}`} onClick={() => goTo(i)}>
            <i style={{ width: done ? `${Math.max(done.points, 0.08) * 100}%` : i === index ? '8%' : 0 }} className={done && done.points === 0 ? 'is-zero' : ''} />
          </button></li>
        })}
      </ol>
      <AnimatePresence mode="wait">
        <motion.article key={question.id} className="discovery-reading ch-question"
          initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <p className="discovery-kicker">Question {index + 1} of {total} · {question.short}</p>
          <h1 ref={headline} tabIndex={-1}>{question.question}</h1>
          {!(question.kind === 'choice' && question.warmup) && <p className="ch-prompt">{question.prompt}</p>}
          {question.kind === 'choice' && <ChoiceInput question={question} pick={answer?.pick} onPick={onPick} />}
          {question.kind === 'rows' && <RowsInput question={question} pick={answer?.pick} onPick={onPick} />}
          {question.kind === 'sliders' && <SlidersInput question={question} pick={answer?.pick} onPick={onPick} />}
          {question.kind === 'estimate' && <EstimateInput question={question} pick={answer?.pick} onPick={onPick} />}
          {answer && <Reveal question={question} pick={answer.pick} points={answer.points} index={reactionIndex}
            onEvidence={() => track('evidence_expanded', { ...ids, question_id: question.id })}
            explore={question.explore && (() => {
              const href = hrefFor('investigate', { r: question.explore.r, ...question.explore.years })
              return <a className="discovery-link ch-explore" href={href} onClick={(event) => {
                if (!plainClick(event)) return
                event.preventDefault()
                track('evidence_opened', { ...ids, question_id: question.id, from_quiz: true })
                navigate(href)
              }}>Explore why <span aria-hidden="true">→</span></a>
            })()} />}
          <div className="challenge-navigation">
            {index > 0 && <button className="discovery-contents-trigger" type="button" onClick={() => goTo(index - 1)}>← Previous</button>}
            {answer && <button className="challenge-primary challenge-continue" type="button"
              onClick={() => next ? goTo(index + 1) : navigate(link({ mode: 'results' }))}>
              {next ? 'Next question →' : 'See my results →'}
            </button>}
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  )
}
