import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from './discoverEdition'
import { EDITORIAL_QUESTIONS } from './editorial'

// A chapter is an ordered group of questions within a theme. Quizzes with one chapter play as a single run.
export interface QuizChapter {
  id: string
  title: string
  questionIds: readonly string[]
}

export interface Quiz {
  id: string
  title: string
  /** Welcome headline, phrased as the challenge to the player. */
  prompt: string
  tagline?: string
  /** Changing the edition invalidates stored answers when a quiz's questions are revised. */
  edition: string
  attemptKey: string
  resultKey: string
  chapters: readonly QuizChapter[]
}

export const QUIZZES: readonly Quiz[] = [
  {
    id: 'world',
    title: 'The World Around Us',
    prompt: 'How Well Do You Know the World?',
    tagline: 'A few surprises. Absolutely no judgment.',
    edition: DISCOVERY_QUIZ_EDITION,
    // Original keys, so existing players keep their answers and last result.
    attemptKey: 'data-detective.challenge.v1',
    resultKey: 'data-detective.challenge.last-result.v1',
    chapters: [{ id: 'main', title: 'The World Around Us', questionIds: EDITORIAL_QUESTIONS.map(({ id }) => id) }],
  },
  {
    id: 'men-and-women',
    title: 'Men and Women',
    prompt: 'How Well Do You Really Understand Men and Women?',
    edition: 'v1',
    attemptKey: 'data-detective.quiz.men-and-women.v1',
    resultKey: 'data-detective.quiz.men-and-women.last-result.v1',
    chapters: [],
  },
  {
    id: 'housing-crisis',
    title: 'The Housing Crisis',
    prompt: 'How Well Do You Understand the Housing Crisis?',
    edition: 'v1',
    attemptKey: 'data-detective.quiz.housing-crisis.v1',
    resultKey: 'data-detective.quiz.housing-crisis.last-result.v1',
    chapters: [],
  },
]

export const DEFAULT_QUIZ = QUIZZES[0]

export function quizById(id: string | null | undefined) {
  return QUIZZES.find((quiz) => quiz.id === id)
}

export type QuizQuestion = { id: string; question: string; chapter: string }

/** The playable questions of a quiz, in order across its chapters. */
export function quizQuestions(quiz: Quiz): QuizQuestion[] {
  return quiz.chapters.flatMap(({ id: chapter, questionIds }) => questionIds.flatMap((id) => {
    const interaction = DISCOVER_TEASERS[id]?.interaction
    if (!interaction) return []
    return [{ id, chapter, question: EDITORIAL_QUESTIONS.find((entry) => entry.id === id)?.question ?? interaction.label }]
  }))
}
