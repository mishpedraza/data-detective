import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_QUIZ, quizById, quizQuestions } from '../src/data/quizzes'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { LOVE_QUESTIONS, type ChapterQuestion } from '../src/data/menWomen'
import { MONEY_QUESTIONS } from '../src/data/moneyPower'
import { NATURE_QUESTIONS } from '../src/data/natureNurture'
import { chapterAnswers, chapterQuestions, estimatePoints, formatPoints, isScored, maxPoints, overlap, recordAnswer, scoreQuestion, totalPoints } from '../src/lib/chapterScore'
import { challengeReaction, partialReaction } from '../src/lib/discoveryChallenge'
import { challengeAnswers } from '../src/lib/discoveryChallenge'
import { revealDiscovery, type DiscoveryProgress } from '../src/lib/discoveryProgress'
import { hrefFor } from '../src/lib/route'

const quiz = quizById('men-and-women')!
const byId = (id: string) => LOVE_QUESTIONS.find((question) => question.id === id) as ChapterQuestion

test('the Men & Women quiz plays Love (7), Money, ambition & power (9) and Nature, nurture & society (4)', () => {
  assert.equal(quiz.format, 'chapter')
  assert.deepEqual(quiz.chapters.map(({ id, title }) => [id, title]), [['love-attraction', 'Love, attraction & relationships'], ['money-ambition-power', 'Money, ambition & power'], ['nature-nurture-society', 'Nature, nurture & society']])
  assert.equal(chapterQuestions(quiz, 'nature-nurture-society').length, 4)
  assert.equal(chapterQuestions(quiz, 'love-attraction').length, 7)
  assert.equal(chapterQuestions(quiz, 'money-ambition-power').length, 9)
  assert.deepEqual(quizQuestions(quiz).map(({ id }) => id), [...LOVE_QUESTIONS, ...MONEY_QUESTIONS, ...NATURE_QUESTIONS].map(({ id }) => id))
  assert.equal(hrefFor('discover', { quiz: quiz.id, q: LOVE_QUESTIONS[0].id }), '#/discover?quiz=men-and-women&q=mw-age-attraction')
  for (const question of [...LOVE_QUESTIONS, ...MONEY_QUESTIONS, ...NATURE_QUESTIONS]) {
    assert.ok(question.evidence, question.id)
    assert.match(question.evidence!.url, /^https:\/\//)
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
  for (const [id, pick] of Object.entries(picks)) progress = recordAnswer(progress, CHAPTER_QUESTIONS[id], pick, quiz.edition)
  const answers = chapterAnswers(progress, chapterQuestions(quiz, 'love-attraction'), quiz.edition)
  assert.equal(answers.length, 7)
  assert.equal(totalPoints(answers), 4 + 0.75 + 0.75)
  assert.equal(formatPoints(6.5), '6.5')
  assert.equal(formatPoints(5.25), '5.25')
  assert.equal(formatPoints(7), '7')
})

test('going back to an answered question keeps the first prediction', () => {
  const first = recordAnswer({}, CHAPTER_QUESTIONS['mw-desire'], 'vanishes', quiz.edition)
  assert.equal(recordAnswer(first, CHAPTER_QUESTIONS['mw-desire'], 'remains', quiz.edition), first)
  assert.equal(chapterAnswers(first, chapterQuestions(quiz), quiz.edition)[0].points, 0)
  assert.equal(chapterAnswers(first, chapterQuestions(quiz), 'v0').length, 0)
})

test('progress is independent from the World quiz', () => {
  assert.notEqual(quiz.attemptKey, DEFAULT_QUIZ.attemptKey)
  assert.notEqual(quiz.resultKey, DEFAULT_QUIZ.resultKey)
  const world = quizQuestions(DEFAULT_QUIZ)[0].id
  const mixed = recordAnswer(revealDiscovery({}, world, 'x', 'x', DEFAULT_QUIZ.edition), CHAPTER_QUESTIONS['mw-loneliness'], 'age', quiz.edition)
  assert.deepEqual(chapterAnswers(mixed, chapterQuestions(quiz), quiz.edition).map(({ id }) => id), ['mw-loneliness'])
  assert.ok(challengeAnswers(mixed, DEFAULT_QUIZ).every(({ id }) => id === world))
})

test('the illustrative overlap matches the brief for g = 0.54', () => {
  assert.equal(Math.round(overlap(0.54) * 100), 79)
  assert.equal(Math.round(overlap(0.69) * 100), 73)
})

const money = (id: string) => MONEY_QUESTIONS.find((question) => question.id === id) as ChapterQuestion

test('leadership scores a third of a point per matching prediction', () => {
  assert.equal(scoreQuestion(money('mp-leader'), 'men,women,similar'), 1)
  assert.equal(scoreQuestion(money('mp-leader'), 'men,men,men'), 1 / 3)
  assert.equal(scoreQuestion(money('mp-leader'), 'men,women,similar,men'), undefined)
})

test('free time estimates score by hours: half a point within 2, a quarter within 5', () => {
  const q = money('mp-leisure')
  assert.equal(scoreQuestion(q, '30,21'), 1)
  assert.equal(scoreQuestion(q, '33,21'), 0.75)
  assert.equal(scoreQuestion(q, '35,27'), 0)
  assert.equal(scoreQuestion(q, '61,20'), undefined)
})

test('revised questions are multiple choice with the verified answers', () => {
  assert.equal(scoreQuestion(money('mp-negotiate-outcome'), 'similar'), 1)
  assert.equal(scoreQuestion(money('mp-negotiate-outcome'), 'men'), 0)
  assert.equal(scoreQuestion(money('mp-compete-verbal'), 'negligible'), 1)
  assert.equal(scoreQuestion(money('mp-compete-verbal'), 'negligible|piece'), undefined)
  assert.equal(scoreQuestion(money('mp-risk-feedback'), 'similar'), 1)
  assert.equal(scoreQuestion(money('mp-risk-feedback'), 'women'), 0)
  assert.equal(scoreQuestion(money('mp-power-match'), 'three-quarters'), 1)
  assert.equal(scoreQuestion(money('mp-power-match'), '71'), undefined)
  assert.equal(scoreQuestion(money('mp-motherhood'), 'persists'), 1)
})

test('the working week is an unscored discovery', () => {
  const week = money('mp-week-ideal')
  assert.equal(isScored(week), false)
  assert.equal(scoreQuestion(week, '3.5,4'), 0)
  assert.equal(scoreQuestion(week, '5.5,4'), undefined)
  assert.equal(scoreQuestion(week, 'women-more|3.5,4'), undefined)
})

test('a perfect Money, ambition & power run scores 8 of 8 across 9 discoveries', () => {
  const perfect: Record<string, string> = { 'mp-leader': 'men,women,similar', 'mp-negotiate-outcome': 'similar', 'mp-compete-verbal': 'negligible',
    'mp-risk-feedback': 'similar', 'mp-assertive': 'hiring', 'mp-week-ideal': '4,3', 'mp-leisure': '30,21', 'mp-motherhood': 'persists', 'mp-power-match': 'three-quarters' }
  let progress: DiscoveryProgress = {}
  for (const [id, pick] of Object.entries(perfect)) progress = recordAnswer(progress, CHAPTER_QUESTIONS[id], pick, quiz.edition)
  const questions = chapterQuestions(quiz, 'money-ambition-power')
  const answers = chapterAnswers(progress, questions, quiz.edition)
  assert.equal(questions.length, 9)
  assert.equal(answers.length, 9)
  assert.equal(maxPoints(questions), 8)
  assert.equal(totalPoints(answers), 8)
  assert.equal(formatPoints(1 / 3), '0.33')
})

test('feedback lines rotate between questions', () => {
  const lines = (correct: boolean) => new Set(Array.from({ length: 9 }, (_, i) => challengeReaction(i, correct)))
  assert.equal(lines(true).size, 9)
  assert.equal(lines(false).size, 9)
  assert.notEqual(partialReaction(0), partialReaction(1))
})
