import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collection, discoveryEvidence, featuredDiscoveries, predictionOptions } from '../src/data/discoveries'
import { RELATIONSHIPS } from '../src/data/relationships'
import { explain } from '../src/lib/explain'

test('featured predictions have scoped evidence and open actual investigations', () => {
  const ids = new Set([...RELATIONSHIPS.map(({ id }) => id), 'surgery-waits'])
  const cards = [...featuredDiscoveries, ...collection]
  assert.equal(new Set(cards.map(({ question }) => question)).size, cards.length)
  for (const card of cards) assert.ok(ids.has(card.id), card.id)
  for (const discovery of featuredDiscoveries) {
    const evidence = discoveryEvidence(discovery)
    assert.ok(evidence, discovery.id)
    assert.match(evidence.source, /^https:\/\//)
  }
  assert.match(discoveryEvidence(featuredDiscoveries[0])!.result, /13% below/)
  assert.match(discoveryEvidence(featuredDiscoveries[1])!.result, /1\.6%.*4\.8%/)
  assert.match(discoveryEvidence(featuredDiscoveries[2])!.result, /120.*122/)
  assert.deepEqual(predictionOptions(featuredDiscoveries[0]), ['Higher', 'Lower', 'About the same'])
  for (const discovery of featuredDiscoveries.slice(1)) assert.deepEqual(predictionOptions(discovery), ['Yes', 'No', 'About the same'])
  assert.deepEqual(featuredDiscoveries.map((discovery) => discoveryEvidence(discovery)?.answer), ['Lower', 'No', 'About the same'])
})

test('a recent immigration and housing gap cites the closest study period', () => {
  const rel = RELATIONSHIPS.find(({ id }) => id === 'immigration-housing')!
  const lead = explain(rel, 'imm_rate', 'house_price_real', null, 2023, 2025).findings[0]
  assert.deepEqual(lead.refs, ['bde2024'])
  assert.match(lead.lead, /No study measures how much/)
})
