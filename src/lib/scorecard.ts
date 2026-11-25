import { formatPoints } from './chapterScore'

export const SHARE_MESSAGE = 'Can you beat my score on Data Detective?'
/** The message for sharing a quiz before finishing it; it carries no score. */
export const inviteMessage = (title: string) => `Try this quiz on Data Detective: “${title}”`

export type Scorecard =
  | { kind: 'quiz'; theme: string; title: string; points: number; total: number; sequence: number[]; accent: string }
  | { kind: 'theme'; prompt: string; points: number; total: number; parts: { title: string; points: number; total: number }[]; accent: string }

export const scoreLabel = (points: number, total: number) => `${formatPoints(points)}/${total}`

/** The score in words, sent with the quiz link. */
export const scoreSummary = (card: Scorecard) => card.kind === 'quiz'
  ? `I scored ${scoreLabel(card.points, card.total)} on “${card.title}”.`
  : `I scored ${scoreLabel(card.points, card.total)} across all ${card.parts.length} quizzes of “${card.prompt}”`
