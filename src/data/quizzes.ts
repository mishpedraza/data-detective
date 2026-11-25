import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from './discoverEdition'
import { EDITORIAL_QUESTIONS } from './editorial'
import { LOVE_CHAPTER, LOVE_QUESTIONS } from './menWomen'
import { MONEY_CHAPTER, MONEY_QUESTIONS } from './moneyPower'
import { NATURE_CHAPTER, NATURE_QUESTIONS } from './natureNurture'
import { HOUSING_CHAPTER, HOUSING_QUESTIONS } from './housing'
import { CITIES_CHAPTER, CITIES_QUESTIONS } from './cities'
import { MIND_CHAPTER, MIND_QUESTIONS } from './humanMind'
import { HEALTH_CHAPTER, HEALTH_QUESTIONS } from './health'
import { CHAPTER_QUESTIONS } from './chapterQuestions'

// A chapter is an ordered group of questions within a theme. Quizzes with one chapter play as a single run.
export interface QuizChapter {
  id: string
  title: string
  description?: string
  /** One line for the homepage card. */
  summary?: string
  minutes?: number | string
  /** How points are awarded, shown under the results. */
  scoring?: string
  questionIds: readonly string[]
}

export interface Quiz {
  id: string
  title: string
  /** The challenge to the player, used in shared results. */
  prompt: string
  /** The same challenge in the first person, for the combined theme scorecard. */
  selfPrompt?: string
  /** The theme's accent colour on the homepage, results and scorecards. */
  accent: string
  /** Shown on a theme that has no playable quiz yet. */
  description?: string
  tagline?: string
  /** Changing the edition invalidates stored answers when a quiz's questions are revised. */
  edition: string
  /** 'chapter' quizzes use the visual chapter player with partial-credit scoring. */
  format?: 'chapter'
  /** Also offers browsing every discovery without scoring. */
  browse?: boolean
  attemptKey: string
  resultKey: string
  chapters: readonly QuizChapter[]
}

export const QUIZZES: readonly Quiz[] = [
  {
    id: 'world',
    title: 'The World Around Us',
    prompt: 'How Well Do You Know the World?',
    accent: '#3d5a78',
    tagline: 'A few surprises. Absolutely no judgment.',
    edition: DISCOVERY_QUIZ_EDITION,
    format: 'chapter',
    browse: true,
    // Original keys, so existing players keep their answers and last result.
    attemptKey: 'data-detective.challenge.v1',
    resultKey: 'data-detective.challenge.last-result.v1',
    chapters: [{
      id: 'main',
      title: 'Life by the numbers',
      summary: 'Homes, work, family, crime and conflict. Nine beliefs, checked against the data.',
      description: 'Homes, family, work, crime and conflict: nine common beliefs, checked against official statistics and research.',
      minutes: 4,
      questionIds: EDITORIAL_QUESTIONS.map(({ id }) => id),
    }],
  },
  {
    id: 'men-and-women',
    title: 'Men & Women',
    prompt: 'How well do you really understand men and women?',
    selfPrompt: 'How well do I really understand men & women?',
    accent: '#6d3f61',
    edition: 'v1',
    format: 'chapter',
    attemptKey: 'data-detective.quiz.men-and-women.v1',
    resultKey: 'data-detective.quiz.men-and-women.last-result.v1',
    chapters: [{
      ...LOVE_CHAPTER,
      summary: 'Age gaps, desire, being single and loneliness. How different are we, really?',
      scoring: 'One point per question. Being single: ¼ point per correct prediction. Emotional support: ½ point per estimate within 5 points of the real figure, ¼ within 15.',
      questionIds: LOVE_QUESTIONS.map(({ id }) => id),
    }, {
      ...MONEY_CHAPTER,
      questionIds: MONEY_QUESTIONS.map(({ id }) => id),
    }, {
      ...NATURE_CHAPTER,
      questionIds: NATURE_QUESTIONS.map(({ id }) => id),
    }],
  },
  {
    id: 'housing-crisis',
    title: 'The Housing Crisis',
    prompt: 'How Well Do You Understand the Housing Crisis?',
    accent: '#6d3f61',
    description: 'Prices, rents and who can still afford a home.',
    edition: 'v1',
    format: 'chapter',
    attemptKey: 'data-detective.quiz.housing-crisis.v1',
    resultKey: 'data-detective.quiz.housing-crisis.last-result.v1',
    chapters: [{
      ...HOUSING_CHAPTER,
      questionIds: HOUSING_QUESTIONS.map(({ id }) => id),
    }, {
      ...CITIES_CHAPTER,
      questionIds: CITIES_QUESTIONS.map(({ id }) => id),
    }],
  },
  {
    id: 'human-mind',
    title: 'The Human Mind',
    prompt: 'How Easily Can Your Brain Fool You?',
    accent: '#624575',
    description: 'Memory, creativity, confidence and judgment.',
    edition: 'v1',
    format: 'chapter',
    attemptKey: 'data-detective.quiz.human-mind.v1',
    resultKey: 'data-detective.quiz.human-mind.last-result.v1',
    chapters: [{
      ...MIND_CHAPTER,
      questionIds: MIND_QUESTIONS.map(({ id }) => id),
    }],
  },
  {
    id: 'health-longevity',
    title: 'Health & Longevity',
    prompt: 'What Actually Helps Us Live Longer?',
    accent: '#387c83',
    description: 'Exercise, sleep and everyday habits.',
    edition: 'v1',
    format: 'chapter',
    attemptKey: 'data-detective.quiz.health-longevity.v1',
    resultKey: 'data-detective.quiz.health-longevity.last-result.v1',
    chapters: [{
      ...HEALTH_CHAPTER,
      questionIds: HEALTH_QUESTIONS.map(({ id }) => id),
    }],
  },
]

export const DEFAULT_QUIZ = QUIZZES[0]

/** Links name the chapter once a theme has more than one. */
export function hasChapterList(quiz: Quiz) {
  return quiz.chapters.length > 1
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
