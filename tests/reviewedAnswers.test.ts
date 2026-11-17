import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REVIEWED_ANSWERS } from '../src/data/reviewedAnswers'
import { RELATIONSHIPS } from '../src/data/relationships'
import { INDICATORS } from '../src/data/indicators'
import { REFERENCES } from '../src/data/references'
import { studyById } from '../src/data/research'
import { answerFor } from '../src/lib/answers'
import { discoveryEvidence, predictions } from '../src/data/discoveries'

test('each working relationship has a scoped reviewed answer with resolvable citations', () => {
  assert.deepEqual(Object.keys(REVIEWED_ANSWERS).sort(), RELATIONSHIPS.map(({ id }) => id).sort())
  for (const [id, answer] of Object.entries(REVIEWED_ANSWERS)) {
    assert.ok(answer, id)
    assert.ok(answer.headline && answer.scope && answer.limitation.text, id)
    assert.notEqual(answer.limitation.text, answer.finding.text)
    for (const claim of [answer.finding, ...answer.explanation, answer.limitation]) {
      assert.ok(claim.refs?.length, id)
      for (const ref of claim.refs) {
        const source = ref.startsWith('data:')
          ? INDICATORS[ref.slice(5)]?.source
          : studyById(ref) ?? REFERENCES[ref]
        assert.match(source?.url ?? '', /^https:\/\//, `${id} references ${ref}`)
      }
    }
  }
})

test('fixed housing and wage findings agree with the underlying comparison data', () => {
  const house = predictions.find(({ id }) => id === 'housing-affordability')!
  assert.match(discoveryEvidence(house)!.result, /13% below/)
  assert.match(REVIEWED_ANSWERS['housing-affordability']!.finding.text, /13% lower/)
  const wages = answerFor('growth-wages', 'gdp_pc_real', 'real_wage', null, 2006, 2022)!
  for (const { value } of wages.stats) {
    assert.ok(REVIEWED_ANSWERS['growth-wages']!.finding.text.includes(value.replace('+', '')), value)
  }
})

test('immigration crime distinguishes overall research, mechanisms and homicide limits', () => {
  const answer = REVIEWED_ANSWERS['immigration-crime']!
  assert.ok(answer.finding.refs.includes('ousey2018'))
  assert.ok(answer.explanation.some(({ refs }) => refs.includes('alonso2012')))
  assert.ok(answer.explanation.some(({ refs }) => refs.includes('pinotti2017')))
  assert.match(answer.limitation.text, /studies cited here.*homicide in Spain/)
})
