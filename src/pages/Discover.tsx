import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from '../data/discoverEdition'
import { ChallengeResults } from '../components/ChallengeResults'
import { CHALLENGE_KEY, challengeAnswers, challengeReaction } from '../lib/discoveryChallenge'
import { DiscoveryInteraction } from '../components/DiscoveryInteraction'
import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { DISCOVERY_PROGRESS_KEY, readDiscoveryProgress, revealDiscovery } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'

const total = EDITORIAL_QUESTIONS.length
const number = (index: number) => String(index).padStart(2, '0')
const controls = 'a, button, input, select, textarea, [contenteditable], .discovery-reveal, [role="slider"]'

export function Discover({ navigate, selected, mode }: { navigate: (href: string) => void; selected: string | null; mode: string | null }) {
  const [progress, setProgress] = useState(readDiscoveryProgress)
  const [attempt, setAttempt] = useState(() => readDiscoveryProgress(CHALLENGE_KEY))
  const answers = challengeAnswers(attempt)
  const score = answers.filter(({ correct }) => correct).length
  const complete = answers.length === total
  const results = complete && (mode === 'results' || mode === 'review')
  const challenge = mode === 'challenge' || mode === 'results' || mode === 'review'
  const firstUnanswered = EDITORIAL_QUESTIONS.findIndex(({ id }) => !answers.some((answer) => answer.id === id))
  const lastReachable = firstUnanswered < 0 ? total - 1 : firstUnanswered
  const dialog = useRef<HTMLDialogElement>(null)
  const headline = useRef<HTMLHeadingElement>(null)
  const focusQuestion = useRef(false)
  const touch = useRef<{ id: number; x: number; y: number } | null>(null)
  const requested = EDITORIAL_QUESTIONS.findIndex(({ id }) => id === selected)
  const index = challenge ? Math.min(requested < 0 ? 0 : requested, lastReachable) : Math.max(0, requested)
  const entry = EDITORIAL_QUESTIONS[index]
  const next = EDITORIAL_QUESTIONS[index + 1]
  const teaser = DISCOVER_TEASERS[entry.id]
  const activeProgress = challenge ? attempt : progress
  const setActiveProgress = challenge ? setAttempt : setProgress
  const recorded = activeProgress[entry.id]
  const visit = recorded?.edition === DISCOVERY_QUIZ_EDITION && (!challenge || answers.some(({ id }) => id === entry.id)) ? recorded : undefined
  const explored = EDITORIAL_QUESTIONS.filter(({ id }) => Object.hasOwn(progress, id)).length
  const completed = explored === total

  useEffect(() => {
    try {
      localStorage.setItem(DISCOVERY_PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // The reader remains usable if storage is unavailable.
    }
  }, [progress])

  useEffect(() => {
    try { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(attempt)) } catch { /* Storage is optional. */ }
  }, [attempt])

  useEffect(() => {
    if (focusQuestion.current) {
      headline.current?.focus({ preventScroll: true })
      focusQuestion.current = false
    }
  }, [challenge, entry.id, results])

  const goTo = useCallback((position: number) => {
    const question = EDITORIAL_QUESTIONS[position]
    if (!question || position === index || (challenge && position > lastReachable)) return
    focusQuestion.current = true
    navigate(hrefFor('discover', { q: question.id, mode: challenge ? 'challenge' : undefined }))
  }, [challenge, index, lastReachable, navigate])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (results) return
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        dialog.current?.open || (event.target instanceof Element && event.target.closest(controls))) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(index + (event.key === 'ArrowRight' ? 1 : -1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo, index, results])

  function startSwipe(event: PointerEvent<HTMLElement>) {
    touch.current = null
    if (event.pointerType !== 'touch' || !event.isPrimary || (event.target as Element).closest(controls)) return
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
      navigate(href)
    }}>{label} <span aria-hidden="true">→</span></a>
  )
  const record = (
    <>
      <p>{explored} of {total} discoveries explored</p>

    </>
  )

  function openChallenge() {
    focusQuestion.current = true
    navigate(complete ? hrefFor('discover', { mode: 'results' })
      : hrefFor('discover', { mode: 'challenge', q: EDITORIAL_QUESTIONS[lastReachable].id }))
  }

  function restart() {
    setAttempt({})
    focusQuestion.current = true
    navigate(hrefFor('discover', { mode: 'challenge', q: EDITORIAL_QUESTIONS[0].id }))
  }

  return (
    <div className="discover discover-edition discovery-reader">
      <nav className="discovery-reader-nav" aria-label="Discovery navigation">
        <button className="discovery-contents-trigger" type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>All discoveries</button>
        {!challenge && <button className="discovery-contents-trigger" type="button" onClick={openChallenge}>
          {complete ? 'Challenge results' : answers.length ? 'Resume challenge' : 'Take the challenge'}
        </button>}
        {!results && <div className="discovery-pager">
          <button type="button" aria-label="Previous discovery" disabled={index === 0} onClick={() => goTo(index - 1)}>←</button>
          <span className="discovery-position" aria-label={`Discovery ${index + 1} of ${total}`}>{number(index + 1)} / {number(total)}</span>
          <button type="button" aria-label="Next discovery" disabled={!next || (challenge && index >= lastReachable)} onClick={() => goTo(index + 1)}>→</button>
        </div>}
      </nav>

      {results ? <ChallengeResults answers={answers} review={mode === 'review'} navigate={navigate} restart={restart} /> :
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
                reaction={challenge && visit ? challengeReaction(index, visit.pick === teaser.interaction.answer) : undefined}
                onReveal={(pick, answer) => setActiveProgress((current) => revealDiscovery(current, entry.id, pick, answer, DISCOVERY_QUIZ_EDITION))}
                onClose={() => setActiveProgress((current) => ({ ...current, [entry.id]: { ...visit!, closed: true } }))} />
            : evidenceLink()}
        </div>

        {challenge && visit && !visit.closed && (next || complete) && (
          <button className="challenge-primary challenge-continue" type="button"
            onClick={() => next ? goTo(index + 1) : navigate(hrefFor('discover', { mode: 'results' }))}>
            {next ? 'Next question →' : 'See my results →'}
          </button>
        )}
        {!challenge && visit && !visit.closed && next && (
          <button className="discovery-next-preview" type="button" onClick={() => goTo(index + 1)}>
            <span className="discovery-kicker">Up next</span>
            <span className="discovery-preview-title">{DISCOVER_TEASERS[next.id]?.interaction?.label ?? next.question}</span>
            <span className="discovery-preview-link">Discover <span aria-hidden="true">→</span></span>
          </button>
        )}
        {!challenge && !next && (visit || completed) && (
          <section className="discovery-finish" aria-labelledby="discovery-finish-title">
            <h2 id="discovery-finish-title">{completed ? `You’ve explored all ${total} discoveries.` : 'Your detective record'}</h2>
            {record}
            <button className="discovery-clue" type="button" onClick={() => dialog.current?.showModal()}>
              {completed ? 'Revisit discoveries' : 'All discoveries'} <span aria-hidden="true">→</span>
            </button>
          </section>
        )}
      </article>}

      <dialog ref={dialog} className="discovery-contents" aria-labelledby="discovery-contents-title">
        <div className="discovery-contents-heading">
          <h2 id="discovery-contents-title">All discoveries</h2>
          <button className="discovery-clue" type="button" onClick={() => dialog.current?.close()}>Close</button>
        </div>
        <div className="discovery-record">
          <h3 className="discovery-kicker">Your detective record</h3>
          {record}
        </div>
        <ol>
          {EDITORIAL_QUESTIONS.map(({ id, question }, position) => (
            <li key={id}><button type="button" aria-current={index === position ? 'step' : undefined}
              onClick={() => {
                dialog.current?.close()
                if (challenge) navigate(hrefFor('discover', { q: id }))
                else goTo(position)
              }}>
              <span className="discovery-position" aria-hidden="true">{number(position + 1)}</span>
              <span>{DISCOVER_TEASERS[id]?.interaction?.label ?? question}</span>
              {Object.hasOwn(progress, id) && <span className="discovery-explored">Explored</span>}
            </button></li>
          ))}
        </ol>
      </dialog>
    </div>
  )
}
