import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_QUIZ, quizById, quizQuestions } from '../src/data/quizzes'
import { LOVE_QUESTIONS, type ChapterQuestion } from '../src/data/menWomen'
import { chapterAnswers, chapterQuestions, estimatePoints, formatPoints, overlap, recordAnswer, scoreQuestion, totalPoints } from '../src/lib/chapterScore'
import { challengeAnswers } from '../src/lib/discoveryChallenge'
import { revealDiscovery, type DiscoveryProgress } from '../src/lib/discoveryProgress'
import { hrefFor } from '../src/lib/route'

const quiz = quizById('men-and-women')!
const byId = (id: string) => LOVE_QUESTIONS.find((question) => question.id === id) as ChapterQuestion

test('the Men & Women quiz plays the seven Love, attraction & relationships questions', () => {
  assert.equal(quiz.format, 'chapter')
  assert.deepEqual(quiz.chapters.map(({ id, title }) => [id, title]), [['love-attraction', 'Love, attraction & relationships']])
  assert.equal(chapterQuestions(quiz).length, 7)
  assert.deepEqual(quizQuestions(quiz).map(({ id }) => id), LOVE_QUESTIONS.map(({ id }) => id))
  assert.equal(hrefFor('discover', { quiz: quiz.id, q: LOVE_QUESTIONS[0].id }), '#/discover?quiz=men-and-women&q=mw-age-attraction')
  for (const question of LOVE_QUESTIONS) {
    assert.match(question.evidence.url, /^https:\/\//)
    if (question.kind === 'choice') assert.ok(question.options.some(({ id }) => id === question.answer), question.id)
  }
})

test('multiple choice scores one point for the right answer and rejects unknown picks', () => {
  const q = byId('mw-age-attraction')
  assert.equal(scoreQuestion(q, 'younger'), 1)
  assert.equal(scoreQuestion(q, 'mirror'), 0)
  assert.equal(scoreQuestion(q, 'nonsense'), undefined)
})

test('singlehood scores a quarter point per matching prediction', () => {
  const q = byId('mw-singlehood')
  assert.equal(scoreQuestion(q, 'women,women,women,men'), 1)
  assert.equal(scoreQuestion(q, 'women,similar,men,men'), 0.5)
  assert.equal(scoreQuestion(q, 'men,men,men,women'), 0)
  assert.equal(scoreQuestion(q, 'women,women,women'), undefined)
  assert.equal(scoreQuestion(q, 'women,women,women,both'), undefined)
})

test('support estimates are scored independently by absolute error', () => {
  assert.equal(estimatePoints(74, 74), 0.5)
  assert.equal(estimatePoints(69, 74), 0.5)
  assert.equal(estimatePoints(68, 74), 0.25)
  assert.equal(estimatePoints(89, 74), 0.25)
  assert.equal(estimatePoints(90, 74), 0)
  const q = byId('mw-support')
  assert.equal(scoreQuestion(q, '70,80'), 0.75)
  assert.equal(scoreQuestion(q, '50,95'), 0)
  assert.equal(scoreQuestion(q, '101,50'), undefined)
  assert.equal(scoreQuestion(q, '50'), undefined)
})

test('the total is out of seven and keeps partial points', () => {
  let progress: DiscoveryProgress = {}
  const picks: Record<string, string> = { 'mw-age-attraction': 'younger', 'mw-looks-money': 'split', 'mw-first-move': 'gone',
    'mw-desire': 'remains', 'mw-singlehood': 'women,similar,women,men', 'mw-support': '60,74', 'mw-loneliness': 'age' }
  for (const [id, pick] of Object.entries(picks)) progress = recordAnswer(progress, id, pick, quiz.edition)
  const answers = chapterAnswers(progress, chapterQuestions(quiz), quiz.edition)
  assert.equal(answers.length, 7)
  assert.equal(totalPoints(answers), 4 + 0.75 + 0.75)
  assert.equal(formatPoints(6.5), '6.5')
  assert.equal(formatPoints(5.25), '5.25')
  assert.equal(formatPoints(7), '7')
})

test('going back to an answered question keeps the first prediction', () => {
  const first = recordAnswer({}, 'mw-desire', 'vanishes', quiz.edition)
  assert.equal(recordAnswer(first, 'mw-desire', 'remains', quiz.edition), first)
  assert.equal(chapterAnswers(first, chapterQuestions(quiz), quiz.edition)[0].points, 0)
  assert.equal(chapterAnswers(first, chapterQuestions(quiz), 'v0').length, 0)
})

test('progress is independent from the World quiz', () => {
  assert.notEqual(quiz.attemptKey, DEFAULT_QUIZ.attemptKey)
  assert.notEqual(quiz.resultKey, DEFAULT_QUIZ.resultKey)
  const world = quizQuestions(DEFAULT_QUIZ)[0].id
  const mixed = recordAnswer(revealDiscovery({}, world, 'x', 'x', DEFAULT_QUIZ.edition), 'mw-loneliness', 'age', quiz.edition)
  assert.deepEqual(chapterAnswers(mixed, chapterQuestions(quiz), quiz.edition).map(({ id }) => id), ['mw-loneliness'])
  assert.ok(challengeAnswers(mixed, DEFAULT_QUIZ).every(({ id }) => id === world))
})

test('the illustrative overlap matches the brief for g = 0.54', () => {
  assert.equal(Math.round(overlap(0.54) * 100), 79)
  assert.equal(Math.round(overlap(0.69) * 100), 73)
})
