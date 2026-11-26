import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quizById, quizQuestions } from '../src/data/quizzes'
import { FEES, FUNDS, GAP, LUMP, MM_CHAPTER, MM_QUESTIONS, WEALTH, finalValue } from '../src/data/moneySkills'
import { MH_QUESTIONS } from '../src/data/moneyHappiness'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { scoreQuestion } from '../src/lib/chapterScore'

const byId = (id: string) => MM_QUESTIONS.find((question) => question.id === id)!

test('"How good are you with money?" is the second Money & Happiness chapter, with 6 questions', () => {
  const quiz = quizById('money-happiness')!
  const chapter = quiz.chapters[1]
  assert.equal(chapter.id, 'good-with-money')
  assert.equal(chapter.title, 'How good are you with money?')
  assert.equal(chapter.summary, 'From everyday spending to building wealth. How many of your financial instincts hold up against the evidence?')
  assert.deepEqual(chapter.questionIds, MM_QUESTIONS.map(({ id }) => id))
  assert.equal(MM_QUESTIONS.length, 6)
  assert.equal(quiz.attemptKey, 'data-detective.quiz.money-happiness.v1')
  assert.equal(quiz.edition, 'v1')
  assert.equal(quizQuestions(quiz).length, MH_QUESTIONS.length + MM_QUESTIONS.length)
  assert.equal(MM_CHAPTER.minutes, '5–6')
  for (const question of MM_QUESTIONS) {
    assert.equal(CHAPTER_QUESTIONS[question.id], question)
    for (const { url } of [question.evidence!, ...(question.evidence!.more ?? [])]) assert.match(url, /^https:\/\//)
    if (question.kind === 'choice') assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
  }
})

test('Money answers match the audited sources', () => {
  assert.equal(LUMP.lumpBeatsAveraging, 68)
  assert.equal(byId('mm-lumpsum').kind === 'estimate' && byId('mm-lumpsum').actual, 68)
  assert.equal(FUNDS.start, 512)
  assert.deepEqual(FUNDS.years.map(({ share }) => share), [5.27, 0, 0, 0])
  assert.equal(byId('mm-funds').kind === 'estimate' && byId('mm-funds').actual, 0)
  assert.deepEqual([GAP.total, GAP.investor, GAP.stocks.total, GAP.stocks.investor], [9.9, 8.7, 13.3, 12.8])
  assert.deepEqual([WEALTH.planning, WEALTH.selfControl, WEALTH.numeracy], [0.222, 0.106, 0.101])
  assert.ok(WEALTH.planning > WEALTH.selfControl && WEALTH.planning > WEALTH.numeracy)
  for (const [id, answer] of [['mm-gap', 'lower'], ['mm-cashless', 'cashless'], ['mm-wealth', 'planning']] as const) {
    const question = byId(id)
    assert.equal(question.kind === 'choice' && question.answer, answer, id)
  }
})

test('the fee illustration is recomputed, not hard-coded', () => {
  const cheap = finalValue(FEES.amount, FEES.gross, FEES.cheap, FEES.years)
  const dear = finalValue(FEES.amount, FEES.gross, FEES.dear, FEES.years)
  assert.equal(Math.round(cheap), 740169)
  assert.equal(Math.round(dear), 574349)
  const fees = byId('mm-fees')
  assert.equal(fees.kind === 'estimate' && fees.actual, 166)
  assert.equal(fees.kind === 'estimate' && fees.max, 400)
  assert.equal(finalValue(100, 5, 0, 0), 100)
})

test('money estimates score 1, ½ or 0 and the cash warmup is required', () => {
  assert.equal(scoreQuestion(byId('mm-lumpsum'), '70'), 1)
  assert.equal(scoreQuestion(byId('mm-lumpsum'), '55'), 0.5)
  assert.equal(scoreQuestion(byId('mm-lumpsum'), '30'), 0)
  assert.equal(scoreQuestion(byId('mm-funds'), '3'), 1)
  assert.equal(scoreQuestion(byId('mm-funds'), '8'), 0.5)
  assert.equal(scoreQuestion(byId('mm-funds'), '25'), 0)
  assert.equal(scoreQuestion(byId('mm-fees'), '150'), 1)
  assert.equal(scoreQuestion(byId('mm-fees'), '120'), 0.5)
  assert.equal(scoreQuestion(byId('mm-fees'), '50'), 0)
  assert.equal(scoreQuestion(byId('mm-cashless'), 'cashless|yes'), 1)
  assert.equal(scoreQuestion(byId('mm-cashless'), 'cash|no'), 0)
  assert.equal(scoreQuestion(byId('mm-cashless'), 'cashless'), undefined)
})
