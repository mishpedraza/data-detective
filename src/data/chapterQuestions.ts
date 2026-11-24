import { LOVE_QUESTIONS, type ChapterQuestion } from './menWomen'
import { MONEY_QUESTIONS } from './moneyPower'
import { WORLD_QUESTIONS } from './worldQuestions'

export const CHAPTER_QUESTIONS: Readonly<Record<string, ChapterQuestion>> =
  Object.fromEntries([...WORLD_QUESTIONS, ...LOVE_QUESTIONS, ...MONEY_QUESTIONS].map((question) => [question.id, question]))
