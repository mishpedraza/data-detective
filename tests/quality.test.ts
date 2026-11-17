import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RELATIONSHIPS } from '../src/data/relationships'
import { INDICATORS, series } from '../src/data/indicators'
import { COMPARE_OPTIONS, COUNTRIES } from '../src/data/countries'
import { studyById } from '../src/data/research'
import { REFERENCES } from '../src/data/references'
import { TOPIC } from '../src/data/evidence'
import { change } from '../src/lib/compare'
import { inRange } from '../src/lib/stats'
import { answerFor } from '../src/lib/answers'
import { explain, findingYears } from '../src/lib/explain'

const PERIODS: [number, number][] = [[2000, 2025], [2000, 2007], [2008, 2013], [2014, 2025], [2010, 2022], [2019, 2021], [2006, 2022], [2023, 2025]]
const val = (v: string) => Number(v.replace('−', '-').replace(/[^0-9.-]/g, ''))

/** Every selection a visitor can make: relationship × left × right × comparison × period. */
function* selections() {
  for (const rel of RELATIONSHIPS)
    for (const a of rel.left.options)
      for (const b of rel.right.options)
        for (const c of COMPARE_OPTIONS)
          for (const [from, to] of PERIODS) yield { rel, a, b, c: c === 'none' ? null : c, from, to }
}

/** What each question needs measured. A question passes only if every option measures that concept. */
const SPEC: Record<string, { left: (id: string) => boolean; right: (id: string) => boolean; why: string }> = {
  'housing-affordability': { left: (id) => INDICATORS[id].dimension === 'housing', right: (id) => /income|wage|overburden/.test(id), why: 'housing costs against incomes' },
  'growth-wages': { left: (id) => /gdp|productivity/.test(id), right: (id) => INDICATORS[id].dimension === 'living' && !/EU average = 100|United States = 100/.test(INDICATORS[id].unit), why: 'absolute living standards, not a share of another country' },
  'productivity-wages': { left: (id) => id === 'productivity', right: (id) => /wage|earnings/.test(id), why: 'output per hour against pay' },
  'europe-us': { left: (id) => /_vs_us$/.test(id), right: (id) => /_vs_us$/.test(id), why: 'levels relative to the US' },
  'immigration-crime': { left: (id) => INDICATORS[id].dimension === 'immigration', right: (id) => INDICATORS[id].dimension === 'crime', why: 'immigration against crime' },
  'immigration-housing': { left: (id) => INDICATORS[id].dimension === 'immigration', right: (id) => INDICATORS[id].dimension === 'housing', why: 'immigration against housing costs' },
  'immigration-growth': { left: (id) => INDICATORS[id].dimension === 'immigration', right: (id) => /gdp|productivity/.test(id), why: 'immigration against output' },
  'immigration-employment': { left: (id) => INDICATORS[id].dimension === 'immigration', right: (id) => /employ/.test(id), why: 'immigration against jobs' },
  'unemployment-crime': { left: (id) => /employ/.test(id), right: (id) => INDICATORS[id].dimension === 'crime', why: 'joblessness against crime' },
  'inequality-crime': { left: (id) => id === 'gini', right: (id) => INDICATORS[id].dimension === 'crime', why: 'inequality against crime' },
}

test('question-to-indicator alignment: every option measures what its question asks', () => {
  for (const rel of RELATIONSHIPS) {
    const s = SPEC[rel.id]
    assert.ok(s, `${rel.id} has no alignment spec`)
    for (const side of ['left', 'right'] as const) {
      const opts = rel[side].options
      assert.ok(opts.includes(rel[side].default), `${rel.id} ${side} default not among options`)
      for (const id of opts) {
        assert.ok(INDICATORS[id], `${rel.id}: unknown indicator ${id}`)
        assert.ok(s[side](id), `${rel.id} ${side} option ${id} does not measure ${s.why}`)
      }
    }
  }
})

test('every selection renders without NaN, undefined or empty headlines', () => {
  let n = 0
  for (const { rel, a, b, c, from, to } of selections()) {
    const ex = explain(rel, a, b, c, from, to)
    const text = JSON.stringify({ ans: ex.ans, keyStats: ex.keyStats, findings: ex.findings, meaning: ex.meaning, limits: ex.shownLimits })
    assert.doesNotMatch(text, /NaN|undefined|Infinity|null%/, `${rel.id} ${a}/${b} ${c} ${from}–${to}`)
    assert.ok(ex.ans?.headline, `${rel.id} ${a}/${b} ${from}–${to}: no headline`)
    assert.ok(ex.shownLimits.length >= 1, `${rel.id} ${a}/${b} ${from}–${to}: no limitation shown`)
    n++
  }
  assert.ok(n > 10000, `only ${n} selections`)
})

test('mathematical consistency: statistics match the underlying series over the stated years', () => {
  for (const { rel, a, b, c, from, to } of selections()) {
    if (c) continue
    const ans = answerFor(rel.id, a, b, c, from, to)
    if (!ans?.period || rel.id === 'europe-us') continue
    const [f, t] = ans.period.split('–').map(Number)
    assert.ok(f >= from && t <= to && f < t, `${rel.id} ${a}/${b}: period ${ans.period} outside ${from}–${to}`)
    const byLabel = Object.fromEntries(ans.stats.map((s) => [s.label, val(s.value)]))
    for (const id of ans.covered) {
      const ch = change(INDICATORS[id], 'ES', f, t)
      if (!ch?.pct) continue
      const st = ans.stats.find((s) => Math.abs(val(s.value) - ch.pct!) < 0.051)
      if (ans.stats.length && !st && ans.covered.length <= 4) {
        // a covered indicator can be detail-only (e.g. average wages when two medians are shown)
        assert.ok(ans.detail.join(' ').length > 0, `${rel.id}: ${id} not reported`)
      }
    }
    const ratio = Object.entries(byLabel).find(([l]) => / relative to /.test(l))
    if (ratio) {
      const [h, i] = ans.stats.map((s) => val(s.value))
      assert.ok(Math.abs(((1 + h / 100) / (1 + i / 100) - 1) * 100 - ratio[1]) < 0.15, `${rel.id} ${a}/${b} ${ans.period}: ratio ${ratio[1]} inconsistent with ${h} and ${i}`)
    }
  }
})

test('headlines agree with the direction of their statistics', () => {
  for (const { rel, a, b, from, to } of selections()) {
    const ans = answerFor(rel.id, a, b, null, from, to)
    if (!ans?.stats.length) continue
    const [x, y] = ans.stats.map((s) => val(s.value))
    const h = ans.headline
    if (rel.id === 'housing-affordability') {
      if (/ rose faster than /.test(h)) assert.ok(x > y, h)
      if (/grew faster than (house prices|rents)/.test(h)) assert.ok(y > x, h)
      if (/moved roughly together/.test(h)) assert.ok(Math.abs(val(ans.stats[2].value)) <= 2, h)
    }
    if (rel.id === 'growth-wages' && !/cannot establish/.test(h)) {
      if (/ fell$/.test(h)) assert.ok(y < 0, `${h} but ${y}`)
      if (/ rose in /.test(h)) assert.ok(y > 0, `${h} but ${y}`)
      if (/economy grew/.test(h)) assert.ok(x > 0, h)
    }
    if (rel.id === 'productivity-wages') {
      if (/fell behind/.test(h)) assert.ok(x - y > 2, h)
      if (/grew faster/.test(h)) assert.ok(y - x > 2, h)
    }
    if (/^In Spain, .* both rose/.test(h)) assert.ok(x > 0 && y > 0, h)
  }
})

test('dynamic headlines: answers change with the period and the selected indicators', () => {
  for (const rel of RELATIONSHIPS) {
    const hs = new Set(PERIODS.map(([f, t]) => answerFor(rel.id, rel.left.default, rel.right.default, null, f, t)?.headline))
    assert.ok(hs.size >= 2, `${rel.id}: headline is the same for every period`)
  }
  const rent = answerFor('housing-affordability', 'rent_real', 'disp_income_real', null, 2000, 2025)!
  assert.match(rent.headline, /rents/)
  const median = answerFor('productivity-wages', 'productivity', 'median_earnings_real', null, 2000, 2025)!
  assert.match(median.headline, /median pay/)
  const hh = answerFor('growth-wages', 'gdp_pc_real', 'median_income_real', null, 2005, 2025)!
  assert.match(hh.headline, /household income/)
})

test('comparable periods: when the answer covers fewer years than the selection, it says so', () => {
  for (const { rel, a, b, from, to } of selections()) {
    const ans = answerFor(rel.id, a, b, null, from, to)
    if (!ans?.period || ans.period === `${from}–${to}`) continue
    const mentioned = ans.detail.some((d) => d.includes(ans.period!)) || ans.meaning.includes(ans.period) || ans.headline.includes(ans.period)
    assert.ok(mentioned || !['growth-wages', 'productivity-wages', 'housing-affordability'].includes(rel.id), `${rel.id} ${a}/${b} ${from}–${to}: covers ${ans.period} without saying so`)
  }
})

test('typical-person verdicts never rest on average wages', () => {
  for (const [from, to] of PERIODS) for (const b of RELATIONSHIPS.find((r) => r.id === 'growth-wages')!.right.options) {
    const ans = answerFor('growth-wages', 'gdp_pc_real', b, null, from, to)!
    if (/cannot establish/.test(ans.headline)) { assert.equal(ans.stats.length, 0); continue }
    assert.match(ans.stats[1].label, /median/, `${from}–${to}: verdict uses ${ans.stats[1].label}`)
  }
})

test('missing evidence is stated, not filled in', () => {
  const none = answerFor('growth-wages', 'gdp_pc_real', 'real_wage', null, 2000, 2003)!
  assert.match(none.headline, /cannot establish/)
  for (const { rel, a, b, c, from, to } of selections()) {
    const ex = explain(rel, a, b, c, from, to)
    if (!ex.findings.length) assert.ok(!TOPIC[rel.id], `${rel.id}: has research but showed none for ${a}/${b} ${from}–${to}`)
    if (rel.id.endsWith('-crime') && ex.crimeInd) {
      const first = ex.findings[0]
      assert.ok(first, `${rel.id} ${b}: nothing in 02`)
      const isGap = /no (causal )?study|conflict|no research/i.test(first.lead)
      assert.ok(isGap || first.refs.length > 0, `${rel.id} ${b}: uncited first finding "${first.lead}"`)
    }
  }
})

test('research relevance: citations resolve, match the country and are labelled honestly', () => {
  for (const { rel, a, b, c, from, to } of selections()) {
    const ex = explain(rel, a, b, c, from, to)
    for (const f of ex.findings) {
      for (const id of f.refs) assert.ok(studyById(id) || REFERENCES[id], `${rel.id}: unknown reference ${id}`)
      const m = f.lead.match(/^In ([A-Z][a-z]+(?: [A-Z][a-z]+)*|the United States): /)
      const geo = m && Object.entries(COUNTRIES).find(([, x]) => x.name === m[1] || x.name === `the ${m[1]}`)?.[0]
      if (geo && f.refs.length) for (const id of f.refs) {
        const s = studyById(id)
        if (s?.geo) assert.ok(s.geo.includes(geo), `${rel.id}: ${id} (${s.geo}) presented as evidence for ${geo}`)
      }
      if (ex.kindLabel(f) === 'causal evidence') assert.ok(f.kind === 'causal' || f.refs.every((id) => studyById(id)?.design === 'causal'), `${rel.id}: "${f.lead}" labelled causal`)
      const y = findingYears(f)
      if (y && (y[0] > from || y[1] < to) && f !== ex.findings[0]) assert.ok(ex.periodLabel(f), `${rel.id}: ${f.lead} covers ${y} without a label`)
    }
    if (rel.id.endsWith('-crime') && ex.crimeInd && ex.findings[0]?.refs.length) {
      const noun = ex.crimeInd.id.replace('crime_', '').replace('_long', '')
      const outcomes = ex.findings[0].refs.flatMap((id) => studyById(id)?.outcomes ?? [])
      const generic = outcomes.length && outcomes.every((o) => o === 'total')
      assert.ok(!generic, `${rel.id}: research on overall crime leads for ${noun}`)
    }
  }
})

test('a phase of research is shown only for years it covers', () => {
  for (const [from, to] of PERIODS) {
    const rel = RELATIONSHIPS.find((r) => r.id === 'housing-affordability')!
    const ex = explain(rel, 'house_price_real', 'disp_income_real', null, from, to)
    const refs = ex.findings[0]?.refs ?? []
    if (to <= 2013) assert.ok(!refs.includes('bde2024'), `${from}–${to} cites the post-2014 report`)
    if (from >= 2014) assert.ok(!refs.includes('intveld2014'), `${from}–${to} cites the 1995–2013 model`)
  }
})

test('series sanity: no gaps hidden inside answer windows and real series are positive', () => {
  for (const id of Object.keys(INDICATORS)) for (const geo of Object.keys(INDICATORS[id].data)) {
    const pts = inRange(series(id, geo), 1990, 2030)
    for (const p of pts) assert.ok(Number.isFinite(p.value), `${id} ${geo} ${p.year}`)
    if (/_real$/.test(id)) for (const p of pts) assert.ok(p.value > 0, `${id} ${geo} ${p.year} not positive`)
  }
})
