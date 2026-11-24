import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from './discoverEdition'
import { EDITORIAL_QUESTIONS } from './editorial'
import { LOVE_CHAPTER, LOVE_QUESTIONS } from './menWomen'
import { CHAPTER_QUESTIONS } from './chapterQuestions'

// A chapter is an ordered group of questions within a theme. Quizzes with one chapter play as a single run.
export interface QuizChapter {
  id: string
  title: string
  description?: string
  minutes?: number
  /** How points are awarded, shown under the results. */
  scoring?: string
  questionIds: readonly string[]
}

export interface Quiz {
  id: string
  title: string
  /** The challenge to the player, used in shared results. */
  prompt: string
  /** One line for the quiz card. */
  description: string
  tagline?: string
  /** Changing the edition invalidates stored answers when a quiz's questions are revised. */
  edition: string
  /** 'chapter' quizzes use the visual chapter player with partial-credit scoring. */
  format?: 'chapter'
  /** Also offers browsing every discovery without scoring. */
  browse?: boolean
  /** More chapters are planned, so the theme opens on its chapter list. */
  moreChapters?: boolean
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
    description: 'Homes, work, family, crime and conflict. Nine beliefs, checked against the data.',
    edition: DISCOVERY_QUIZ_EDITION,
    format: 'chapter',
    browse: true,
    // Original keys, so existing players keep their answers and last result.
    attemptKey: 'data-detective.challenge.v1',
    resultKey: 'data-detective.challenge.last-result.v1',
    chapters: [{
      id: 'main',
      title: 'The World Around Us',
      description: 'Homes, family, work, crime and conflict: nine common beliefs, checked against official statistics and research.',
      minutes: 4,
      questionIds: EDITORIAL_QUESTIONS.map(({ id }) => id),
    }],
  },
  {
    id: 'men-and-women',
    title: 'Men & Women',
    prompt: 'How well do you really understand men and women?',
    description: 'Love, dating and relationships. How different are we, really?',
    moreChapters: true,
    edition: 'v1',
    format: 'chapter',
    attemptKey: 'data-detective.quiz.men-and-women.v1',
    resultKey: 'data-detective.quiz.men-and-women.last-result.v1',
    chapters: [{
      ...LOVE_CHAPTER,
      scoring: 'One point per question. Being single: ¼ point per correct prediction. Emotional support: ½ point per estimate within 5 points of the real figure, ¼ within 15.',
      questionIds: LOVE_QUESTIONS.map(({ id }) => id) }],
  },
  {
    id: 'housing-crisis',
    title: 'The Housing Crisis',
    prompt: 'How Well Do You Understand the Housing Crisis?',
    description: 'Prices, rents and who can still afford a home.',
    edition: 'v1',
    attemptKey: 'data-detective.quiz.housing-crisis.v1',
    resultKey: 'data-detective.quiz.housing-crisis.last-result.v1',
    chapters: [],
  },
]

export const DEFAULT_QUIZ = QUIZZES[0]

/** Themes with several chapters open on a chapter list; single-chapter quizzes start straight away. */
export function hasChapterList(quiz: Quiz) {
  return quiz.chapters.length > 1 || !!quiz.moreChapters
}

export function quizById(id: string | null | undefined) {
  return QUIZZES.find((quiz) => quiz.id === id)
}

export type QuizQuestion = { id: string; question: string; chapter: string }

/** The playable questions of a quiz, in order across its chapters. */
export function quizQuestions(quiz: Quiz): QuizQuestion[] {
  return quiz.chapters.flatMap(({ id: chapter, questionIds }) => questionIds.flatMap((id) => {
    const visual = CHAPTER_QUESTIONS[id]
    if (visual) return [{ id, chapter, question: visual.question }]
    const interaction = DISCOVER_TEASERS[id]?.interaction
    if (!interaction) return []
    return [{ id, chapter, question: EDITORIAL_QUESTIONS.find((entry) => entry.id === id)?.question ?? interaction.label }]
  }))
}
