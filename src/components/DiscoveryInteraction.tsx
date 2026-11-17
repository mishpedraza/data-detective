import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Interaction } from '../data/discoverEdition'
import { StorySources } from './StoryEvidence'

export function DiscoveryInteraction({ interaction, evidenceLink }: {
  interaction: Interaction
  evidenceLink: (label?: string) => ReactNode
}) {
  const [pick, setPick] = useState('')
  const [opened, setOpened] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (opened) panel.current?.focus({ preventScroll: true })
  }, [opened])

  if (!opened) return (
    <>
      {interaction.kind === 'prediction' ? (
        <fieldset className="discovery-prediction">
          <legend>{interaction.label}</legend>
          <div className="discovery-options">
            {interaction.choices.map((choice) => (
              <button key={choice} type="button" onClick={() => { setPick(choice); setOpened(true) }}>{choice}</button>
            ))}
          </div>
        </fieldset>
      ) : (
        <button className="discovery-clue" type="button" onClick={() => setOpened(true)}>{interaction.label} <span aria-hidden="true">↓</span></button>
      )}
      {evidenceLink()}
    </>
  )

  const { finding, comparison, note, next, refs } = interaction.reveal
  const answer = interaction.kind === 'prediction' ? interaction.answer : undefined
  const largest = comparison && Math.max(...comparison.map(({ amount }) => amount))
  return (
    <div className="discovery-reveal" ref={panel} tabIndex={-1} aria-live="polite">
      {pick && <p className="discovery-guess">You chose <strong className={answer ? (pick === answer ? 'discovery-match' : 'discovery-mismatch') : undefined}>{pick.toLowerCase()}</strong>. {answer === pick ? 'That matches the comparison.' : ''}</p>}
      <p className={`discovery-result${answer ? ' discovery-match' : ''}`}>{finding}</p>
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
      <p className="discovery-note">{note}</p>
      <StorySources refs={refs} />
      {evidenceLink(next)}
    </div>
  )
}
