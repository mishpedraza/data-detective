import { LOVE_QUESTIONS, type ChapterQuestion } from './menWomen'
import { MONEY_QUESTIONS } from './moneyPower'
import { NATURE_QUESTIONS } from './natureNurture'
import { HOUSING_QUESTIONS } from './housing'
import { WORLD_QUESTIONS } from './worldQuestions'
import { MIND_QUESTIONS } from './humanMind'

export const CHAPTER_QUESTIONS: Readonly<Record<string, ChapterQuestion>> =
  Object.fromEntries([...WORLD_QUESTIONS, ...LOVE_QUESTIONS, ...MONEY_QUESTIONS, ...NATURE_QUESTIONS, ...HOUSING_QUESTIONS, ...MIND_QUESTIONS].map((question) => [question.id, question]))
