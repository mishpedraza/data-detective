import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { DISCOVER_TEASERS } from '../data/discoverEdition'
import { ChallengeResults } from '../components/ChallengeResults'
import { challengeAnswers, challengeReaction } from '../lib/discoveryChallenge'
import { DiscoveryInteraction } from '../components/DiscoveryInteraction'
import { quizQuestions, type Quiz } from '../data/quizzes'
import { DISCOVERY_PROGRESS_KEY, readDiscoveryProgress, revealDiscovery } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'

const controls = 'a, button, input, select, textarea, [contenteditable], .discovery-reveal, [role="slider"]'

export function Discover({ quiz, navigate, selected, mode }: { quiz: Quiz; navigate: (href: string) => void; selected: string | null; mode: string | null }) {
  const questions = useMemo(() => quizQuestions(quiz), [quiz])
  const total = questions.length
  const link = useCallback((params: Record<string, string> = {}) => hrefFor('discover', { quiz: quiz.id, ...params }), [quiz.id])
  const [shareCopied, setShareCopied] = useState(false)
  const [progress, setProgress] = useState(readDiscoveryProgress)
  const [attempt, setAttempt] = useState(() => readDiscoveryProgress(quiz.attemptKey))
  const answers = challengeAnswers(attempt, quiz)
  const score = answers.filter(({ correct }) => correct).length
  const complete = answers.length === total
  const results = complete && (mode === 'results' || mode === 'review')
  const challenge = mode === 'challenge' || mode === 'results' || mode === 'review'
  const browse = mode === 'browse' || (!challenge && selected !== null)
  const welcome = !challenge && !browse
  const firstUnanswered = questions.findIndex(({ id }) => !answers.some((answer) => answer.id === id))
  const lastReachable = firstUnanswered < 0 ? total - 1 : firstUnanswered
  const dialog = useRef<HTMLDialogElement>(null)
  const headline = useRef<HTMLHeadingElement>(null)
  const focusQuestion = useRef(false)
  const touch = useRef<{ id: number; x: number; y: number } | null>(null)
  const requested = questions.findIndex(({ id }) => id === selected)
  const index = challenge ? Math.min(requested < 0 ? 0 : requested, lastReachable) : Math.max(0, requested)
  const entry = questions[index]
  const next = questions[index + 1]
  const teaser = DISCOVER_TEASERS[entry.id]
  const activeProgress = challenge ? attempt : progress
  const setActiveProgress = challenge ? setAttempt : setProgress
  const recorded = activeProgress[entry.id]
  const visit = recorded?.edition === quiz.edition && (!challenge || answers.some(({ id }) => id === entry.id)) ? recorded : undefined

  useEffect(() => {
    try {
      localStorage.setItem(DISCOVERY_PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // The reader remains usable if storage is unavailable.
    }
  }, [progress])

  useEffect(() => {
    try { localStorage.setItem(quiz.attemptKey, JSON.stringify(attempt)) } catch { /* Storage is optional. */ }
  }, [attempt, quiz.attemptKey])

  useEffect(() => {
    if (focusQuestion.current) {
      headline.current?.focus({ preventScroll: true })
      focusQuestion.current = false
    }
  }, [challenge, entry.id, results, welcome])

  const goTo = useCallback((position: number) => {
    const question = questions[position]
    if (!question || position === index || (challenge && position > lastReachable)) return
    focusQuestion.current = true
    navigate(link({ q: question.id, mode: challenge ? 'challenge' : 'browse' }))
  }, [questions, challenge, index, lastReachable, navigate, link])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!browse) return
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        dialog.current?.open || (event.target instanceof Element && event.target.closest(controls))) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(index + (event.key === 'ArrowRight' ? 1 : -1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [browse, goTo, index])

  function startSwipe(event: PointerEvent<HTMLElement>) {
    touch.current = null
    if (!browse || event.pointerType !== 'touch' || !event.isPrimary || (event.target as Element).closest(controls)) return
    touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }

  function finishSwipe(event: PointerEvent<HTMLElement>) {
    const start = touch.current
    touch.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) >= 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) goTo(index + (dx < 0 ? 1 : -1))
  }

  const href = hrefFor('investigate', { r: entry.id, ...teaser?.years })
  const evidenceLink = (label = 'Explore the evidence') => (
    <a className="discovery-link discovery-open" href={href} onClick={(event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      track('evidence_opened', { quiz_id: quiz.id, question_id: entry.id, from_quiz: challenge })
      navigate(href)
    }}>{label} <span aria-hidden="true">→</span></a>
  )
  function openChallenge() {
    track(complete ? 'quiz_results_opened' : answers.length ? 'quiz_resumed' : 'quiz_started', { quiz_id: quiz.id, answered_count: answers.length })
    focusQuestion.current = true
    navigate(complete ? link({ mode: 'results' })
      : link({ mode: 'challenge', q: questions[lastReachable].id }))
  }

  function restart() {
    track('quiz_restarted', { quiz_id: quiz.id })
    setAttempt({})
    focusQuestion.current = true
    navigate(link({ mode: 'challenge', q: questions[0].id }))
  }

  if (welcome) return (
    <div className="discover discover-edition discovery-reader">
      <nav className="discovery-reader-nav" aria-label="Quiz navigation">
        <a className="discovery-contents-trigger" href={hrefFor('discover')} onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          navigate(hrefFor('discover'))
        }}>← All quizzes</a>
      </nav>
      <section className="discovery-reading discovery-welcome">
        <h1 ref={headline} tabIndex={-1}>{quiz.prompt}</h1>
        <p className="discovery-context">{total} questions.{quiz.tagline && ` ${quiz.tagline}`}</p>
        <div className="discovery-welcome-actions">
          <button className="challenge-primary" type="button" onClick={openChallenge}>
            {complete ? 'See challenge results' : answers.length ? 'Resume the challenge' : 'Take the challenge'} →
          </button>
          <a className="discovery-link" href={link({ mode: 'browse' })} onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            focusQuestion.current = true
            navigate(link({ mode: 'browse' }))
          }}>Or browse all discoveries →</a>
          <button className="discovery-contents-trigger" type="button" onClick={async () => {
            const shareUrl = new URL(`${import.meta.env.BASE_URL}${link()}`, window.location.origin).href
            try {
              await navigator.clipboard.writeText(shareUrl)
              setShareCopied(true)
            } catch {
              window.prompt('Copy this link to share Data Detective:', shareUrl)
            }
          }}>{shareCopied ? 'Link copied ✓' : 'Copy link to share'}</button>
        </div>
      </section>
    </div>
  )

  return (
    <div className="discover discover-edition discovery-reader">
      <nav className="discovery-reader-nav" aria-label="Discovery navigation">
        <button className="discovery-contents-trigger" type="button" onClick={() => {
          focusQuestion.current = true
          navigate(link())
        }}>← Quiz home</button>
        {browse && <button className="discovery-contents-trigger" type="button" aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}>All discoveries</button>}
        {challenge && !results && answers.length > 0 && (
          <button className="discovery-contents-trigger" type="button" onClick={() => {
            if (window.confirm('Reset the quiz? This clears your answers and score for this attempt.')) restart()
          }}>Reset quiz</button>
        )}
        {browse && <div className="discovery-pager">
          <button type="button" aria-label="Previous discovery" disabled={index === 0} onClick={() => goTo(index - 1)}>←</button>
          <button type="button" aria-label="Next discovery" disabled={!next} onClick={() => goTo(index + 1)}>→</button>
        </div>}
      </nav>

      {results ? <ChallengeResults quiz={quiz} answers={answers} review={mode === 'review'} navigate={navigate} restart={restart} /> :
      <article className="discovery-reading" key={entry.id} onPointerDown={startSwipe} onPointerUp={finishSwipe}
        onPointerCancel={() => { touch.current = null }}>
        {challenge && <div className="challenge-progress">
          <span>Question {index + 1} of {total}</span>
          <span role="status">{score} correct so far</span>
        </div>}
        <h1 ref={headline} tabIndex={-1}>{teaser?.interaction?.label ?? entry.question}</h1>
        <div className="discovery-card-evidence">
          {teaser?.context && <p className="discovery-context">{teaser.context}</p>}
          {teaser?.interaction
            ? <DiscoveryInteraction interaction={teaser.interaction} evidenceLink={evidenceLink} visit={visit}
                reaction={challenge && visit ? challengeReaction(index, visit.pick === teaser.interaction.answer, visit.reactionVariant) : undefined}
                onReveal={(pick, answer) => {
                  const variant = challenge && answer !== undefined ? (Math.random() < 0.5 ? 0 : 1) : undefined
                  if (challenge && answer !== undefined && !visit) {
                    track('quiz_question_answered', { quiz_id: quiz.id, question_id: entry.id, question_number: index + 1, correct: pick === answer })
                    if (answers.length + 1 === total) track('quiz_completed', { quiz_id: quiz.id, score: score + Number(pick === answer), total_questions: total })
                  }
                  setActiveProgress((current) => revealDiscovery(current, entry.id, pick, answer, quiz.edition, variant))
                }}
                onClose={() => setActiveProgress((current) => ({ ...current, [entry.id]: { ...visit!, closed: true } }))} />
            : evidenceLink()}
        </div>

        {challenge && !results && (
          <div className="challenge-navigation">
            {index > 0 && (
              <button className="discovery-contents-trigger" type="button" onClick={() => goTo(index - 1)}>
                ← Previous question
              </button>
            )}
            {visit && !visit.closed && (next || complete) && (
              <button className="challenge-primary challenge-continue" type="button"
                onClick={() => next ? goTo(index + 1) : navigate(link({ mode: 'results' }))}>
                {next ? 'Next question →' : 'See my results →'}
              </button>
            )}
          </div>
        )}
        {!challenge && visit && !visit.closed && next && (
          <button className="discovery-next-preview" type="button" onClick={() => goTo(index + 1)}>
            <span className="discovery-kicker">Up next</span>
            <span className="discovery-preview-title">{DISCOVER_TEASERS[next.id]?.interaction?.label ?? next.question}</span>
            <span className="discovery-preview-link">Discover <span aria-hidden="true">→</span></span>
          </button>
        )}
      </article>}

      {browse && <dialog ref={dialog} className="discovery-contents" aria-labelledby="discovery-contents-title">
        <div className="discovery-contents-heading">
          <h2 id="discovery-contents-title">All discoveries</h2>
          <button className="discovery-clue" type="button" onClick={() => dialog.current?.close()}>Close</button>
        </div>
        <ol>
          {questions.map(({ id, question }, position) => (
            <li key={id}><button type="button" aria-current={index === position ? 'step' : undefined}
              onClick={() => {
                dialog.current?.close()
                goTo(position)
              }}>
              <span>{DISCOVER_TEASERS[id]?.interaction?.label ?? question}</span>
            </button></li>
          ))}
        </ol>
      </dialog>}
    </div>
  )
}
