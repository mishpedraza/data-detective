import { test } from 'node:test'
import assert from 'node:assert/strict'
import { revealDiscovery } from '../src/lib/discoveryProgress'

test('only a first prediction is recorded and contrast reveals have no score', () => {
  const contrast = revealDiscovery({}, 'children-and-happiness', '')
  assert.equal(contrast['children-and-happiness']?.correct, undefined)
  const first = revealDiscovery(contrast, 'housing-affordability', 'Higher', 'Lower')
  const revisit = revealDiscovery(first, 'housing-affordability', 'Lower', 'Lower')
  assert.equal(revisit['housing-affordability']?.correct, false)
  assert.equal(revisit['housing-affordability']?.pick, 'Higher')
  assert.equal(Object.keys(revisit).length, 2)
})

test('a new quiz edition can be attempted once without inheriting the previous score', () => {
  const old = revealDiscovery({}, 'housing-affordability', 'Higher', 'Lower')
  assert.equal(old['housing-affordability']?.edition, undefined)
  const next = revealDiscovery(old, 'housing-affordability', 'Lower', 'Lower', 'new-edition')
  const retry = revealDiscovery(next, 'housing-affordability', 'Higher', 'Lower', 'new-edition')
  assert.equal(retry['housing-affordability']?.correct, true)
  assert.equal(retry['housing-affordability']?.pick, 'Lower')
  assert.equal(retry['housing-affordability']?.edition, 'new-edition')
})

test('reopening a saved answer preserves its reaction variant', () => {
  const first = revealDiscovery({}, 'housing-affordability', 'Higher', 'Lower', 'quiz', 1)
  const reopened = revealDiscovery(first, 'housing-affordability', 'Lower', 'Lower', 'quiz', 0)
  assert.equal(reopened['housing-affordability']?.reactionVariant, 1)
  assert.equal(reopened['housing-affordability']?.pick, 'Higher')
})
