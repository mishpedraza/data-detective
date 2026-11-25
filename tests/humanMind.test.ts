import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quizById, quizQuestions } from '../src/data/quizzes'
import { IDEAS, IDEAS_GROUPS, LIES, LURE, MIND_QUESTIONS, NEWS, SLEEP_LIST } from '../src/data/humanMind'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { scoreQuestion } from '../src/lib/chapterScore'

test('The Human Mind plays "How easily can your brain fool you?" as one chapter', () => {
  const quiz = quizById('human-mind')!
  assert.equal(quiz.title, 'The Human Mind')
  assert.equal(quiz.format, 'chapter')
  assert.equal(quiz.chapters[0].title, 'How easily can your brain fool you?')
  assert.deepEqual(quizQuestions(quiz).map(({ id }) => id), MIND_QUESTIONS.map(({ id }) => id))
  for (const question of MIND_QUESTIONS) {
    assert.equal(CHAPTER_QUESTIONS[question.id], question)
    for (const { url } of [question.evidence!, ...(question.evidence!.more ?? [])]) assert.match(url, /^https:\/\/doi\.org\//)
    if (question.kind === 'choice') assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
  }
})

test('personal exercises are never scored: only the research prediction counts', () => {
  const half = MIND_QUESTIONS.find(({ id }) => id === 'hm-halfstory')!
  const lure = MIND_QUESTIONS.find(({ id }) => id === 'hm-lure')!
  assert.equal(scoreQuestion(half, 'same|merge'), 1)
  assert.equal(scoreQuestion(half, 'same|separate'), 1)
  assert.equal(scoreQuestion(half, 'less|merge'), 0)
  assert.equal(scoreQuestion(half, 'same'), undefined)
  assert.equal(scoreQuestion(lure, 'most|yes'), 1)
  assert.equal(scoreQuestion(lure, 'most|no'), 1)
  assert.equal(scoreQuestion(lure, 'rare|yes'), 0)
  assert.equal(scoreQuestion(lure, 'most|maybe'), undefined)
})

test('Human Mind figures match the audited sources', () => {
  assert.deepEqual([NEWS.trueRight, NEWS.falseRight, NEWS.people, NEWS.experiments], [68.51, 67.24, 11_561, 31])
  assert.deepEqual([LIES.human, LIES.algorithm, LIES.accuse, LIES.accuseRight], [46.47, 66.86, 19.22, 40.82])
  assert.deepEqual([LURE.hits, LURE.lure], [86, 84])
  assert.equal(SLEEP_LIST.length, 15)
  assert.ok(!SLEEP_LIST.includes('sleep' as never))
})

test('Q7 brainstorming shows only the directions the 2022–2026 abstracts report', () => {
  const q = MIND_QUESTIONS.find(({ id }) => id === 'hm-brainstorm')!
  assert.equal(MIND_QUESTIONS.length, 7)
  assert.equal(MIND_QUESTIONS.at(-1), q)
  assert.equal(q.kind === 'choice' && q.answer, 'split')
  assert.deepEqual([q.evidence!.url, ...q.evidence!.more!.map(({ url }) => url)], ['https://doi.org/10.1002/jocb.70058', 'https://doi.org/10.1080/1041794X.2026.2638815', 'https://doi.org/10.1038/s41586-022-04643-y'])
  assert.deepEqual(IDEAS.filter(({ winner }) => winner === 'write').map(({ study }) => study), [2025, 2025, 2025])
  assert.deepEqual(IDEAS.filter(({ winner }) => winner === 'talk').map(({ study }) => study), [2026, 2026])
  assert.deepEqual([IDEAS_GROUPS.online, IDEAS_GROUPS.students, IDEAS_GROUPS.cohesion], [57, 157, 54])
})
