import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, discoveryEvidence, featuredDiscoveries, predictionOptions, type Prediction } from '../data/discoveries'
import { RELATIONSHIPS } from '../data/relationships'
import { hrefFor } from '../lib/route'

type Featured = typeof featuredDiscoveries[number]

function investigationHref(discovery: Featured) {
  const comparison = discovery.comparison
  return hrefFor('investigate', { r: discovery.id, from: comparison.from, to: comparison.to })
}

function DiscoveryCard({ discovery, navigate }: { discovery: Featured; navigate: (href: string) => void }) {
  const [prediction, setPrediction] = useState<Prediction>()
  const href = investigationHref(discovery)
  const options = predictionOptions(discovery)
  const evidence = prediction ? discoveryEvidence(discovery) : null

  return (
    <article className="discovery-card">
      <h2>{discovery.question}</h2>
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
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        navigate(href)
      }}>{prediction ? 'Open investigation →' : 'Skip to the evidence →'}</a>
    </article>
  )
}

export function Discover({ navigate }: { navigate: (h: string) => void }) {
  const curated = [...featuredDiscoveries, ...collection]
  const archive = RELATIONSHIPS.filter((rel) => !curated.some(({ id }) => id === rel.id))

  return (
    <div className="discover">
      <section className="hero">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          Big questions.<br /> <em>Surprising discoveries.</em>
        </motion.h1>
        <p className="hero-sub">Explore what the evidence reveals about the world and how it compares with what we think we know.</p>
      </section>

      <section className="discovery-grid" aria-label="Featured discoveries">
        {featuredDiscoveries.map((discovery) => <DiscoveryCard key={discovery.id} discovery={discovery} navigate={navigate} />)}
      </section>

      <section className="more-q" aria-labelledby="discover-more">
        <h2 id="discover-more" className="section-label">Keep exploring</h2>
        <ol>
          {collection.map(({ id, question, params }) => (
            <li key={id}><a href={hrefFor('investigate', { r: id, ...params })}>
              <span className="more-text">{question}</span>
              <span className="q-go" aria-hidden>→</span>
            </a></li>
          ))}
        </ol>
        <details className="discovery-archive">
          <summary className="tell-more">All investigations</summary>
          <ol>
            {archive.map(({ id, question }) => (
              <li key={id}><a href={hrefFor('investigate', { r: id })}>
                <span className="more-text">{question}</span>
                <span className="q-go" aria-hidden>→</span>
              </a></li>
            ))}
          </ol>
        </details>
      </section>
    </div>
  )
}
