import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { DISCOVER_TEASERS } from '../data/discoverEdition'
import { DiscoveryInteraction } from '../components/DiscoveryInteraction'
import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { DISCOVERY_PROGRESS_KEY, readDiscoveryProgress, revealDiscovery } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'

const total = EDITORIAL_QUESTIONS.length
const number = (index: number) => String(index).padStart(2, '0')
const controls = 'a, button, input, select, textarea, [contenteditable], .discovery-reveal, [role="slider"]'

export function Discover({ navigate, selected }: { navigate: (href: string) => void; selected: string | null }) {
  const [progress, setProgress] = useState(readDiscoveryProgress)
  const dialog = useRef<HTMLDialogElement>(null)
  const headline = useRef<HTMLHeadingElement>(null)
  const focusQuestion = useRef(false)
  const touch = useRef<{ id: number; x: number; y: number } | null>(null)
  const index = Math.max(0, EDITORIAL_QUESTIONS.findIndex(({ id }) => id === selected))
  const entry = EDITORIAL_QUESTIONS[index]
  const next = EDITORIAL_QUESTIONS[index + 1]
  const teaser = DISCOVER_TEASERS[entry.id]
  const visit = progress[entry.id]
  const explored = EDITORIAL_QUESTIONS.filter(({ id }) => Object.hasOwn(progress, id)).length
  const predictions = EDITORIAL_QUESTIONS.flatMap(({ id }) => {
    const result = progress[id]?.correct
    return DISCOVER_TEASERS[id]?.interaction?.kind === 'prediction' && typeof result === 'boolean' ? [result] : []
  })
  const correct = predictions.filter(Boolean).length
  const completed = explored === total

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
    const question = EDITORIAL_QUESTIONS[position]
    if (!question || position === index) return
    focusQuestion.current = true
    navigate(hrefFor('discover', { q: question.id }))
  }, [index, navigate])

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
  const evidenceLink = () => (
    <a className="discovery-link discovery-open" href={href} onClick={(event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      navigate(href)
    }}>Explore the evidence <span aria-hidden="true">→</span></a>
  )
  const record = (
    <>
      <p>{explored} of {total} discoveries explored</p>
      {predictions.length > 0 && <p>{correct} of {predictions.length} predictions correct</p>}
    </>
  )

  return (
    <div className="discover discover-edition discovery-reader">
      <nav className="discovery-reader-nav" aria-label="Discovery navigation">
        <button type="button" onClick={() => dialog.current?.showModal()}>Browse all questions</button>
        <div className="discovery-pager">
          <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)}><span aria-hidden="true">← </span>Previous</button>
          <span className="discovery-position" aria-label={`Discovery ${index + 1} of ${total}`}>{number(index + 1)} / {number(total)}</span>
          <button type="button" disabled={!next} onClick={() => goTo(index + 1)}>Next<span aria-hidden="true"> →</span></button>
        </div>
      </nav>
      <p className="discovery-progress" role="status">{explored} of {total} discoveries explored</p>

      <article className="discovery-reading" key={entry.id} onPointerDown={startSwipe} onPointerUp={finishSwipe}
        onPointerCancel={() => { touch.current = null }}>
        <h1 ref={headline} tabIndex={-1}>{entry.question}</h1>
        <div className="discovery-card-evidence">
          {teaser && <p className="discovery-hook">{teaser.hook}</p>}
          {teaser?.interaction
            ? <DiscoveryInteraction interaction={teaser.interaction} evidenceLink={evidenceLink} visit={visit}
                onReveal={(pick, answer) => setProgress((current) => revealDiscovery(current, entry.id, pick, answer))}
                onClose={() => setProgress((current) => ({ ...current, [entry.id]: { ...visit!, closed: true } }))} />
            : evidenceLink()}
        </div>

        {visit && !visit.closed && next && (
          <button className="discovery-next-preview" type="button" onClick={() => goTo(index + 1)}>
            <span className="discovery-kicker">Up next</span>
            <span className="discovery-preview-title">{next.question}</span>
            <span className="discovery-preview-link">Discover <span aria-hidden="true">→</span></span>
          </button>
        )}
        {!next && (visit || completed) && (
          <section className="discovery-finish" aria-labelledby="discovery-finish-title">
            <h2 id="discovery-finish-title">{completed ? `You’ve explored all ${total} discoveries.` : 'Your detective record'}</h2>
            {record}
            <button className="discovery-clue" type="button" onClick={() => dialog.current?.showModal()}>
              {completed ? 'Revisit discoveries' : 'Browse all questions'} <span aria-hidden="true">→</span>
            </button>
          </section>
        )}
      </article>

      <dialog ref={dialog} className="discovery-contents" aria-labelledby="discovery-contents-title">
        <div className="discovery-contents-heading">
          <h2 id="discovery-contents-title">Browse all questions</h2>
          <button className="discovery-clue" type="button" onClick={() => dialog.current?.close()}>Close</button>
        </div>
        <div className="discovery-record">
          <h3 className="discovery-kicker">Your detective record</h3>
          {record}
        </div>
        <ol>
          {EDITORIAL_QUESTIONS.map(({ id, question }, position) => (
            <li key={id}><button type="button" aria-current={index === position ? 'step' : undefined}
              onClick={() => { dialog.current?.close(); goTo(position) }}>
              <span className="discovery-position" aria-hidden="true">{number(position + 1)}</span>
              <span>{question}</span>
              {Object.hasOwn(progress, id) && <span className="discovery-explored">Explored</span>}
            </button></li>
          ))}
        </ol>
      </dialog>
    </div>
  )
}
