import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ChapterQuestion, Side } from '../data/menWomen'
import { DEFAULT_QUIZ, type Quiz } from '../data/quizzes'
import { FindingVisual, useCount } from '../components/chapter/Visuals'
import { SIDES, chapterAnswers, chapterQuestions, recordAnswer, chapterResult, formatPoints, parseRows, parseSliders, scoreQuestion, totalPoints } from '../lib/chapterScore'
import { readDiscoveryProgress, type DiscoveryProgress } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'

const plainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

const sideLabel: Record<Side, string> = { men: 'Men', similar: 'Similar', women: 'Women' }

function Verdict({ question, pick, points }: { question: ChapterQuestion; pick: string; points: number }) {
  const choice = question.kind === 'choice' ? question.options.find(({ id }) => id === pick)?.label : undefined
  const line = points === 1 ? 'You called it.' : points > 0 ? 'Partly right.' : 'Plot twist.'
  const detail = question.kind === 'choice'
    ? points === 1 ? 'Your instinct matched the evidence.' : `You predicted: ${choice?.toLowerCase()}.`
    : question.kind === 'rows' ? `${parseRows(question, pick)!.filter((side, i) => side === question.rows[i].answer).length} of 4 predictions matched.`
      : (() => { const g = parseSliders(question, pick)!; return `You guessed ${g.men}% of men and ${g.women}% of women.` })()
  return (
    <p className={`ch-verdict ${points === 1 ? 'is-right' : points > 0 ? 'is-partial' : 'is-wrong'}`}>
      <strong>{line}</strong> {detail} <span className="ch-points">+{formatPoints(points)} {points === 1 ? 'point' : 'points'}</span>
    </p>
  )
}

function ChoiceInput({ question, pick, onPick }: { question: Extract<ChapterQuestion, { kind: 'choice' }>; pick?: string; onPick: (pick: string) => void }) {
  return (
    <div className={`ch-options${pick ? ' is-revealed' : ''}`} role="group" aria-label="Your prediction">
      {question.options.map(({ id, label }, i) => {
        const state = !pick ? '' : id === question.answer ? ' is-answer' : id === pick ? ' is-pick' : ' is-other'
        return (
          <button key={id} type="button" className={`ch-option${state}`} disabled={!!pick} aria-pressed={pick === id} onClick={() => onPick(id)}>
            <span className="ch-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
            <span>{label}</span>
            {pick && id === question.answer && <span className="ch-mark" aria-label="Correct answer">✓</span>}
            {pick && id === pick && id !== question.answer && <span className="ch-mark" aria-label="Your answer">✗</span>}
          </button>
        )
      })}
    </div>
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
                {sideLabel[side]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" className="challenge-primary ch-reveal" disabled={!ready} onClick={() => onPick(draft.join(','))}>
        {ready ? 'Reveal the results →' : `Make all four predictions (${draft.filter(Boolean).length}/4)`}
      </button>
    </div>
  )
}

function Slider({ label, tone, value, onChange }: { label: string; tone: 'men' | 'women'; value?: number; onChange: (value: number) => void }) {
  return (
    <label className={`ch-slider v-${tone}`}>
      <span className="ch-slider-head"><span>{label}</span><span className="ch-slider-value">{value === undefined ? '—' : `${value}%`}</span></span>
      <input type="range" min={0} max={100} step={1} value={value ?? 50} aria-valuetext={value === undefined ? 'Not set' : `${value} percent`}
        className={value === undefined ? 'is-unset' : ''} onChange={(event) => onChange(Number(event.target.value))}
        onPointerDown={() => value === undefined && onChange(50)} />
      <span className="ch-people" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => <i key={i} className={value !== undefined && i < Math.round(value / 5) ? 'on' : ''} />)}
      </span>
    </label>
  )
}

function SlidersInput({ question, pick, onPick }: { question: Extract<ChapterQuestion, { kind: 'sliders' }>; pick?: string; onPick: (pick: string) => void }) {
  const [men, setMen] = useState<number>()
  const [women, setWomen] = useState<number>()
  if (pick) return null
  const ready = men !== undefined && women !== undefined
  return (
    <div className="ch-sliders">
      <p className="ch-scenario">{question.scenario}</p>
      <Slider label="Men" tone="men" value={men} onChange={setMen} />
      <Slider label="Women" tone="women" value={women} onChange={setWomen} />
      <button type="button" className="challenge-primary ch-reveal" disabled={!ready} onClick={() => onPick(`${men},${women}`)}>
        {ready ? 'Lock in my estimates →' : 'Set both estimates'}
      </button>
    </div>
  )
}

function Reveal({ question, pick, points, onEvidence }: { question: ChapterQuestion; pick: string; points: number; onEvidence: () => void }) {
  const reduce = useReducedMotion()
  const { evidence } = question
  return (
    <motion.section className="ch-reveal-panel" aria-live="polite" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <Verdict question={question} pick={pick} points={points} />
      <p className="ch-finding">{question.finding}</p>
      <div className="ch-visual"><FindingVisual question={question} pick={pick} /></div>
      <p className="ch-takeaway">{question.takeaway}</p>
      <details className="ch-evidence" onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) onEvidence() }}>
        <summary>How we know</summary>
        <dl>
          <dt>Study</dt><dd><a href={evidence.url} target="_blank" rel="noreferrer">{evidence.citation} ↗</a></dd>
          <dt>Who</dt><dd>{evidence.sample}</dd>
          <dt>Method</dt><dd>{evidence.method}</dd>
          <dt>Limits</dt><dd>{evidence.limitation}</dd>
        </dl>
      </details>
    </motion.section>
  )
}

function Results({ quiz, questions, attempt, restart, navigate, openQuestion }: {
  openQuestion: (id: string) => void
  quiz: Quiz; questions: ChapterQuestion[]; attempt: DiscoveryProgress; restart: () => void; navigate: (href: string) => void
}) {
  const answers = chapterAnswers(attempt, questions, quiz.edition)
  const points = totalPoints(answers)
  const shown = useCount(points, 0, 1300, 200)
  const [status, setStatus] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const chapter = quiz.chapters[0]
  useEffect(() => { heading.current?.focus() }, [])

  async function share() {
    track('share_clicked', { quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id, score: points, total_questions: questions.length })
    const url = new URL(window.location.href)
    url.hash = hrefFor('discover', { quiz: quiz.id })
    const text = `I scored ${formatPoints(points)}/${questions.length} on “${chapter.title}” in Data Detective. ${quiz.prompt}`
    if (navigator.share) {
      try { await navigator.share({ text, url: url.href }); return } catch (error) { if (error instanceof Error && error.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(`${text}\n${url.href}`); setStatus('Copied to clipboard.') } catch { window.prompt('Copy your result:', `${text}\n${url.href}`) }
  }

  const other = hrefFor('discover', { quiz: DEFAULT_QUIZ.id })
  return (
    <section className="discovery-reading ch-results">
      <p className="discovery-kicker">{chapter.title} · Results</p>
      <h1 ref={heading} tabIndex={-1}>{chapterResult(points, questions.length)}</h1>
      <p className="ch-score" aria-label={`${formatPoints(points)} out of ${questions.length} points`}>
        <span className="ch-score-big">{formatPoints(Math.round(shown * 4) / 4)}</span><span className="ch-score-of">/ {questions.length}</span>
      </p>
      <ol className="ch-tally">
        {questions.map((question, i) => {
          const answer = answers.find(({ id }) => id === question.id)
          const p = answer?.points ?? 0
          return (
            <li key={question.id}>
              <a href={hrefFor('discover', { quiz: quiz.id, q: question.id })} onClick={(event) => { if (!plainClick(event)) return; event.preventDefault(); openQuestion(question.id) }}>
                <span className="ch-tally-bar" aria-hidden="true"><motion.i initial={{ height: 0 }} animate={{ height: `${p * 100}%` }} transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }} /></span>
                <span className="ch-tally-num">{i + 1}</span>
                <span className="ch-tally-label">{question.short}</span>
                <span className="ch-tally-points">{formatPoints(p)}</span>
              </a>
            </li>
          )
        })}
      </ol>
      <p className="discovery-note">One point per question. Being single: ¼ point per correct prediction. Emotional support: ½ point per estimate within 5 points of the real figure, ¼ within 15.</p>
      <div className="ch-actions">
        <button className="challenge-primary" type="button" onClick={share}>Share my result ↗</button>
        <a className="discovery-link" href={other} onClick={(event) => {
          if (!plainClick(event)) return
          event.preventDefault()
          track('another_quiz_started', { quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id, target_quiz_id: DEFAULT_QUIZ.id })
          navigate(other)
        }}>Try “{DEFAULT_QUIZ.title}” →</a>
        <button className="discovery-clue" type="button" onClick={restart}>Play again</button>
      </div>
      <p className="discovery-note" role="status">{status}</p>
    </section>
  )
}

export function ChapterQuiz({ quiz, navigate, selected, mode }: { quiz: Quiz; navigate: (href: string) => void; selected: string | null; mode: string | null }) {
  const questions = useMemo(() => chapterQuestions(quiz), [quiz])
  const chapter = quiz.chapters[0]
  const total = questions.length
  const [attempt, setAttempt] = useState(() => readDiscoveryProgress(quiz.attemptKey))
  const answers = chapterAnswers(attempt, questions, quiz.edition)
  const complete = answers.length === total
  const firstOpen = questions.findIndex(({ id }) => !answers.some((answer) => answer.id === id))
  const lastReachable = firstOpen < 0 ? total - 1 : firstOpen
  const requested = questions.findIndex(({ id }) => id === selected)
  const index = Math.min(requested < 0 ? lastReachable : requested, lastReachable)
  const question = questions[index]
  const answer = answers.find(({ id }) => id === question.id)
  const view = mode === 'results' && complete ? 'results' : selected || mode === 'challenge' ? 'question' : 'welcome'
  const focusNext = useRef(false)
  const reduce = useReducedMotion()
  const link = (params: Record<string, string> = {}) => hrefFor('discover', { quiz: quiz.id, ...params })
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
    navigate(link({ q: questions[position].id }))
  }
  function start() {
    focusNext.current = true
    track(complete ? 'quiz_results_opened' : answers.length ? 'quiz_resumed' : 'quiz_started', { ...ids, answered_count: answers.length })
    navigate(complete ? link({ mode: 'results' }) : link({ q: questions[lastReachable].id }))
  }
  function restart() {
    track('quiz_restarted', ids)
    setAttempt({})
    focusNext.current = true
    navigate(link({ q: questions[0].id }))
  }
  function onPick(pick: string) {
    if (answer) return
    const points = scoreQuestion(question, pick) ?? 0
    const event = { ...ids, question_id: question.id, question_number: index + 1, points }
    track('quiz_question_answered', event)
    track('discovery_revealed', event)
    if (answers.length + 1 === total) track('quiz_completed', { ...ids, score: totalPoints(answers) + points, total_questions: total })
    // Merge what other tabs saved so a stale tab never overwrites newer answers.
    setAttempt((current) => recordAnswer({ ...readDiscoveryProgress(quiz.attemptKey), ...current }, question.id, pick, quiz.edition))
  }

  const home = hrefFor('discover')
  const nav = (
    <nav className="discovery-reader-nav" aria-label="Quiz navigation">
      <a className="discovery-contents-trigger" href={view === 'welcome' ? home : link()} onClick={(event) => {
        if (!plainClick(event)) return
        event.preventDefault()
        navigate(view === 'welcome' ? home : link())
      }}>{view === 'welcome' ? '← All quizzes' : '← Quiz home'}</a>
      {view === 'question' && answers.length > 0 && <button className="discovery-contents-trigger" type="button" onClick={() => {
        if (window.confirm('Start again? This clears your answers for this quiz.')) restart()
      }}>Start again</button>}
    </nav>
  )

  if (view === 'welcome') return (
    <div className="discover discover-edition discovery-reader chapter-quiz">
      {nav}
      <section className="discovery-reading discovery-welcome ch-welcome">
        <p className="discovery-kicker">Chapter 1 · {chapter.title}</p>
        <h1 tabIndex={-1}>{quiz.prompt}</h1>
        <p className="ch-description">{chapter.description}</p>
        <p className="ch-steps" aria-label="Predict. Reveal. Rethink."><span>Predict.</span> <span>Reveal.</span> <span>Rethink.</span></p>
        <p className="discovery-context">{total} questions · about {chapter.minutes} minutes · one point each, with partial credit on two.</p>
        <div className="discovery-welcome-actions">
          <button className="challenge-primary" type="button" onClick={start}>
            {complete ? 'See my results' : answers.length ? `Resume · question ${lastReachable + 1}` : 'Start the quiz'} →
          </button>
        </div>
      </section>
    </div>
  )

  if (view === 'results') return (
    <div className="discover discover-edition discovery-reader chapter-quiz">
      {nav}
      <Results quiz={quiz} questions={questions} attempt={attempt} restart={restart} navigate={navigate}
        openQuestion={(id) => { focusNext.current = true; navigate(hrefFor('discover', { quiz: quiz.id, q: id })) }} />
    </div>
  )

  const next = questions[index + 1]
  return (
    <div className="discover discover-edition discovery-reader chapter-quiz" data-visual={question.visual}>
      {nav}
      <ol className="ch-rail" aria-label="Progress">
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
          <p className="ch-prompt">{question.prompt}</p>
          {question.kind === 'choice' && <ChoiceInput question={question} pick={answer?.pick} onPick={onPick} />}
          {question.kind === 'rows' && <RowsInput question={question} pick={answer?.pick} onPick={onPick} />}
          {question.kind === 'sliders' && <SlidersInput question={question} pick={answer?.pick} onPick={onPick} />}
          {answer && <Reveal question={question} pick={answer.pick} points={answer.points}
            onEvidence={() => track('evidence_expanded', { ...ids, question_id: question.id })} />}
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
