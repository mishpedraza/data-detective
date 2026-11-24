// "The World Around Us" questions in the chapter format, built from the reviewed Discover teasers.
import { DISCOVER_TEASERS } from './discoverEdition'
import { EDITORIAL_QUESTIONS } from './editorial'
import type { ChapterQuestion } from './menWomen'

const SHORT: Readonly<Record<string, string>> = {
  'housing-affordability': 'Home prices',
  'children-and-happiness': 'Children and happiness',
  'working-hours': 'Working hours',
  'immigration-crime': 'Permits and crime',
  'education-and-pay': 'The motherhood gap',
  'global-danger': 'Conflict and deaths',
  'generational-wealth': 'Generational wealth',
  'crime-perceptions': 'Perceptions of crime',
  'wealth-and-fertility': 'Wealth and fertility',
}

export const WORLD_QUESTIONS: readonly ChapterQuestion[] = EDITORIAL_QUESTIONS.flatMap(({ id }) => {
  const teaser = DISCOVER_TEASERS[id]
  const interaction = teaser?.interaction
  if (!interaction) return []
  const { finding, note, measure, comparison, facts, refs } = interaction.reveal
  return [{
    id,
    kind: 'choice' as const,
    short: SHORT[id] ?? interaction.label,
    question: interaction.label,
    prompt: teaser.context ?? '',
    options: interaction.choices.map((choice) => ({ id: choice, label: interaction.choiceLabels?.[choice] ?? choice })),
    answer: interaction.answer,
    finding,
    takeaway: note,
    visual: comparison ? 'bars' as const : 'facts' as const,
    measure,
    bars: comparison,
    facts,
    refs,
    explore: { r: id, years: teaser.years },
  }]
})
