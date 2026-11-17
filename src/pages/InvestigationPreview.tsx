import { DiscoveryPrediction } from '../components/DiscoveryPrediction'
import { predictions } from '../data/discoveries'
import { EditorialNavigation } from '../components/EditorialNavigation'
import { editorialQuestionById } from '../data/editorial'
import { hrefFor } from '../lib/route'

type Preview = Extract<NonNullable<ReturnType<typeof editorialQuestionById>>, { status: 'preview' }>

export function InvestigationPreview({ entry }: { entry: Preview }) {
  const prediction = predictions.find(({ id }) => id === entry.related?.relationship)
  return (
    <article className="investigate investigation-preview">
      <EditorialNavigation active={entry.id} />
      <header className="question-block">
        <p className="eyebrow">Editorial preview</p>
        <h1 className="question finding">{entry.question}</h1>
        <p className="tell-lead">Investigation not yet available</p>
        <p className="tell-text">{entry.needs}</p>
        {entry.related && !prediction && <a className="tell-more" href={hrefFor('investigate', { r: entry.related.relationship })}>{entry.related.label} →</a>}
      </header>
      {prediction && <section className="question-block" aria-label="Supporting evidence">
        <h2 className="tell-lead">{entry.related?.label}</h2>
        <DiscoveryPrediction discovery={prediction} />
      </section>}
    </article>
  )
}
