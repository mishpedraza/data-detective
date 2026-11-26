import { hasChapterList, type Quiz, type QuizChapter } from '../data/quizzes'
import { chapterAnswers, chapterQuestions, maxPoints, totalPoints, type ChapterAnswer } from './chapterScore'
import { readDiscoveryProgress, type DiscoveryProgress } from './discoveryProgress'

export type QuizState = 'not-started' | 'in-progress' | 'completed'

export interface ChapterProgress {
  chapter: QuizChapter
  questionIds: string[]
  answers: ChapterAnswer[]
  /** Every question is worth up to one point, so the maximum equals the question count. */
  total: number
  points: number
  state: QuizState
}

export interface ThemeProgress {
  quiz: Quiz
  chapters: ChapterProgress[]
  completed: number
  points: number
  total: number
  /** Combined results exist only for themes with more than one quiz, once every one is finished. */
  complete: boolean
}

export function chapterProgress(quiz: Quiz, chapter: QuizChapter, progress: DiscoveryProgress = readDiscoveryProgress(quiz.attemptKey)): ChapterProgress {
  const questions = chapterQuestions(quiz, chapter.id)
  const answers = chapterAnswers(progress, questions, quiz.edition)
  const state: QuizState = !answers.length ? 'not-started' : answers.length === questions.length ? 'completed' : 'in-progress'
  return { chapter, questionIds: questions.map(({ id }) => id), answers, total: maxPoints(questions), points: totalPoints(answers), state }
}

export function themeProgress(quiz: Quiz, progress: DiscoveryProgress = readDiscoveryProgress(quiz.attemptKey)): ThemeProgress {
  const chapters = quiz.chapters.map((chapter) => chapterProgress(quiz, chapter, progress)).filter(({ questionIds }) => questionIds.length > 0)
  const completed = chapters.filter(({ state }) => state === 'completed').length
  return {
    quiz,
    chapters,
    completed,
    points: chapters.reduce((sum, { points }) => sum + points, 0),
    total: chapters.reduce((sum, { total }) => sum + total, 0),
    complete: hasChapterList(quiz) && chapters.length > 1 && completed === chapters.length,
  }
}

/** Points per question in order, for the scorecard's performance strip; it never reveals the picks. */
export const pointSequence = ({ questionIds, answers }: ChapterProgress) =>
  questionIds.map((id) => answers.find((answer) => answer.id === id)?.points ?? 0)

/** Names the theme's question set, so comparisons never mix different editions or line-ups of quizzes. */
export const themeVersion = (quiz: Quiz) => `${quiz.edition}:${quiz.chapters.map(({ id }) => id).join('+')}`
