import { formatPoints } from './chapterScore'

export const SHARE_MESSAGE = 'A few of the answers surprised me. Curious how you’d do?'
/** The message for sharing a quiz before finishing it; it carries no score. */
export const inviteMessage = (title: string) => `Try “${title}” on Data Detective. How many of your hunches hold up?`

export type Scorecard =
  | { kind: 'quiz'; theme: string; title: string; points: number; total: number; sequence: number[]; accent: string }
  | { kind: 'theme'; prompt: string; points: number; total: number; parts: { title: string; points: number; total: number }[]; accent: string }

export const scoreLabel = (points: number, total: number) => `${formatPoints(points)}/${total}`

/** The score in words, sent with the quiz link. */
export const scoreSummary = (card: Scorecard) => card.kind === 'quiz'
  ? `I scored ${scoreLabel(card.points, card.total)} on “${card.title}”.`
  : `I scored ${scoreLabel(card.points, card.total)} across all ${card.parts.length} quizzes of “${card.prompt}”`
