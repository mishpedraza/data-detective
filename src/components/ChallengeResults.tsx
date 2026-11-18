import { useEffect, useRef, useState } from 'react'
import { pickResult, RESULTS_KEY, type challengeAnswers } from '../lib/discoveryChallenge'
import { hrefFor } from '../lib/route'

export function ChallengeResults({ answers, review, navigate, restart }: {
  answers: ReturnType<typeof challengeAnswers>
  review: boolean
  navigate: (href: string) => void
  restart: () => void
}) {
  const correct = answers.filter((answer) => answer.correct).length
  const [result] = useState(() => {
    let previous: string | undefined
    try { previous = localStorage.getItem(RESULTS_KEY) ?? undefined } catch { /* Storage is optional. */ }
    return pickResult(correct, answers.length, previous)
  })
  const [shareStatus, setShareStatus] = useState('')
  const [manualText, setManualText] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const copyField = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!review) {
      try { localStorage.setItem(RESULTS_KEY, result.headline) } catch { /* Storage is optional. */ }
    }
    heading.current?.focus()
  }, [review, result.headline])

  useEffect(() => {
    if (manualText) copyField.current?.select()
  }, [manualText])

  async function share() {
    const url = new URL(window.location.href)
    url.hash = hrefFor('discover', { mode: 'challenge' })
    const message = `${result.headline}\n\nI got ${correct}/${answers.length} on Data Detective.\n\nHow well do you know the world?`
    if (navigator.share) {
      try {
        await navigator.share({ text: message, url: url.href })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }
    const text = `${message}\n${url.href}`
    try {
      await navigator.clipboard.writeText(text)
      setShareStatus('Result copied to clipboard.')
      setManualText('')
    } catch {
      setManualText(text)
      setShareStatus('Copy the result below.')
    }
  }

  if (review) return (
    <section className="discovery-reading challenge-results">
      <h1 ref={heading} tabIndex={-1}>Review my answers</h1>
      <ol className="challenge-review">
        {[...answers].sort((a, b) => Number(a.correct) - Number(b.correct)).map(({ id, question, pick, answer, years }) => (
          <li key={id}>
            <h2>{question}</h2>
            <p>Your answer · {pick}</p>
            <p>Correct answer · {answer}</p>
            <a className="discovery-link" href={hrefFor('investigate', { r: id, ...years })}>Explore why <span aria-hidden="true">→</span></a>
          </li>
        ))}
      </ol>
      <button className="challenge-primary" type="button" onClick={() => navigate(hrefFor('discover', { mode: 'results' }))}>Back to results</button>
    </section>
  )

  return (
    <section className="discovery-reading challenge-results">
      <h1 ref={heading} tabIndex={-1}>{result.headline}</h1>
      <p className="challenge-result-score">{correct} out of {answers.length}</p>
      <p className="discovery-note">{result.supporting}</p>
      <div className="challenge-result-actions">
        <button className="challenge-primary" type="button" onClick={() => navigate(hrefFor('discover', { mode: 'browse' }))}>Discover more →</button>
        <button className="discovery-clue" type="button" onClick={share}>Share my result ↗</button>
        <button className="discovery-clue" type="button" onClick={() => navigate(hrefFor('discover', { mode: 'review' }))}>Review my answers →</button>
        <button className="discovery-clue" type="button" onClick={restart}>Try again</button>
      </div>
      <p className="discovery-note" role="status">{shareStatus}</p>
      {manualText && <textarea className="challenge-share-copy" ref={copyField} aria-label="Result to copy" rows={5} readOnly value={manualText} />}
    </section>
  )
}
