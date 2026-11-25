import assert from 'node:assert/strict'
import test from 'node:test'
import { ALCOHOL, FIT_FAT, HEALTH_QUESTIONS, SLEEP, SLEEP_WEEKS, STEPS } from '../src/data/health'
import { quizById } from '../src/data/quizzes'
import { scoreQuestion } from '../src/lib/chapterScore'

test('Health & Longevity is a seven-question theme', () => {
  const quiz = quizById('health-longevity')
  assert.ok(quiz)
  assert.equal(quiz.title, 'Health & Longevity')
  assert.deepEqual(quiz.chapters[0].questionIds, HEALTH_QUESTIONS.map(({ id }) => id))
  assert.equal(HEALTH_QUESTIONS.length, 7)
})

test('every question has a valid answer and a DOI source', () => {
  for (const question of HEALTH_QUESTIONS) {
    assert.equal(question.kind, 'choice')
    if (question.kind !== 'choice') continue
    assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
    assert.equal(scoreQuestion(question, question.answer), 1)
    assert.match(question.evidence?.url ?? '', /^https:\/\/doi\.org\//)
  }
})

test('audited figures', () => {
  assert.deepEqual(FIT_FAT.map(({ hr }) => hr), [1, 0.96, 1.11, 1.92, 1.82, 2.04])
  assert.equal(SLEEP.full.hr, 0.7)
  assert.deepEqual(STEPS.map(({ hr }) => hr), [1, 0.6, 0.55, 0.47])
  assert.equal(ALCOHOL.find(({ id }) => id === 'low')?.adjusted.rr, 0.93)
})

test('both illustrative sleep weeks average eight hours', () => {
  for (const week of Object.values(SLEEP_WEEKS)) assert.equal(week.reduce((sum, [, hours]) => sum + hours, 0) / 7, 8)
})
