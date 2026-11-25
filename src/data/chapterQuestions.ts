import { LOVE_QUESTIONS, type ChapterQuestion } from './menWomen'
import { MONEY_QUESTIONS } from './moneyPower'
import { NATURE_QUESTIONS } from './natureNurture'
import { HOUSING_QUESTIONS } from './housing'
import { MH_QUESTIONS } from './moneyHappiness'
import { WORLD_QUESTIONS } from './worldQuestions'

export const CHAPTER_QUESTIONS: Readonly<Record<string, ChapterQuestion>> =
  Object.fromEntries([...WORLD_QUESTIONS, ...LOVE_QUESTIONS, ...MONEY_QUESTIONS, ...NATURE_QUESTIONS, ...HOUSING_QUESTIONS, ...MH_QUESTIONS].map((question) => [question.id, question]))
