import type { ChapterQuestion, ChoiceQuestion, Side } from '../data/menWomen'
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
  const max = question.max ?? 100
  return men <= max && women <= max ? { men, women } : undefined
}

export function parseEstimate(question: ChapterQuestion, pick: string): number | undefined {
  if (question.kind !== 'estimate' || !/^\d{1,3}$/.test(pick)) return
  const value = Number(pick)
  return value <= (question.max ?? 100) ? value : undefined
}

/** A choice with a warm-up stores both as "answer|warm-up"; the warm-up is never scored. */
export function splitPick(pick: string) {
  const [main, warm] = pick.split('|')
  return { main, warm }
}

/** Days a week, in half days, for "you,partner" week warm-ups. */
export function parseWeek(warm?: string): [number, number] | undefined {
  if (!warm || !/^\d(\.5)?,\d(\.5)?$/.test(warm)) return
  const days = warm.split(',').map(Number) as [number, number]
  return days.every((day) => day <= 5) ? days : undefined
}

function validWarmup(question: ChoiceQuestion, warm?: string) {
  if (!question.warmup) return warm === undefined
  if (question.warmup.kind === 'week') return !!parseWeek(warm)
  if (question.warmup.kind === 'words') return warm === 'yes' || warm === 'no'
  return question.warmup.options.some(({ id }) => id === warm)
}

/** Half a point per estimate within `near` of the real figure, a quarter within `far`. */
export function estimatePoints(estimate: number, actual: number, near = 5, far = 15) {
  const error = Math.abs(estimate - actual)
  return error <= near ? 0.5 : error <= far ? 0.25 : 0
}

/** Points for a pick, from 0 to 1, or undefined if the pick isn't a valid answer to the question. */
export function scoreQuestion(question: ChapterQuestion, pick: string): number | undefined {
  if (question.kind === 'choice') {
    const { main, warm } = splitPick(pick)
    return question.options.some(({ id }) => id === main) && validWarmup(question, warm) ? Number(main === question.answer) : undefined
  }
  if (question.kind === 'rows') {
    const sides = parseRows(question, pick)
    return sides && sides.filter((side, i) => side === question.rows[i].answer).length / question.rows.length
  }
  if (question.kind === 'estimate') {
    const value = parseEstimate(question, pick)
    if (value === undefined) return
    const error = Math.abs(value - question.actual)
    return error <= question.near ? 1 : error <= question.far ? 0.5 : 0
  }
  const estimates = parseSliders(question, pick)
  const { near = 5, far = 15 } = question
  return estimates && estimatePoints(estimates.men, question.actual.men, near, far) + estimatePoints(estimates.women, question.actual.women, near, far)
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

export function chapterQuestions(quiz: Quiz, chapterId?: string): ChapterQuestion[] {
  return quiz.chapters.filter(({ id }) => !chapterId || id === chapterId).flatMap(({ questionIds }) => questionIds.flatMap((id) => CHAPTER_QUESTIONS[id] ? [CHAPTER_QUESTIONS[id]] : []))
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
