import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verifyFeedback } from '../detective-lab/browser.mjs'
import { reviewResearch } from '../detective-lab/research.mjs'
import { dimensions, validateEditorial } from '../detective-lab/editorial.mjs'

test('the browser oracle detects an incorrect score and missing feedback', () => {
  const expected = { score: 1, correct: true, answer: 'Spain', pick: 'Spain' }
  const observed = { score: '1 correct so far', verdict: '✓Correct!', pick: 'Spain',
    answer: 'Spain', reaction: 'Nicely spotted.', visible: true, toneMatches: true,
    correctIsGreen: true, beforeEvidence: true, finding: 'Hours fell.', citations: ['https://example.org'] }
  assert.doesNotThrow(() => verifyFeedback(observed, expected))
  assert.throws(() => verifyFeedback({ ...observed, score: '2 correct so far' }, expected), /displayed score differs/)
  assert.throws(() => verifyFeedback({ ...observed, reaction: '' }, expected), /invisible reaction/)
})

test('research results distinguish repository support, fetched evidence, absence and a primary mismatch', async () => {
  const offline = await reviewResearch()
  assert.equal(offline.findings.filter(({ status }) => status === 'SUPPORTED BY REPOSITORY').length, 9)
  assert.ok(offline.findings.some(({ status }) => status === 'UNVERIFIED'))
  assert.ok(!offline.findings.some(({ status }) => status === 'VERIFIED'))
  const matched = await reviewResearch({ external: true, request: async (url) => new Response(
    url.includes('oecd.org') ? 'DATAFLOW,REF_AREA,FREQ,MEASURE,UNIT_MEASURE,TIME_PERIOD,OBS_VALUE\nx,ESP,A,RHP,IX,2007,100\nx,ESP,A,RHP,IX,2025,87' : '',
  ) })
  assert.equal(matched.gate, 'OPEN')
  assert.equal(matched.findings.filter(({ status }) => status === 'VERIFIED').length, 1)
  const mismatch = await reviewResearch({ external: true, request: async () => new Response(
    'DATAFLOW,REF_AREA,FREQ,MEASURE,UNIT_MEASURE,TIME_PERIOD,OBS_VALUE\nx,ESP,A,RHP,IX,2007,100\nx,ESP,A,RHP,IX,2025,108',
  ) })
  assert.equal(mismatch.gate, 'BLOCKED')
})

test('structured AI opinions require a supported score and justification for every evaluation dimension', () => {
  const assessment = { dimensions: Object.fromEntries(dimensions.map((name) => [
    name, { score: 6, reasoning: 'The answer choices invite a comparison.', evidence: 'Two countries are named.' },
  ])), recommendations: [], unresolved: [] }
  assert.ok(validateEditorial(assessment))
  assert.ok(!validateEditorial({ ...assessment, dimensions: {} }))
  assessment.dimensions.curiosity.score = 11
  assert.ok(!validateEditorial(assessment))
})

test('AI integration labels validated responses as opinions and skips missing credentials', async () => {
  const { reviewEditorial } = await import('../detective-lab/editorial.mjs')
  const research = await reviewResearch()
  const common = { enabled: true, model: 'test-model', runs: [], research, output: '/tmp' }
  assert.equal((await reviewEditorial(common)).status, 'SKIPPED')
  let calls = 0
  const result = await reviewEditorial({
    ...common, apiKey: 'fixture-key',
    request: async (_url, options) => {
      calls++
      const body = JSON.parse(options.body)
      assert.equal(body.store, false)
      assert.equal(body.text.format.type, 'json_schema')
      const response = { dimensions: Object.fromEntries(dimensions.map((name) => [
        name, { score: 6, reasoning: 'Fixture judgment.', evidence: 'Fixture observation.' },
      ])), recommendations: [], unresolved: [] }
      return Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(response) }] }] })
    },
  })
  assert.equal(calls, 9)
  assert.equal(result.status, 'COMPLETED')
  assert.ok(result.stories.every(({ status }) => status === 'AI OPINION'))
  assert.equal(research.gate, 'OPEN')
})
