import { DiscoveryPrediction } from '../components/DiscoveryPrediction'
import { predictions } from '../data/discoveries'
import { InvestigationIntro } from '../components/InvestigationIntro'
import { editorialQuestionById } from '../data/editorial'
import { hrefFor } from '../lib/route'

type Preview = Extract<NonNullable<ReturnType<typeof editorialQuestionById>>, { status: 'preview' }>

export function InvestigationPreview({ entry }: { entry: Preview }) {
  const prediction = predictions.find(({ id }) => id === entry.related?.relationship)
  return (
    <article className="investigate investigation-preview">
      <InvestigationIntro active={entry.id} headline="Investigation not yet available" note={entry.needs}>
        {entry.related && !prediction && <a className="tell-more" href={hrefFor('investigate', { r: entry.related.relationship })}>{entry.related.label} →</a>}
      </InvestigationIntro>
      {prediction && <section className="question-block" aria-label="Supporting evidence">
        <h2 className="tell-lead">{entry.related?.label}</h2>
        <DiscoveryPrediction discovery={prediction} />
      </section>}
    </article>
  )
}
