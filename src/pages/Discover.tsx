import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { DISCOVER_TEASERS } from '../data/discoverEdition'
import { DiscoveryInteraction } from '../components/DiscoveryInteraction'
import { quizQuestions, type Quiz } from '../data/quizzes'
import { DISCOVERY_PROGRESS_KEY, readDiscoveryProgress, revealDiscovery } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'

const controls = 'a, button, input, select, textarea, [contenteditable], .discovery-reveal, [role="slider"]'

/** Browses every discovery of a quiz without scoring; the quiz itself plays in the chapter player. */
export function Discover({ quiz, navigate, selected }: { quiz: Quiz; navigate: (href: string) => void; selected: string | null }) {
  const questions = useMemo(() => quizQuestions(quiz), [quiz])
  const link = useCallback((params: Record<string, string> = {}) => hrefFor('discover', { quiz: quiz.id, ...params }), [quiz.id])
  const [progress, setProgress] = useState(readDiscoveryProgress)
  const dialog = useRef<HTMLDialogElement>(null)
  const headline = useRef<HTMLHeadingElement>(null)
  const focusQuestion = useRef(false)
  const touch = useRef<{ id: number; x: number; y: number } | null>(null)
  const index = Math.max(0, questions.findIndex(({ id }) => id === selected))
  const entry = questions[index]
  const next = questions[index + 1]
  const teaser = DISCOVER_TEASERS[entry.id]
  const recorded = progress[entry.id]
  const visit = recorded?.edition === quiz.edition ? recorded : undefined

  useEffect(() => {
    try {
      localStorage.setItem(DISCOVERY_PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // The reader remains usable if storage is unavailable.
    }
  }, [progress])

  useEffect(() => {
    if (focusQuestion.current) {
      headline.current?.focus({ preventScroll: true })
      focusQuestion.current = false
    }
  }, [entry.id])

  const goTo = useCallback((position: number) => {
    const question = questions[position]
    if (!question || position === index) return
    focusQuestion.current = true
    navigate(link({ q: question.id, mode: 'browse' }))
  }, [questions, index, navigate, link])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        dialog.current?.open || (event.target instanceof Element && event.target.closest(controls))) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(index + (event.key === 'ArrowRight' ? 1 : -1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo, index])

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
      track('evidence_opened', { quiz_id: quiz.id, question_id: entry.id, from_quiz: false })
      navigate(href)
    }}>{label} <span aria-hidden="true">→</span></a>
  )

  return (
    <div className="discover discover-edition discovery-reader">
      <nav className="discovery-reader-nav" aria-label="Discovery navigation">
        <button className="discovery-contents-trigger" type="button" onClick={() => navigate(hrefFor('discover'))}>← All quizzes</button>
        <button className="discovery-contents-trigger" type="button" aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}>All discoveries</button>
        <div className="discovery-pager">
          <button type="button" aria-label="Previous discovery" disabled={index === 0} onClick={() => goTo(index - 1)}>←</button>
          <button type="button" aria-label="Next discovery" disabled={!next} onClick={() => goTo(index + 1)}>→</button>
        </div>
      </nav>

      <article className="discovery-reading" key={entry.id} onPointerDown={startSwipe} onPointerUp={finishSwipe}
        onPointerCancel={() => { touch.current = null }}>
        <h1 ref={headline} tabIndex={-1}>{teaser?.interaction?.label ?? entry.question}</h1>
        <div className="discovery-card-evidence">
          {teaser?.context && <p className="discovery-context">{teaser.context}</p>}
          {teaser?.interaction
            ? <DiscoveryInteraction interaction={teaser.interaction} evidenceLink={evidenceLink} visit={visit}
                onReveal={(pick, answer) => setProgress((current) => revealDiscovery(current, entry.id, pick, answer, quiz.edition))}
                onClose={() => setProgress((current) => ({ ...current, [entry.id]: { ...visit!, closed: true } }))} />
            : evidenceLink()}
        </div>
        {visit && !visit.closed && next && (
          <button className="discovery-next-preview" type="button" onClick={() => goTo(index + 1)}>
            <span className="discovery-kicker">Up next</span>
            <span className="discovery-preview-title">{DISCOVER_TEASERS[next.id]?.interaction?.label ?? next.question}</span>
            <span className="discovery-preview-link">Discover <span aria-hidden="true">→</span></span>
          </button>
        )}
      </article>

      <dialog ref={dialog} className="discovery-contents" aria-labelledby="discovery-contents-title">
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
      </dialog>
    </div>
  )
}
