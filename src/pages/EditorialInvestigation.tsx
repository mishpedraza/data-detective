import { InvestigationIntro } from '../components/InvestigationIntro'
import { InvestigationStory } from '../components/InvestigationStory'
import { StoryEvidence, StoryExplanation, StorySources } from '../components/StoryEvidence'
import { WorkingHoursComparison } from '../components/WorkingHoursComparison'
import { EDITORIAL_STORIES } from '../data/editorialStories'

export function EditorialInvestigation({ id }: { id: string }) {
  const answer = EDITORIAL_STORIES[id]
  if (!answer) return (
    <article className="investigate investigation-preview">
      <InvestigationIntro active={id} headline="Investigation not yet available" />
    </article>
  )

  return (
    <article className="investigate">
      <InvestigationIntro active={id} headline={answer.headline} note={answer.scope} />
      <InvestigationStory
        evidence={<StoryEvidence answer={answer} />}
        explanation={<StoryExplanation answer={answer} />}
        exploration={<>
          {id === 'working-hours' && <WorkingHoursComparison />}
          <p className="tell-text">{answer.readingNote}</p>
          {id !== 'working-hours' && <StorySources refs={answer.finding.refs} />}
        </>}
        research={<>
          <p className="tell-text">{answer.limitation.text}</p>
          <StorySources refs={[...new Set([
            ...answer.finding.refs,
            ...answer.explanation.flatMap(({ refs }) => refs),
            ...answer.limitation.refs ?? [],
          ])]} />
        </>}
      />
    </article>
  )
}
