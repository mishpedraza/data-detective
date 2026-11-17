import { DISCOVER_TEASERS } from '../data/discoverEdition'
import { DiscoveryInteraction } from '../components/DiscoveryInteraction'
import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { hrefFor } from '../lib/route'

type Entry = typeof EDITORIAL_QUESTIONS[number]

function DiscoveryCard({ entry, navigate }: { entry: Entry; navigate: (href: string) => void }) {
  const teaser = DISCOVER_TEASERS[entry.id]
  const Heading = entry.featured ? 'h2' : 'h3'
  const href = hrefFor('investigate', { r: entry.id, ...teaser?.years })
  const evidenceLink = (label = 'Explore the evidence') => (
    <a className="discovery-link discovery-open" href={href} onClick={(event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      navigate(href)
    }}>{label} <span aria-hidden="true">→</span></a>
  )
  return (
    <article className={entry.featured ? 'discovery-card' : 'discovery-brief'}>
      <Heading>{entry.question}</Heading>
      {teaser && <p className="discovery-hook">{teaser.hook}</p>}
      {teaser?.interaction
        ? <DiscoveryInteraction interaction={teaser.interaction} evidenceLink={evidenceLink} />
        : evidenceLink()}
    </article>
  )
}

export function Discover({ navigate }: { navigate: (h: string) => void }) {
  const featured = EDITORIAL_QUESTIONS.filter((entry) => entry.featured)
  const more = EDITORIAL_QUESTIONS.filter((entry) => !entry.featured)
  return (
    <div className="discover discover-edition">
      <section className="hero">
        <h1>Think you know? <em>Look closer.</em></h1>
        <p className="hero-sub">Test your instincts against the evidence.</p>
      </section>
      <section className="discovery-grid" aria-label="Featured discoveries">
        {featured.map((entry) => <DiscoveryCard key={entry.id} entry={entry} navigate={navigate} />)}
      </section>
      <section className="more-q" aria-labelledby="discover-more">
        <h2 id="discover-more">Keep exploring</h2>
        <ol>
          {more.map((entry) => (
            <li key={entry.id}><DiscoveryCard entry={entry} navigate={navigate} /></li>
          ))}
        </ol>
      </section>
    </div>
  )
}
