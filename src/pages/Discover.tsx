import { DISCOVER_TEASERS } from '../data/discoverEdition'
import { DiscoveryInteraction } from '../components/DiscoveryInteraction'
import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { hrefFor } from '../lib/route'

type Entry = typeof EDITORIAL_QUESTIONS[number]

function DiscoveryCard({ entry, navigate }: { entry: Entry; navigate: (href: string) => void }) {
  const teaser = DISCOVER_TEASERS[entry.id]
  const href = hrefFor('investigate', { r: entry.id, ...teaser?.years })
  const evidenceLink = (label = 'Explore the evidence') => (
    <a className="discovery-link discovery-open" href={href} onClick={(event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      navigate(href)
    }}>{label} <span aria-hidden="true">→</span></a>
  )
  return (
    <article className="discovery-card">
      <h2>{entry.question}</h2>
      <div className="discovery-card-evidence">
        {teaser && <p className="discovery-hook">{teaser.hook}</p>}
        {teaser?.interaction
          ? <DiscoveryInteraction interaction={teaser.interaction} evidenceLink={evidenceLink} />
          : evidenceLink()}
      </div>
    </article>
  )
}

export function Discover({ navigate }: { navigate: (h: string) => void }) {
  return (
    <div className="discover discover-edition">
      <section className="hero">
        <h1>Think you know? <em>Look closer.</em></h1>
        <p className="hero-sub">Test your instincts against the evidence.</p>
      </section>
      <section className="discovery-sequence" aria-label="Discoveries">
        {EDITORIAL_QUESTIONS.map((entry) => <DiscoveryCard key={entry.id} entry={entry} navigate={navigate} />)}
      </section>
    </div>
  )
}
