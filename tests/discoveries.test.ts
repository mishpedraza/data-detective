import { test } from 'node:test'
import assert from 'node:assert/strict'
import { discoveryEvidence, predictions, predictionOptions } from '../src/data/discoveries'
import { EDITORIAL_QUESTIONS, editorialQuestionById, editorialQuestionForRelationship } from '../src/data/editorial'
import { RELATIONSHIPS } from '../src/data/relationships'
import { explain } from '../src/lib/explain'

test('featured predictions have scoped evidence and open actual investigations', () => {
  const ids = new Set(RELATIONSHIPS.map(({ id }) => id))
  assert.equal(EDITORIAL_QUESTIONS.length, 11)
  assert.equal(EDITORIAL_QUESTIONS.filter(({ featured }) => featured).length, 3)
  assert.equal(new Set(EDITORIAL_QUESTIONS.map(({ question }) => question)).size, 11)
  for (const entry of EDITORIAL_QUESTIONS) {
    assert.equal(editorialQuestionById(entry.id), entry)
    if (entry.status === 'available') assert.ok(ids.has(entry.relationship), entry.id)
    else if (entry.related) assert.ok(ids.has(entry.related.relationship), entry.id)
  }
  for (const { id } of predictions) assert.ok(editorialQuestionForRelationship(id), id)
  for (const discovery of predictions) {
    const evidence = discoveryEvidence(discovery)
    assert.ok(evidence, discovery.id)
    assert.match(evidence.source, /^https:\/\//)
  }
  assert.match(discoveryEvidence(predictions[0])!.result, /13% below/)
  assert.match(discoveryEvidence(predictions[1])!.result, /1\.6%.*4\.8%/)
  assert.deepEqual(predictionOptions(predictions[0]), ['Higher', 'Lower', 'About the same'])
  for (const discovery of predictions.slice(1)) assert.deepEqual(predictionOptions(discovery), ['Yes', 'No', 'About the same'])
  assert.deepEqual(predictions.map((discovery) => discoveryEvidence(discovery)?.answer), ['Lower', 'No'])
})

test('a recent immigration and housing gap cites the closest study period', () => {
  const rel = RELATIONSHIPS.find(({ id }) => id === 'immigration-housing')!
  const lead = explain(rel, 'imm_rate', 'house_price_real', null, 2023, 2025).findings[0]
  assert.deepEqual(lead.refs, ['bde2024'])
  assert.match(lead.lead, /No study measures how much/)
})
