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
