import type { ChapterQuestion, Side } from '../data/menWomen'
import { CHAPTER_QUESTIONS } from '../data/chapterQuestions'
import type { Quiz } from '../data/quizzes'
import type { DiscoveryProgress } from './discoveryProgress'

export const SIDES: readonly Side[] = ['men', 'similar', 'women']

export function parseRows(question: ChapterQuestion, pick: string): Side[] | undefined {
  if (question.kind !== 'rows') return
  const sides = pick.split(',')
  return sides.length === question.rows.length && sides.every((side) => (SIDES as string[]).includes(side)) ? sides as Side[] : undefined
}

export function parseSliders(question: ChapterQuestion, pick: string): { men: number; women: number } | undefined {
  if (question.kind !== 'sliders' || !/^\d{1,3},\d{1,3}$/.test(pick)) return
  const [men, women] = pick.split(',').map(Number)
  return men <= 100 && women <= 100 ? { men, women } : undefined
}

/** Half a point per estimate within 5 points of the real figure, a quarter within 15. */
export function estimatePoints(estimate: number, actual: number) {
  const error = Math.abs(estimate - actual)
  return error <= 5 ? 0.5 : error <= 15 ? 0.25 : 0
}

/** Points for a pick, from 0 to 1, or undefined if the pick isn't a valid answer to the question. */
export function scoreQuestion(question: ChapterQuestion, pick: string): number | undefined {
  if (question.kind === 'choice') return question.options.some(({ id }) => id === pick) ? Number(pick === question.answer) : undefined
  if (question.kind === 'rows') {
    const sides = parseRows(question, pick)
    return sides && sides.filter((side, i) => side === question.rows[i].answer).length * 0.25
  }
  const estimates = parseSliders(question, pick)
  return estimates && estimatePoints(estimates.men, question.actual.men) + estimatePoints(estimates.women, question.actual.women)
}

export type ChapterAnswer = { id: string; pick: string; points: number }

export function chapterAnswers(progress: DiscoveryProgress, questions: readonly ChapterQuestion[], edition: string): ChapterAnswer[] {
  return questions.flatMap(({ id }, i) => {
    const visit = progress[id]
    const points = visit?.edition === edition ? scoreQuestion(questions[i], visit.pick) : undefined
    return points === undefined ? [] : [{ id, pick: visit!.pick, points }]
  })
}

export const totalPoints = (answers: readonly { points: number }[]) => answers.reduce((sum, { points }) => sum + points, 0)

/** 5 → "5", 5.5 → "5.5", 5.25 → "5.25". */
export const formatPoints = (points: number) => Number.isInteger(points) ? String(points) : points.toFixed(2).replace(/0$/, '')

export function chapterResult(points: number, total: number) {
  const share = total ? points / total : 0
  if (share >= 6 / 7) return 'The evidence rarely caught you out.'
  if (share >= 4 / 7) return 'A few assumptions didn’t survive the data.'
  if (share >= 2 / 7) return 'Plenty of surprises. That’s the point.'
  return 'You just learned more than most people ever check.'
}

export function chapterQuestions(quiz: Quiz): ChapterQuestion[] {
  return quiz.chapters.flatMap(({ questionIds }) => questionIds.flatMap((id) => CHAPTER_QUESTIONS[id] ? [CHAPTER_QUESTIONS[id]] : []))
}

/** Saves an answer once; going back to a question keeps the first prediction. */
export function recordAnswer(progress: DiscoveryProgress, id: string, pick: string, edition: string): DiscoveryProgress {
  return progress[id]?.edition === edition ? progress : { ...progress, [id]: { pick, edition } }
}

const erf = (x: number) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return x >= 0 ? y : -y
}

/** Overlap of two equal-variance normal curves `d` standard deviations apart. */
export const overlap = (d: number) => 1 + erf(-d / 2 / Math.SQRT2)
