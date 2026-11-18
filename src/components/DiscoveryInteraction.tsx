import { useEffect, useRef, type ReactNode } from 'react'
import type { DiscoveryVisit } from '../lib/discoveryProgress'
import type { Interaction } from '../data/discoverEdition'
import { StorySources } from './StoryEvidence'

export function DiscoveryInteraction({ interaction, evidenceLink, visit, onReveal, onClose }: {
  interaction: Interaction
  evidenceLink: () => ReactNode
  visit?: DiscoveryVisit
  onReveal: (pick: string, answer?: string) => void
  onClose: () => void
}) {
  const pick = visit?.pick ?? ''
  const opened = !!visit && !visit.closed
  const revealing = useRef(false)
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const returning = useRef(false)
  useEffect(() => {
    if (opened && revealing.current) {
      panel.current?.focus({ preventScroll: true })
      revealing.current = false
    } else if (!opened && returning.current) {
      trigger.current?.focus()
      returning.current = false
    }
  }, [opened])

  if (!opened) return (
    <>
      {interaction.kind === 'prediction' && !visit ? (
        <fieldset className="discovery-prediction">
          <legend>{interaction.label}</legend>
          <div className="discovery-options">
            {interaction.choices.map((choice) => (
              <button key={choice} type="button" onClick={() => { revealing.current = true; onReveal(choice, interaction.answer) }}>{choice}</button>
            ))}
          </div>
        </fieldset>
      ) : (
        <button ref={trigger} className="discovery-clue" type="button" onClick={() => { revealing.current = true; onReveal(pick) }}>{visit ? 'Show the evidence again' : interaction.label} <span aria-hidden="true">↓</span></button>
      )}
      {evidenceLink()}
    </>
  )

  const { finding, comparison, facts, note, measure, refs } = interaction.reveal
  const answer = interaction.kind === 'prediction' ? interaction.answer : undefined
  const largest = comparison && Math.max(...comparison.map(({ amount }) => amount))
  return (
    <div className="discovery-reveal" ref={panel} tabIndex={-1} aria-live="polite">
      {answer && <p className="discovery-guess">
        {pick === answer
          ? <strong className="discovery-match">Correct</strong>
          : <><span className="discovery-mismatch">Your guess · {pick}</span><span className="discovery-match">Answer · {answer}</span></>}
      </p>}
      <p className="discovery-result">{finding}</p>
      {measure && <p className="discovery-measure">{measure}</p>}
      {comparison && largest && (
        <ul className="story-bars discovery-bars">
          {comparison.map(({ label, value, amount }) => (
            <li key={label}>
              <span>{label}</span><strong>{value}</strong>
              <span className="story-bar" aria-hidden="true"><span style={{ width: `${100 * amount / largest}%` }} /></span>
            </li>
          ))}
        </ul>
      )}
      {facts && <dl className="discovery-facts">
        {facts.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>}
      <p className="discovery-note">{note}</p>
      <StorySources refs={refs} />
      <div className="discovery-reveal-actions">
        {evidenceLink()}
        <button type="button" className="discovery-clue" onClick={() => {
          returning.current = true
          onClose()
        }}>Close reveal</button>
      </div>
    </div>
  )
}
