import { motion } from 'framer-motion'
import { predictions } from '../data/discoveries'
import { DiscoveryPrediction } from '../components/DiscoveryPrediction'
import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { hrefFor } from '../lib/route'

type Featured = typeof EDITORIAL_QUESTIONS[number]

function DiscoveryCard({ entry, navigate }: { entry: Featured; navigate: (href: string) => void }) {
  const discovery = entry.status === 'available' ? predictions.find(({ id }) => id === entry.relationship) : undefined
  const href = hrefFor('investigate', { r: entry.id })

  return (
    <article className="discovery-card">
      <h2>{entry.question}</h2>
      {entry.status === 'preview' && <p className="tell-text">Investigation not yet available</p>}
      {discovery ? <DiscoveryPrediction discovery={discovery} navigate={navigate} /> :
        <a className="tell-more discovery-open" href={href}>{entry.status === 'preview' ? 'Read preview →' : 'Open investigation →'}</a>}
    </article>
  )
}

export function Discover({ navigate }: { navigate: (h: string) => void }) {
  const featured = EDITORIAL_QUESTIONS.filter((entry) => entry.featured)
  const more = EDITORIAL_QUESTIONS.filter((entry) => !entry.featured)

  return (
    <div className="discover">
      <section className="hero">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          Big questions.<br /> <em>Surprising discoveries.</em>
        </motion.h1>
        <p className="hero-sub">Explore what the evidence reveals about the world and how it compares with what we think we know.</p>
      </section>

      <section className="discovery-grid" aria-label="Featured discoveries">
        {featured.map((entry) => <DiscoveryCard key={entry.id} entry={entry} navigate={navigate} />)}
      </section>

      <section className="more-q" aria-labelledby="discover-more">
        <h2 id="discover-more" className="section-label">Keep exploring</h2>
        <ol>
          {more.map(({ id, question, status }) => (
            <li key={id}><a href={hrefFor('investigate', { r: id })}>
              <span className="more-text">{question}{status === 'preview' && <span className="feat-note">Preview · Investigation not yet available</span>}</span>
              <span className="q-go" aria-hidden>→</span>
            </a></li>
          ))}
        </ol>
      </section>
    </div>
  )
}
