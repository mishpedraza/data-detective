import { test } from 'node:test'
import assert from 'node:assert/strict'
import { challengeAnswers, challengeReaction, pickResult } from '../src/lib/discoveryChallenge'
import { DISCOVER_TEASERS, DISCOVERY_QUIZ_EDITION } from '../src/data/discoverEdition'
import { EDITORIAL_QUESTIONS } from '../src/data/editorial'
import { revealDiscovery, type DiscoveryProgress } from '../src/lib/discoveryProgress'

test('all nine challenge answers use existing verified choices and first attempts', () => {
  let progress: DiscoveryProgress = {}
  for (const { id } of EDITORIAL_QUESTIONS) {
    const quiz = DISCOVER_TEASERS[id]!.interaction!
    progress = revealDiscovery(progress, id, quiz.answer, quiz.answer, DISCOVERY_QUIZ_EDITION)
    progress = revealDiscovery(progress, id, quiz.choices.find((choice) => choice !== quiz.answer)!, quiz.answer, DISCOVERY_QUIZ_EDITION)
  }
  assert.equal(challengeAnswers(progress).length, 9)
  assert.ok(challengeAnswers(progress).every(({ correct }) => correct))
  assert.deepEqual(challengeAnswers({ 'generational-wealth': { pick: 'About as much', edition: DISCOVERY_QUIZ_EDITION } }), [])
})

test('challenge summaries rotate and every question has distinct reaction variants', () => {
  for (const score of [0, 4, 9]) {
    const pool = new Set(Array.from({ length: 8 }, (_, index) => pickResult(score, 9, undefined, () => index / 8).headline))
    assert.equal(pool.size, 8)
    const first = pickResult(score, 9, undefined, () => 0)
    assert.notEqual(first.headline, pickResult(score, 9, first.headline, () => 0).headline)
  }
  const reactions = EDITORIAL_QUESTIONS.flatMap((_, index) =>
    [challengeReaction(index, true, 0), challengeReaction(index, true, 1),
      challengeReaction(index, false, 0), challengeReaction(index, false, 1)],
  )
  assert.ok(reactions.every(Boolean))
  assert.equal(new Set(reactions).size, 36)
})
