// Everything the suite plays comes from the app's own quiz registry, so new quizzes and questions are covered automatically.
import { QUIZZES, hasChapterList, type Quiz, type QuizChapter } from '../../src/data/quizzes'
import type { ChapterQuestion, Side } from '../../src/data/menWomen'
import { SIDES, chapterQuestions, formatPoints, scoreQuestion } from '../../src/lib/chapterScore'

export { QUIZZES, formatPoints, scoreQuestion }
export type { ChapterQuestion, Quiz, QuizChapter }

export type Strategy = 'correct' | 'wrong' | 'partial'

export interface PlayableChapter {
  quiz: Quiz
  chapter: QuizChapter
  index: number
  questions: ChapterQuestion[]
  /** "quiz-id/chapter-id", used in test titles. */
  name: string
}

export const CHAPTERS: PlayableChapter[] = QUIZZES.filter((quiz) => quiz.format === 'chapter').flatMap((quiz) =>
  quiz.chapters.map((chapter, index) => ({ quiz, chapter, index, questions: chapterQuestions(quiz, chapter.id), name: `${quiz.id}/${chapter.id}` }))
    .filter(({ questions }) => questions.length > 0))

export const THEMES = QUIZZES.filter((quiz) => quiz.format === 'chapter' && hasChapterList(quiz))

export const chapterUrl = ({ quiz, chapter }: Pick<PlayableChapter, 'quiz' | 'chapter'>, params: Record<string, string> = {}) => {
  const q = new URLSearchParams({ quiz: quiz.id, ...(hasChapterList(quiz) && { chapter: chapter.id }), ...params })
  return `/#/discover?${q}`
}

const otherSide = (side: Side) => SIDES.find((entry) => entry !== side)!
/** A value at least `far + 1` away from `actual` when the scale allows it. */
const farFrom = (actual: number, max: number) => (actual > max / 2 ? 0 : max)
const nearMiss = (actual: number, near: number, max: number) => (actual + near + 1 <= max ? actual + near + 1 : actual - near - 1)

/** The warm-up value the UI driver produces for each unscored exercise. */
export function warmupPick(question: ChapterQuestion) {
  if (question.kind !== 'choice' || !question.warmup) return undefined
  const { warmup } = question
  if (warmup.kind === 'choice') return warmup.options[0].id
  if (warmup.kind === 'week') return '0.5,0.5'
  if (warmup.kind === 'holiday') return '0-0-s'
  return 'yes'
}

/** The stored pick for a strategy; `partial` falls back to wrong for single-answer questions. */
export function pickFor(question: ChapterQuestion, strategy: Strategy): string {
  if (question.kind === 'choice') {
    const main = strategy === 'correct' ? question.answer : question.options.find(({ id }) => id !== question.answer)!.id
    const warm = warmupPick(question)
    return warm === undefined ? main : `${main}|${warm}`
  }
  if (question.kind === 'rows') {
    return question.rows.map(({ answer }, i) => strategy === 'correct' || (strategy === 'partial' && i === 0) ? answer : otherSide(answer)).join(',')
  }
  const max = question.max ?? 100
  if (question.kind === 'estimate') {
    const actual = Math.round(question.actual)
    return String(strategy === 'correct' ? actual : strategy === 'partial' ? nearMiss(actual, question.near, max) : farFrom(actual, max))
  }
  const men = Math.round(question.actual.men)
  const women = Math.round(question.actual.women)
  if (strategy === 'correct') return `${men},${women}`
  if (strategy === 'partial') return `${men},${farFrom(women, max)}`
  return `${farFrom(men, max)},${farFrom(women, max)}`
}

/** Rotates strategies so one run mixes right, wrong and partly right answers. */
export const mixedStrategy = (i: number): Strategy => (['correct', 'wrong', 'partial'] as const)[i % 3]

export const pointsFor = (question: ChapterQuestion, pick: string) => {
  const points = scoreQuestion(question, pick)
  if (points === undefined) throw new Error(`Generated pick "${pick}" is not valid for ${question.id}`)
  return points
}

/** localStorage contents for answered questions, in the app's own format. */
export function seedProgress(chapter: PlayableChapter, strategy: Strategy | ((i: number) => Strategy), count = chapter.questions.length) {
  const pick = typeof strategy === 'function' ? strategy : () => strategy
  return Object.fromEntries(chapter.questions.slice(0, count).map((question, i) => [question.id, { pick: pickFor(question, pick(i)), edition: chapter.quiz.edition }]))
}

export const chapterPoints = (chapter: PlayableChapter, strategy: Strategy | ((i: number) => Strategy)) => {
  const pick = typeof strategy === 'function' ? strategy : () => strategy
  return chapter.questions.reduce((sum, question, i) => sum + pointsFor(question, pickFor(question, pick(i))), 0)
}

/** Every research link a quiz reveal shows. */
export function evidenceLinks() {
  const links = new Map<string, string[]>()
  for (const { questions, name } of CHAPTERS) {
    for (const question of questions) {
      const urls = question.evidence ? [question.evidence.url, ...(question.evidence.more ?? []).map(({ url }) => url)] : []
      for (const url of urls) links.set(url, [...(links.get(url) ?? []), `${name}/${question.id}`])
    }
  }
  return links
}
