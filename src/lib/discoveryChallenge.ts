import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from '../data/discoverEdition'
import { EDITORIAL_QUESTIONS } from '../data/editorial'
import type { DiscoveryProgress } from './discoveryProgress'

export const CHALLENGE_KEY = 'data-detective.challenge.v1'
export const RESULTS_KEY = 'data-detective.challenge.last-result.v1'

export function challengeAnswers(progress: DiscoveryProgress) {
  return EDITORIAL_QUESTIONS.flatMap(({ id }) => {
    const interaction = DISCOVER_TEASERS[id]?.interaction
    const visit = progress[id]
    if (!interaction || visit?.edition !== DISCOVERY_QUIZ_EDITION || !interaction.choices.includes(visit.pick)) return []
    return [{ id, question: interaction.label, pick: interaction.choiceLabels?.[visit.pick] ?? visit.pick,
      answer: interaction.choiceLabels?.[interaction.answer] ?? interaction.answer,
      correct: visit.pick === interaction.answer, years: DISCOVER_TEASERS[id]?.years }]
  })
}

const headlines = [
  ['It’s okay. Nobody saw that.', 'Well, that was educational.', 'Let’s call that a practice round.',
    'You came. You guessed. You learned.', 'Reality had a few surprises for you.',
    'That took an unexpected turn.', 'The good news? You learned something.', 'A strong showing from reality.'],
  ['Not bad for a human.', 'You know a thing or two.', 'Your intuition has potential.',
    'You’d survive a dinner-party debate.', 'You’re onto something.', 'Curiosity looks good on you.',
    'You and reality are getting along.', 'You made a good case.'],
  ['Okay, show-off.', 'We get it. You read things.', 'Someone’s been paying attention.',
    'You’re suspiciously well-informed.', 'Please join our trivia team.', 'The evidence seems to like you.',
    'Save some knowledge for the rest of us.', 'We have questions. Apparently, you have answers.'],
]

export function pickResult(correct: number, total: number, previous?: string, random = Math.random) {
  const pool = headlines[correct <= 2 ? 0 : correct <= 6 ? 1 : 2].filter((line) => line !== previous)
  const missed = total - correct
  const support = missed === 0
    ? ['You called every one.', 'Nine questions. Zero plot twists you didn’t see coming.']
    : [`You got ${correct} right and found ${missed} ${missed === 1 ? 'surprise' : 'surprises'} along the way.`,
      missed === 1 ? 'One answer still managed to surprise you.' : `You found ${missed} answers you might want to tell someone about.`]
  return { headline: pool[Math.floor(random() * pool.length)], supporting: support[Math.floor(random() * support.length)] }
}

export function challengeReaction(index: number, correct: boolean) {
  const slot = [0, 2, 6, 8].indexOf(index)
  if (slot < 0) return undefined
  return (correct
    ? ['Nicely spotted.', 'Your intuition came through.', 'Look at you, knowing things.', 'Okay, impressive.']
    : ['A reasonable guess. Reality had other plans.', 'Honestly, fair guess.', 'The plot thickens.', 'Well, now you know.'])[slot]
}
