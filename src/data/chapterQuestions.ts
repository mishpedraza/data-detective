import { LOVE_QUESTIONS, type ChapterQuestion } from './menWomen'
import { MONEY_QUESTIONS, MONEY_RETIRED_IDS } from './moneyPower'
import { NATURE_QUESTIONS } from './natureNurture'
import { HOUSING_QUESTIONS } from './housing'
import { CITIES_QUESTIONS } from './cities'
import { MH_QUESTIONS } from './moneyHappiness'
import { HEALTH_QUESTIONS } from './health'
import { WORLD_QUESTIONS } from './worldQuestions'
import { MIND_QUESTIONS } from './humanMind'

export const CHAPTER_QUESTIONS: Readonly<Record<string, ChapterQuestion>> =
  Object.fromEntries([...WORLD_QUESTIONS, ...LOVE_QUESTIONS, ...MONEY_QUESTIONS, ...NATURE_QUESTIONS, ...HOUSING_QUESTIONS, ...CITIES_QUESTIONS, ...MH_QUESTIONS, ...MIND_QUESTIONS, ...HEALTH_QUESTIONS].map((question) => [question.id, question]))

/** Retired question id → the question that replaced it. */
export const QUESTION_ALIASES: Readonly<Record<string, string>> = { ...MONEY_RETIRED_IDS }
