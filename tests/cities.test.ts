import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quizById } from '../src/data/quizzes'
import { CITIES_CHAPTER, CITIES_QUESTIONS, COOLING, ROADS } from '../src/data/cities'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { scoreQuestion } from '../src/lib/chapterScore'

test('"The surprising science of cities" is the second housing chapter', () => {
  const quiz = quizById('housing-crisis')!
  assert.deepEqual(quiz.chapters.map(({ id }) => id), ['why-so-expensive', CITIES_CHAPTER.id])
  assert.equal(quiz.chapters[1].title, 'The surprising science of cities')
  assert.deepEqual(quiz.chapters[1].questionIds, CITIES_QUESTIONS.map(({ id }) => id))
  assert.equal(new Set(CITIES_QUESTIONS.map(({ id }) => id)).size, CITIES_QUESTIONS.length)
})

test('city questions are registered, sourced and score one point each', () => {
  for (const question of CITIES_QUESTIONS) {
    assert.equal(CHAPTER_QUESTIONS[question.id], question)
    for (const { url } of [question.evidence!, ...(question.evidence!.more ?? [])]) assert.match(url, /^https:\/\//)
    assert.equal(question.kind, 'choice', question.id)
    if (question.kind !== 'choice') continue
    assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
    assert.equal(scoreQuestion(question, question.answer), 1)
    assert.equal(scoreQuestion(question, question.options.find(({ id }) => id !== question.answer)!.id), 0)
  }
})

test('city figures match the audited sources', () => {
  assert.equal(COOLING.find(({ id }) => id === 'cool')!.change, -1.2)
  assert.equal(ROADS.capacity * ROADS.flowElasticity, 5)
  assert.equal(ROADS.capacity * ROADS.timeElasticity, 7)
  const answer = (id: string) => { const q = CITIES_QUESTIONS.find((entry) => entry.id === id)!; return q.kind === 'choice' ? q.answer : undefined }
  assert.equal(answer('ct-roads'), 'more-faster')
  assert.equal(answer('ct-bikelanes'), 'varies')
  assert.equal(answer('ct-tourism'), 'lower')
})
