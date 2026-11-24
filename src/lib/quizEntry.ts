import { hasChapterList, type Quiz } from '../data/quizzes'
import type { MouseEvent } from 'react'
import { chapterAnswers, chapterQuestions, formatPoints, totalPoints } from './chapterScore'
import { readDiscoveryProgress } from './discoveryProgress'
import { hrefFor } from './route'

/** Where playing a chapter starts: the next unanswered question, or the results once every question is answered. */
export function chapterEntry(quiz: Quiz, chapterId: string) {
  const questions = chapterQuestions(quiz, chapterId)
  const answers = chapterAnswers(readDiscoveryProgress(quiz.attemptKey), questions, quiz.edition)
  const next = questions.find(({ id }) => !answers.some((answer) => answer.id === id))
  const base = { quiz: quiz.id, ...(hasChapterList(quiz) && { chapter: chapterId }) }
  return {
    questions,
    answers,
    href: hrefFor('discover', next ? { ...base, q: next.id, mode: 'challenge' } : { ...base, mode: 'results' }),
    event: !next ? 'quiz_results_opened' : answers.length ? 'quiz_resumed' : 'quiz_started',
  }
}

export function follow(navigate: (href: string) => void, href: string, then?: () => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    then?.()
    navigate(href)
  }
}

export type Scored = { id: string; points: number }

/** Card copy for a chapter: its size, how far the player got, and the matching call to action. */
export function playStatus(questions: readonly { id: string }[], answers: readonly Scored[], minutes?: number | string) {
  const meta = `${questions.length} questions${minutes ? ` · ${minutes} min` : ''}`
  if (answers.length === questions.length && questions.length) {
    return { meta, progress: `You scored ${formatPoints(totalPoints(answers))}/${questions.length}`, action: 'Play again' }
  }
  if (answers.length) return { meta, progress: `${answers.length} of ${questions.length} answered`, action: 'Resume quiz' }
  return { meta, progress: '', action: 'Play quiz' }
}
