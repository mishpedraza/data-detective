import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_QUIZ, QUIZZES, quizById, quizQuestions } from '../src/data/quizzes'
import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from '../src/data/discoverEdition'
import { EDITORIAL_QUESTIONS } from '../src/data/editorial'
import { CHAPTER_QUESTIONS } from '../src/data/chapterQuestions'
import { CHALLENGE_KEY, RESULTS_KEY, challengeAnswers } from '../src/lib/discoveryChallenge'
import { revealDiscovery, type DiscoveryProgress } from '../src/lib/discoveryProgress'
import { hrefFor } from '../src/lib/route'

test('quizzes have unique ids, storage keys and questions', () => {
  const unique = (values: string[]) => assert.equal(new Set(values).size, values.length)
  unique(QUIZZES.map(({ id }) => id))
  unique(QUIZZES.flatMap(({ attemptKey, resultKey }) => [attemptKey, resultKey]))
  unique(QUIZZES.flatMap((quiz) => quizQuestions(quiz).map(({ id }) => id)))
  for (const quiz of QUIZZES) {
    unique(quiz.chapters.map(({ id }) => id))
    assert.equal(quizById(quiz.id), quiz)
    assert.equal(hrefFor('discover', { quiz: quiz.id }), `#/discover?quiz=${quiz.id}`)
    for (const id of quiz.chapters.flatMap(({ questionIds }) => questionIds)) assert.ok(DISCOVER_TEASERS[id]?.interaction || CHAPTER_QUESTIONS[id], `${quiz.id}: ${id}`)
  }
})

test('the original quiz keeps its questions, edition and saved progress', () => {
  assert.equal(DEFAULT_QUIZ.id, 'world')
  assert.equal(DEFAULT_QUIZ.edition, DISCOVERY_QUIZ_EDITION)
  assert.equal(CHALLENGE_KEY, 'data-detective.challenge.v1')
  assert.equal(RESULTS_KEY, 'data-detective.challenge.last-result.v1')
  assert.deepEqual(quizQuestions(DEFAULT_QUIZ).map(({ id }) => id), EDITORIAL_QUESTIONS.map(({ id }) => id))
})

test('answers only count toward the quiz and edition they belong to', () => {
  const [world, other] = QUIZZES
  const { id } = quizQuestions(world)[0]
  const interaction = DISCOVER_TEASERS[id]!.interaction!
  const progress: DiscoveryProgress = revealDiscovery({}, id, interaction.answer, interaction.answer, world.edition)
  assert.equal(challengeAnswers(progress, world).length, 1)
  assert.equal(challengeAnswers(progress, other).length, 0)
  assert.equal(challengeAnswers(revealDiscovery({}, id, interaction.answer, interaction.answer, 'old-edition'), world).length, 0)
})

test('the original quiz plays in the chapter format and keeps saved answers', async () => {
  const { chapterAnswers, chapterQuestions } = await import('../src/lib/chapterScore')
  assert.equal(DEFAULT_QUIZ.format, 'chapter')
  assert.ok(DEFAULT_QUIZ.browse)
  const questions = chapterQuestions(DEFAULT_QUIZ)
  assert.deepEqual(questions.map(({ id }) => id), quizQuestions(DEFAULT_QUIZ).map(({ id }) => id))
  const [first, second] = questions
  const wrong = first.kind === 'choice' ? first.options.find(({ id }) => id !== first.answer)!.id : ''
  let saved: DiscoveryProgress = revealDiscovery({}, first.id, wrong, first.kind === 'choice' ? first.answer : '', DISCOVERY_QUIZ_EDITION, 1)
  if (second.kind === 'choice') saved = revealDiscovery(saved, second.id, second.answer, second.answer, DISCOVERY_QUIZ_EDITION, 0)
  assert.deepEqual(chapterAnswers(saved, questions, DEFAULT_QUIZ.edition).map(({ points }) => points), [0, 1])
  for (const question of questions) {
    assert.ok(question.refs?.length && question.explore, question.id)
    if (question.visual === 'bars') assert.ok(question.bars?.length, question.id)
  }
})

test('playing goes straight to the next unanswered question, or results when finished', async () => {
  const { chapterEntry } = await import('../src/lib/quizEntry')
  const { hasChapterList } = await import('../src/data/quizzes')
  const store = new Map<string, string>()
  Object.assign(globalThis, { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) } })
  const world = quizById('world')!
  const menWomen = quizById('men-and-women')!
  assert.equal(hasChapterList(world), false)
  assert.equal(hasChapterList(menWomen), true)
  const ids = quizQuestions(world).map(({ id }) => id)
  const fresh = chapterEntry(world, world.chapters[0].id)
  assert.equal(fresh.href, hrefFor('discover', { quiz: 'world', q: ids[0], mode: 'challenge' }))
  assert.equal(fresh.event, 'quiz_started')
  const pick = (id: string) => DISCOVER_TEASERS[id]!.interaction!.answer
  store.set(world.attemptKey, JSON.stringify({ [ids[0]]: { pick: pick(ids[0]), edition: world.edition } }))
  const resumed = chapterEntry(world, world.chapters[0].id)
  assert.equal(resumed.href, hrefFor('discover', { quiz: 'world', q: ids[1], mode: 'challenge' }))
  assert.equal(resumed.event, 'quiz_resumed')
  store.set(world.attemptKey, JSON.stringify(Object.fromEntries(ids.map((id) => [id, { pick: pick(id), edition: world.edition }]))))
  const done = chapterEntry(world, world.chapters[0].id)
  assert.equal(done.href, hrefFor('discover', { quiz: 'world', mode: 'results' }))
  assert.equal(done.event, 'quiz_results_opened')
  const love = chapterEntry(menWomen, menWomen.chapters[0].id)
  assert.equal(love.href, hrefFor('discover', { quiz: 'men-and-women', chapter: 'love-attraction', q: quizQuestions(menWomen)[0].id, mode: 'challenge' }))
})
