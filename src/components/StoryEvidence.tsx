import { INDICATORS } from '../data/indicators'
import { REFERENCES } from '../data/references'
import { studyById } from '../data/research'
import type { ReviewedAnswer } from '../data/reviewedAnswers'
import { storyComparison } from '../lib/storyComparison'

export function StorySources({ refs }: { refs: readonly string[] }) {
  return (
    <ul className="story-sources" aria-label="Sources">
      {refs.map((id) => {
        const indicator = id.startsWith('data:') ? INDICATORS[id.slice(5)] : undefined
        const study = studyById(id) ?? REFERENCES[id]
        const url = indicator?.source.url ?? study?.url
        const author = study?.authors.split(/ & |, /)[0]
        const authorLabel = study && 'cite' in study ? study.cite ?? author : author
        const label = indicator?.label ?? (study && `${authorLabel} (${study.year})`)
        return url && <li key={id}><a href={url} target="_blank" rel="noreferrer" title={study?.title}>{label}</a></li>
      })}
    </ul>
  )
}

export function StoryEvidence({ answer }: { answer: ReviewedAnswer }) {
  const visual = answer.visual && storyComparison(answer.visual)

  if (!visual) return <><p className="story-evidence-copy">{answer.finding.text}</p><StorySources refs={answer.finding.refs} /></>

  const maximum = Math.max(...visual.rows.map(({ value }) => value))
  return (
    <figure className="story-comparison">
      <figcaption>{visual.caption}</figcaption>
      <ul className="story-bars">
        {visual.rows.map(({ label, value, display }) => (
          <li key={label}>
            <span>{label}</span><strong>{display}</strong>
            <span className="story-bar" aria-hidden="true"><span style={{ width: `${value / maximum * 100}%` }} /></span>
          </li>
        ))}
      </ul>
      <p className="tell-text">{visual.takeaway}</p>
      <StorySources refs={visual.refs} />
    </figure>
  )
}

export function StoryExplanation({ answer }: { answer: ReviewedAnswer }) {
  return (
    <>
      <h2>{answer.explanationTitle}</h2>
      {answer.explanation.map(({ text, refs }) => (
        <div className="story-paragraph" key={text}>
          <p>{text}</p>
          <StorySources refs={refs} />
        </div>
      ))}
    </>
  )
}
