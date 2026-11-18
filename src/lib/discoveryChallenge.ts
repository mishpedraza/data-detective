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

const correctReactions = [
  'Look at you, knowing things.',
  'Okay, show-off.',
  'We see you.',
  'Someone’s been paying attention.',
  'Your brain understood the assignment.',
  'You and reality are getting along.',
  'Okay, impressive.',
  'Well played.',
  'You’re suspiciously good at this.',
  'Save some knowledge for the rest of us.',
  'Your hunch brought receipts.',
  'The facts are on your side today.',
  'That guess had excellent timing.',
  'Your intuition came prepared.',
  'You called it before the chart did.',
  'A quiet victory for your inner nerd.',
  'The evidence backs you up.',
  'That was a very well-informed hunch.',
] as const

const incorrectReactions = [
  'It’s okay. Nobody saw that.',
  'Honestly, fair guess.',
  'Reality had other plans.',
  'Well, that was educational.',
  'Your confidence was admirable.',
  'A plot twist nobody ordered.',
  'Let’s pretend that was a warm-up.',
  'The universe respectfully disagrees.',
  'That was a very convincing guess.',
  'Nobody’s keeping receipts.',
  'So much for the obvious answer.',
  'Your hunch took the scenic route.',
  'Well, that wasn’t on the bingo card.',
  'The chart had a different answer.',
  'Fair guess. Uncooperative facts.',
  'Reality likes to keep us guessing.',
  'The plot thickens.',
  'The evidence has entered the chat.',
] as const

// Each question owns two distinct slots in each pool, so a run never repeats a line.
export function challengeReaction(index: number, correct: boolean, variant: 0 | 1 = 0) {
  const pool = correct ? correctReactions : incorrectReactions
  return pool[index * 2 + variant]
}
