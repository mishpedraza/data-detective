import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quizById, quizQuestions } from '../src/data/quizzes'
import { MH_QUESTIONS } from '../src/data/moneyHappiness'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { parseHoliday, scoreQuestion } from '../src/lib/chapterScore'

const byId = (id: string) => MH_QUESTIONS.find((question) => question.id === id)!

test('Money & Happiness plays "What actually makes us happy?" as its own chapter', () => {
  const quiz = quizById('money-happiness')!
  assert.equal(quiz.title, 'Money & Happiness')
  assert.equal(quiz.format, 'chapter')
  assert.equal(quiz.chapters.length, 1)
  assert.equal(quiz.chapters[0].title, 'What actually makes us happy?')
  assert.deepEqual(quizQuestions(quiz).map(({ id }) => id), MH_QUESTIONS.map(({ id }) => id))
  assert.notEqual(quiz.attemptKey, quizById('housing-crisis')!.attemptKey)
  for (const question of MH_QUESTIONS) {
    assert.equal(CHAPTER_QUESTIONS[question.id], question)
    for (const { url } of [question.evidence!, ...(question.evidence!.more ?? [])]) assert.match(url, /^https:\/\//)
    if (question.kind === 'choice') assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
  }
})

test('Money & Happiness answers match the audited sources', () => {
  const answer = (id: string) => { const q = byId(id); return q.kind === 'choice' ? q.answer : q.kind === 'estimate' ? q.actual : undefined }
  assert.equal(answer('mh-income'), 'none')
  assert.equal(answer('mh-rank'), 80)
  assert.equal(answer('mh-smarts'), 'edu-up')
  assert.equal(answer('mh-aspirations'), 'intrinsic')
  assert.equal(answer('mh-youth'), 'mixed')
  assert.equal(answer('mh-giving'), 'other')
  assert.equal(answer('mh-choice'), 'less-more')
})

test('income rank scores 1 within 5 points and ½ within 15', () => {
  const rank = byId('mh-rank')
  assert.equal(scoreQuestion(rank, '78'), 1)
  assert.equal(scoreQuestion(rank, '68'), 0.5)
  assert.equal(scoreQuestion(rank, '40'), 0)
})

test('the choice question needs the unscored holiday exercise first', () => {
  const choice = byId('mh-choice')
  assert.deepEqual(parseHoliday('2-15-l'), { short: 2, long: 15, feel: 'l' })
  assert.equal(parseHoliday('4-1-s'), undefined)
  assert.equal(parseHoliday('1-16-s'), undefined)
  assert.equal(scoreQuestion(choice, 'less-more|0-3-s'), 1)
  assert.equal(scoreQuestion(choice, 'more-more|0-3-n'), 0)
  assert.equal(scoreQuestion(choice, 'less-more'), undefined)
})
