import { useEffect, useRef, type ReactNode } from 'react'
import type { DiscoveryVisit } from '../lib/discoveryProgress'
import type { Interaction } from '../data/discoverEdition'
import { StorySources } from './StoryEvidence'

export function DiscoveryInteraction({ interaction, evidenceLink, visit, onReveal, onClose, reaction }: {
  interaction: Interaction
  evidenceLink: (label?: string) => ReactNode
  visit?: DiscoveryVisit
  reaction?: string
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
      {!visit ? (
        <fieldset className="discovery-prediction" aria-label="Choose your answer">
          <div className="discovery-options">
            {interaction.choices.map((choice) => (
              <button key={choice} type="button" onClick={() => { revealing.current = true; onReveal(choice, interaction.answer) }}>{interaction.choiceLabels?.[choice] ?? choice}</button>
            ))}
          </div>
        </fieldset>
      ) : (
        <button ref={trigger} className="discovery-clue" type="button" onClick={() => { revealing.current = true; onReveal(pick) }}>Show the evidence again <span aria-hidden="true">↓</span></button>
      )}
      {evidenceLink()}
    </>
  )

  const { finding, lead, comparison, facts, note, measure, refs } = interaction.reveal
  const correct = pick === interaction.answer
  const choiceLabel = (choice: string) => interaction.choiceLabels?.[choice] ?? choice
  const largest = comparison && Math.max(...comparison.map(({ amount }) => amount))
  return (
    <div className="discovery-reveal" ref={panel} tabIndex={-1} aria-live="polite">
      {reaction && (
        <div className="challenge-feedback">
          <p className={`challenge-verdict ${correct ? 'challenge-correct' : 'challenge-incorrect'}`}>
            {correct && <span className="challenge-check" aria-hidden="true">✓</span>}
            {correct ? 'Correct!' : 'Not quite!'}
          </p>
          <p className="challenge-reaction">{reaction}</p>
          <div className="challenge-answers">
            <p className={`challenge-answer ${correct ? 'challenge-correct' : 'challenge-incorrect'}`}>
              <span>Your answer</span> <strong>{choiceLabel(pick)}</strong>
            </p>
            {!correct && <p className="challenge-answer challenge-correct">
              <span>Correct answer</span> <strong>{choiceLabel(interaction.answer)}</strong>
            </p>}
          </div>
        </div>
      )}
      <p className="discovery-result">{lead ?? finding}</p>
      {lead && <p className="discovery-note discovery-result-detail">{finding}</p>}
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
        {evidenceLink('Explore why')}
        <button type="button" className="discovery-clue" onClick={() => {
          returning.current = true
          onClose()
        }}>Close reveal</button>
      </div>
    </div>
  )
}
