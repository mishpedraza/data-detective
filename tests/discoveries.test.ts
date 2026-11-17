import { test } from 'node:test'
import assert from 'node:assert/strict'
import { discoveryEvidence, predictions, predictionOptions } from '../src/data/discoveries'
import { EDITORIAL_QUESTIONS, editorialQuestionById } from '../src/data/editorial'
import { RELATIONSHIPS } from '../src/data/relationships'
import { explain } from '../src/lib/explain'

test('featured predictions have scoped evidence and open actual investigations', () => {
  const ids = new Set(RELATIONSHIPS.map(({ id }) => id))
  assert.equal(EDITORIAL_QUESTIONS.length, 9)
  assert.equal(EDITORIAL_QUESTIONS.filter(({ featured }) => featured).length, 2)
  assert.equal(new Set(EDITORIAL_QUESTIONS.map(({ question }) => question)).size, 9)
  for (const entry of EDITORIAL_QUESTIONS) {
    assert.equal(editorialQuestionById(entry.id), entry)
    if (entry.status === 'available') assert.ok(ids.has(entry.relationship), entry.id)
    else if (entry.related) assert.ok(ids.has(entry.related.relationship), entry.id)
  }
  assert.equal(editorialQuestionById('loneliness-and-connection'), undefined)
  assert.equal(editorialQuestionById('growth-and-prosperity'), undefined)
  for (const { id } of predictions) assert.ok(ids.has(id), id)
  for (const discovery of predictions) {
    const evidence = discoveryEvidence(discovery)
    assert.ok(evidence, discovery.id)
    assert.match(evidence.source, /^https:\/\//)
  }
  assert.match(discoveryEvidence(predictions[0])!.result, /13% below/)
  assert.match(discoveryEvidence(predictions[1])!.result, /1\.6%.*4\.8%/)
  assert.deepEqual(predictionOptions(predictions[0]), ['Higher', 'Lower', 'About the same'])
  assert.deepEqual(predictionOptions(predictions[1]), ['Yes', 'No', 'About the same'])
  assert.match(discoveryEvidence(predictions[2])!.result, /1\.35.*0\.69/)
  for (const entry of EDITORIAL_QUESTIONS.filter(({ featured }) => featured)) {
    const relationship = entry.status === 'available' ? entry.relationship : entry.related?.relationship
    assert.ok(predictions.some(({ id }) => id === relationship), entry.id)
  }
  assert.deepEqual(predictions.map((discovery) => discoveryEvidence(discovery)?.answer), ['Lower', 'No', 'Lower'])
})

test('a recent immigration and housing gap cites the closest study period', () => {
  const rel = RELATIONSHIPS.find(({ id }) => id === 'immigration-housing')!
  const lead = explain(rel, 'imm_rate', 'house_price_real', null, 2023, 2025).findings[0]
  assert.deepEqual(lead.refs, ['bde2024'])
  assert.match(lead.lead, /No study measures how much/)
})
