import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_QUIZ, QUIZZES, quizById, quizQuestions } from '../src/data/quizzes'
import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from '../src/data/discoverEdition'
import { EDITORIAL_QUESTIONS } from '../src/data/editorial'
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
    for (const id of quiz.chapters.flatMap(({ questionIds }) => questionIds)) assert.ok(DISCOVER_TEASERS[id]?.interaction, `${quiz.id}: ${id}`)
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
