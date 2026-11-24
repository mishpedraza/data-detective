import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WORLD_QUESTIONS } from '../src/data/worldQuestions'
import { FERTILITY_INCOME, FERTILITY_YEARS } from '../src/data/fertilityIncome'
import { REFERENCES } from '../src/data/references'
import { DISCOVER_TEASERS } from '../src/data/discoverEdition'

const question = (id: string) => WORLD_QUESTIONS.find((entry) => entry.id === id)!

test('revised World questions have three options, their own visual and linked evidence', () => {
  const expected = {
    'immigration-crime': ['permitcards', 'The group that missed out'],
    'education-and-pay': ['adoption', 'About the same'],
    'crime-perceptions': ['crimedrop', 'It recorded the biggest one-year drop'],
    'wealth-and-fertility': ['fertility', 'Richer countries tended to have more births per woman'],
  } as const
  for (const [id, [visual, answer]] of Object.entries(expected)) {
    const q = question(id)
    assert.equal(q.visual, visual)
    assert.ok(q.kind === 'choice' && q.options.length === 3 && q.answer === answer, id)
    for (const { url } of [q.evidence!, ...(q.evidence!.more ?? [])]) assert.match(url, /^https:\/\//)
    for (const ref of DISCOVER_TEASERS[id]!.interaction!.reveal.refs) assert.ok(REFERENCES[ref], `${id}: ${ref}`)
  }
})

test('the 13-country income–fertility correlation is negative in 1980 and positive in 2000 and 2024', () => {
  const r = (year: (typeof FERTILITY_YEARS)[number]) => {
    const pts = FERTILITY_INCOME[year].map(({ gdp, births }) => [Math.log(gdp), births])
    const mx = pts.reduce((s, [x]) => s + x, 0) / pts.length, my = pts.reduce((s, [, y]) => s + y, 0) / pts.length
    const sxy = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0)
    return sxy / Math.sqrt(pts.reduce((s, [x]) => s + (x - mx) ** 2, 0) * pts.reduce((s, [, y]) => s + (y - my) ** 2, 0))
  }
  for (const year of FERTILITY_YEARS) assert.equal(FERTILITY_INCOME[year].length, 13)
  assert.ok(r(1980) < -0.7)
  assert.ok(r(2000) > 0.3)
  assert.ok(Math.abs(r(2024) - 0.58) < 0.01)
})
