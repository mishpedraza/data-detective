import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DISCOVER_TEASERS } from '../src/data/discoverEdition'
import { studyById } from '../src/data/research'
import { REFERENCES } from '../src/data/references'
import { INDICATORS } from '../src/data/indicators'
import { discoveryEvidence, predictions, predictionOptions } from '../src/data/discoveries'
import { EDITORIAL_QUESTIONS, editorialQuestionById } from '../src/data/editorial'
import { EDITORIAL_STORIES } from '../src/data/editorialStories'
import { RELATIONSHIPS } from '../src/data/relationships'
import { explain } from '../src/lib/explain'

test('featured predictions have scoped evidence and open actual investigations', () => {
  const ids = new Set(RELATIONSHIPS.map(({ id }) => id))
  assert.equal(EDITORIAL_QUESTIONS.length, 9)
  assert.equal(EDITORIAL_QUESTIONS.filter(({ featured }) => featured).length, 2)
  assert.equal(new Set(EDITORIAL_QUESTIONS.map(({ question }) => question)).size, 9)
  assert.deepEqual(EDITORIAL_QUESTIONS.map(({ id }) => id), [
    'housing-affordability', 'children-and-happiness', 'working-hours', 'immigration-crime', 'education-and-pay',
    'global-danger', 'generational-wealth', 'crime-perceptions', 'wealth-and-fertility',
  ])
  for (const entry of EDITORIAL_QUESTIONS) {
    assert.equal(editorialQuestionById(entry.id), entry)
    if (entry.status === 'available') assert.ok(ids.has(entry.relationship), entry.id)
    else assert.ok(EDITORIAL_STORIES[entry.id], entry.id)
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
  const featured = EDITORIAL_QUESTIONS.filter((entry) => entry.featured && entry.status === 'available')
  const featuredPredictions = featured.flatMap((entry) =>
    entry.status === 'available' ? predictions.filter(({ id }) => id === entry.relationship) : [],
  )
  assert.deepEqual(featuredPredictions.map(({ id }) => id), ['housing-affordability'])
  assert.equal(featuredPredictions[0].comparisonLabel, 'Spain, 2025 vs. 2007 · Adjusted for inflation')
  assert.deepEqual(predictions.map((discovery) => discoveryEvidence(discovery)?.answer), ['Lower', 'No'])
})

test('a recent immigration and housing gap cites the closest study period', () => {
  const rel = RELATIONSHIPS.find(({ id }) => id === 'immigration-housing')!
  const lead = explain(rel, 'imm_rate', 'house_price_real', null, 2023, 2025).findings[0]
  assert.deepEqual(lead.refs, ['bde2024'])
  assert.match(lead.lead, /No study measures how much/)
})

test('Discover has one sourced teaser per existing question and grades only defined comparisons', () => {
  assert.deepEqual(Object.keys(DISCOVER_TEASERS), EDITORIAL_QUESTIONS.map(({ id }) => id))
  for (const [id, teaser] of Object.entries(DISCOVER_TEASERS)) {
    assert.ok(teaser?.hook, id)
    const interaction = teaser.interaction
    assert.ok(interaction, id)
    for (const ref of interaction.reveal.refs) {
      const source = ref.startsWith('data:') ? INDICATORS[ref.slice(5)]?.source : studyById(ref) ?? REFERENCES[ref]
      assert.match(source?.url ?? '', /^https:\/\//, ref)
    }
    if (interaction.kind === 'prediction' && interaction.answer) assert.ok(interaction.choices.includes(interaction.answer), id)
  }
  const parent = DISCOVER_TEASERS['children-and-happiness']!.interaction
  assert.ok(parent?.kind === 'prediction' && parent.answer === undefined)
  const housing = DISCOVER_TEASERS['housing-affordability']!.interaction
  assert.ok(housing?.kind === 'prediction' && housing.answer === 'Lower')
  assert.match(housing.reveal.finding, /13% below/)
  const crime = DISCOVER_TEASERS['crime-perceptions']!.interaction
  assert.ok(crime?.kind === 'prediction' && crime.answer === 'It fell')
  assert.match(crime.reveal.facts?.[0].value ?? '', /49% lower/)
  assert.match(crime.reveal.facts?.[1].value ?? '', /23 of 27/)
})
