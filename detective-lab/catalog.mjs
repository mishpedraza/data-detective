import { DISCOVER_TEASERS } from '../src/data/discoverEdition.ts'
import { EDITORIAL_QUESTIONS } from '../src/data/editorial.ts'
import { EDITORIAL_STORIES } from '../src/data/editorialStories.ts'
import { REVIEWED_ANSWERS } from '../src/data/reviewedAnswers.ts'
import { INDICATORS } from '../src/data/indicators.ts'
import { REFERENCES } from '../src/data/references.ts'
import { studyById } from '../src/data/research.ts'
import { hrefFor } from '../src/lib/route.ts'

export const catalog = EDITORIAL_QUESTIONS.map(({ id, question }) => {
  const { context, interaction, years } = DISCOVER_TEASERS[id] ?? {}
  const investigation = EDITORIAL_STORIES[id] ?? REVIEWED_ANSWERS[id]
  const ids = new Set([...interaction?.reveal?.refs ?? [], ...investigation?.finding.refs ?? [],
    ...investigation?.figure?.refs ?? [], ...investigation?.visual?.refs ?? [],
    ...investigation?.limitation?.refs ?? [], ...investigation?.explanation?.flatMap(({ refs }) => refs) ?? []])
  const sources = [...ids].map((ref) => {
    const study = studyById(ref) ?? REFERENCES[ref]
    const indicator = ref.startsWith('data:') ? INDICATORS[ref.slice(5)] : undefined
    return { ref, label: study?.title ?? indicator?.label, url: study?.url ?? indicator?.source?.url }
  })
  const answer = interaction?.answer
  return {
    id, question, context, interaction, investigation, sources,
    route: hrefFor('investigate', { r: id, ...years }),
    correctChoice: interaction?.choiceLabels?.[answer] ?? answer,
    wrongChoice: interaction?.choices.find((choice) => choice !== answer),
  }
})
