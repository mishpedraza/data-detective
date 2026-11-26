import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quizById, quizQuestions } from '../src/data/quizzes'
import { HOUSING_QUESTIONS } from '../src/data/housing'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { scoreQuestion } from '../src/lib/chapterScore'

test('Housing & Cities plays "Why is housing so expensive?" as an 8-question chapter', () => {
  const quiz = quizById('housing-crisis')!
  assert.equal(quiz.format, 'chapter')
  assert.equal(quiz.chapters.length, 2)
  assert.equal(quiz.chapters[0].title, 'Why is housing so expensive?')
  assert.deepEqual(quiz.chapters[0].questionIds, HOUSING_QUESTIONS.map(({ id }) => id))
  assert.equal(quizQuestions(quiz).length, HOUSING_QUESTIONS.length + quiz.chapters[1].questionIds.length)
  assert.equal(HOUSING_QUESTIONS.length, 8)
  for (const question of HOUSING_QUESTIONS) {
    assert.equal(CHAPTER_QUESTIONS[question.id], question)
    for (const { url } of [question.evidence!, ...(question.evidence!.more ?? [])]) assert.match(url, /^https:\/\//)
    if (question.kind === 'choice') assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
  }
})

test('housing sliders score against the verified figures and their own ranges', () => {
  const airbnb = HOUSING_QUESTIONS.find(({ id }) => id === 'hs-airbnb')!
  const permits = HOUSING_QUESTIONS.find(({ id }) => id === 'hs-permits')!
  assert.equal(scoreQuestion(airbnb, '2'), 1)
  assert.equal(scoreQuestion(airbnb, '6'), 0.5)
  assert.equal(scoreQuestion(airbnb, '15'), 0)
  assert.equal(scoreQuestion(airbnb, '31'), undefined)
  assert.equal(scoreQuestion(permits, '60'), 1)
  assert.equal(scoreQuestion(permits, '70'), 0.5)
  assert.equal(scoreQuestion(permits, '150'), 0)
  assert.equal(scoreQuestion(permits, '151'), undefined)
})

test('housing answers match the audited sources', () => {
  const answer = (id: string) => { const q = HOUSING_QUESTIONS.find((entry) => entry.id === id)!; return q.kind === 'choice' ? q.answer : q.kind === 'estimate' ? q.actual : undefined }
  assert.equal(answer('hs-chain'), 'both')
  assert.equal(answer('hs-rentcontrol'), 'down')
  assert.equal(answer('hs-airbnb'), 1.9)
  assert.equal(answer('hs-catalonia'), 'differ')
  assert.equal(answer('hs-ratio'), '40')
  assert.equal(answer('hs-vacant'), 'small')
  assert.equal(answer('hs-permits'), 57)
  assert.equal(answer('hs-auckland'), '23l')
})
