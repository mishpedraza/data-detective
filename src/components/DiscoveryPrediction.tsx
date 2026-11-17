import { useState } from 'react'
import { discoveryEvidence, predictionOptions, type Prediction, type Discovery } from '../data/discoveries'
import { hrefFor } from '../lib/route'

export function DiscoveryPrediction({ discovery, navigate }: {
  discovery: Discovery
  navigate?: (href: string) => void
}) {
  const [prediction, setPrediction] = useState<Prediction>()
  const { from, to } = discovery.comparison
  const href = hrefFor('investigate', { r: discovery.id, from, to })
  const options = predictionOptions(discovery)
  const evidence = prediction ? discoveryEvidence(discovery) : null

  return (
    <>
      {prediction ? (
        <div className="discovery-reveal" aria-live="polite">
          <div className="discovery-options prediction-feedback">
            {options.filter((option) => option === prediction || option === evidence?.answer).map((option) => {
              const correct = option === evidence?.answer
              const chosen = option === prediction
              return <span key={option} className={correct ? 'prediction-correct' : evidence ? 'prediction-incorrect' : ''}>
                {option} · {correct ? chosen ? 'Your pick was right' : 'Correct answer' : chosen && evidence ? 'Your pick was off' : 'Your pick'}
              </span>
            })}
          </div>
          {evidence ? <>
            <p className="tell-lead">{evidence.result}</p>
            <p className="tell-text">{discovery.context}</p>
            <a className="tell-more" href={evidence.source}>{evidence.publisher}</a>
          </> : <p className="tell-text">The available data don’t cover both dates in this comparison.</p>}
        </div>
      ) : (
        <fieldset className="discovery-prediction">
          <legend>{discovery.prompt}</legend>
          <div className="discovery-options">
            {options.map((option) => (
              <button type="button" key={option} onClick={() => setPrediction(option)}>{option}</button>
            ))}
          </div>
        </fieldset>
      )}
      <a className="tell-more discovery-open" href={href} onClick={(event) => {
        if (!navigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        navigate(href)
      }}>{prediction ? 'Open investigation →' : 'Skip to the evidence →'}</a>
    </>
  )
}
