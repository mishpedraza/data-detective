import { LOVE_QUESTIONS, type ChapterQuestion } from './menWomen'
import { WORLD_QUESTIONS } from './worldQuestions'

export const CHAPTER_QUESTIONS: Readonly<Record<string, ChapterQuestion>> =
  Object.fromEntries([...WORLD_QUESTIONS, ...LOVE_QUESTIONS].map((question) => [question.id, question]))
