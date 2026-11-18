import { catalog } from './catalog.mjs'
import { dimensions } from './editorial.mjs'

const issue = (problem, whyItMatters, evidence, change, verify, impact, severity, researchRisk, effort, confidence) => ({
  problem, whyItMatters, evidence, change, verify, impact, severity, researchRisk, effort, confidence,
})
const weight = ({ impact, severity, researchRisk, effort, confidence }) =>
  3 * researchRisk + 2 * severity + 2 * impact + confidence - effort

export function recommendations({ runs, research, editorial }) {
  const candidates = []
  for (const row of research.findings.filter(({ status }) => status === 'PROBLEM')) {
    candidates.push(issue(`Resolve a research problem in ${row.id}`, 'An unsupported claim can invalidate the reveal.',
      `${row.claim} ${row.evidence}`, 'Reconcile the underlying source and scope before changing or publishing the claim.',
      'Repeat the primary-source check and have an editor review the causal wording.', 9, 10, 10, 4, 9))
  }
  const failed = new Map()
  for (const { device, checks } of runs) for (const row of checks.filter(({ status }) => status === 'FAIL')) {
    const entries = failed.get(row.id) ?? []
    entries.push(`${device}: ${row.detail}${row.screenshot ? ` (${row.screenshot})` : ''}`)
    failed.set(row.id, entries)
  }
  for (const [id, entries] of failed) {
    if (id === 'site-access') continue
    candidates.push(issue(`Fix the ${id} regression`, 'The browser could not complete this part of the reader experience as specified.',
      entries.join(' / '), 'Reproduce this check and fix the specific action or missing output.',
      'Run both viewport checks against the change and inspect the failure screenshot.', 9, 9, 5, 4, 8))
  }
  const uncovered = research.findings.filter(({ status }) => status === 'UNVERIFIED')
  if (uncovered.length) candidates.push(issue('Close independent research-verification gaps',
    'A resolved citation can still support a different population, period or claim.',
    `${uncovered.length} verification entries remain open across ${new Set(uncovered.map(({ id }) => id)).size} stories. See Research integrity.`,
    'Start with the main plotted values and causal wording. Add a reproducible calculation or a primary-source excerpt for each.',
    'A second reviewer should be able to reproduce the values and confirm what the primary source establishes.', 8, 7, 9, 6, 10))

  const missing = runs.flatMap(({ device, answers }) => answers.filter(({ evidenceRows }) => evidenceRows === 0)
    .map(({ id, screenshot }) => `${device} ${id} (${screenshot})`))
  if (missing.length) candidates.push(issue('Add a visual explanation where a quiz reveal has only prose',
    'A compact visual would connect the verdict to evidence readers can compare at a glance.',
    missing.join(' / '), 'Use the existing study to choose a directly relevant comparison. Do not assign numeric shares where the paper only supports a qualitative comparison.',
    'Check that the visual explains the quiz answer, cites the underlying study and fits the mobile reveal.', 8, 5, 5, 4, 9))

  const mobile = runs.find(({ device }) => device === 'mobile')
  const below = mobile?.answers.filter(({ nextBelowFold }) => nextBelowFold) ?? []
  if (below.length) candidates.push(issue('Measure findability of Next question on mobile',
    'Readers may finish the reveal without noticing where to continue, especially on shorter screens.',
    `The continuation was below the viewport immediately after answering in ${below.length} of ${mobile.answers.length} captured reveals. Example: ${below[0].screenshot}. This is a layout observation; visitor friction has not been measured.`,
    'Run a short mobile task test. If readers miss the action, tighten spacing around it while preserving the evidence.',
    'Measure first-attempt continuation and time to find Next question before and after.', 6, 4, 1, 3, 5))

  for (const story of editorial.stories.filter(({ status }) => status === 'AI OPINION')) {
    for (const suggestion of story.recommendations) {
      candidates.push({ ...suggestion, problem: `Editorial hypothesis for ${story.id}: ${suggestion.problem}`,
        confidence: Math.min(suggestion.confidence, 6) })
    }
  }
  return candidates.sort((a, b) => weight(b) - weight(a)).slice(0, 3)
}

const cell = (value = '') => String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
const link = (file) => file ? `[Screenshot](${file})` : '—'
export function renderReport(report) {
  const { generatedAt, base, mode, runs, browserFailure, faultTests, research, editorial, priority } = report
  const passed = runs.flatMap(({ checks }) => checks).filter(({ status }) => status === 'PASS').length
  const failed = runs.flatMap(({ checks }) => checks).filter(({ status }) => status === 'FAIL').length
  const lines = [
    '# Detective Lab review', '', `Generated ${generatedAt} · ${mode} · ${base ?? 'site unavailable'}`, '',
    '## Executive summary', '',
    `Browser checks passed: **${passed}**. Failed: **${failed}**. Research gate: **${research.gate}**.`,
    `Editorial model: **${editorial.status}**. ${editorial.detail}`,
    'Browser observations are tested on the reviewed build. Editorial scores, when present, are model opinions.',
    ...(browserFailure ? [`Browser setup failure: ${browserFailure}`] : []),
    '', '## Quiz experience and visual review', '',
    '| Device | Check | Status | Detail | Screenshot |', '| --- | --- | --- | --- | --- |',
  ]
  for (const { device, checks, screenshots } of runs) {
    for (const row of checks) lines.push(`| ${device} | ${row.id} | ${row.status} | ${cell(row.detail)} | ${link(row.screenshot)} |`)
    const overview = screenshots.filter((file) => /-(welcome|browse|results)\.png$/.test(file))
    lines.push(`| ${device} | Entry, browse and results | — | — | ${overview.map(link).join(' · ')} |`)
  }
  lines.push('', '## Investigation-by-investigation review')
  for (const story of catalog) {
    lines.push('', `### ${story.question}`, '', `Quiz prompt: ${story.interaction?.label ?? 'Unavailable'}`, '')
    for (const run of runs) {
      const quiz = run.answers.find(({ id }) => id === story.id)
      const investigation = run.investigations.find(({ id }) => id === story.id)
      const quizSummary = quiz ? `Quiz ${quiz.evidenceRows} evidence rows, ${quiz.citations.length} citations, ${quiz.overflow}px horizontal overflow. ${link(quiz.screenshot)}` : 'Quiz observation unavailable.'
      const investigationSummary = investigation ? `Investigation ${investigation.citationCount} lead figure citations, ${investigation.overflow}px horizontal overflow. ${link(investigation.screenshot)}` : 'Investigation observation unavailable.'
      lines.push(`- **${run.device}**. ${quizSummary} ${investigationSummary}`)
    }
    const opinion = editorial.stories.find(({ id }) => id === story.id)
    if (opinion?.status === 'AI OPINION') {
      lines.push('', '| Editorial dimension | Score / 10 | Reasoning | Observed evidence |', '| --- | --- | --- | --- |')
      for (const dim of dimensions) {
        const { score, reasoning, evidence } = opinion.dimensions[dim]
        lines.push(`| ${dim} | ${score} | ${cell(reasoning)} | ${cell(evidence)} |`)
      }
      for (const rec of opinion.recommendations) lines.push('', `- **Editorial recommendation.** ${rec.problem} ${rec.whyItMatters} Evidence: ${rec.evidence} Change: ${rec.change} Verify: ${rec.verify}`)
    } else lines.push('', `Editorial scores unavailable. ${opinion?.detail ?? editorial.detail}`)
  }

  lines.push('', '## Research integrity', '',
    'VERIFIED requires a primary source retrieved in this run. SUPPORTED BY REPOSITORY records local consistency or attribution only. UNVERIFIED means the check was unavailable or insufficient. PROBLEM identifies a specific inconsistency. OPEN and BLOCKED cannot be offset by editorial scores.',
    '', '| Story | Status | Claim | Evidence |', '| --- | --- | --- | --- |')
  for (const row of research.findings) {
    const source = row.url ? ` [Primary source](${row.url})` : ''
    lines.push(`| ${row.id} | ${row.status} | ${cell(row.claim)} | ${cell(row.evidence)}${source} |`)
  }

  lines.push('', '## Top recommended improvements', '')
  if (!priority.length) lines.push('No actionable issue was identified with the available evidence.')
  for (const [index, item] of priority.entries()) {
    lines.push(`### ${index + 1}. ${item.problem}`, '', item.whyItMatters,
      `Evidence: ${item.evidence}`, `Change: ${item.change}`, `Verify: ${item.verify}`,
      `Impact ${item.impact}/10 · severity ${item.severity}/10 · research risk ${item.researchRisk}/10 · effort ${item.effort}/10 · confidence ${item.confidence}/10.`, '')
  }

  lines.push('## Unresolved questions', '',
    '- Automated checks cover named flows and three specific primary-source checks. The interpretation and limitations of other claims need independent review.',
    '- Chromium mobile emulation does not replace a real device or Safari check. Below-fold observations do not measure actual visitor behaviour.',
    '- Site-access failures indicate a browser or network blocker. Treat subsequent checks as unavailable, rather than product regressions.',
    '- The scoring oracle comes from the checkout. A deployed build with different content can fail even if its own app is working.')
  for (const story of editorial.stories) for (const gap of story.unresolved ?? []) lines.push(`- **${story.id}**. ${gap}`)
  if (faultTests.length) {
    lines.push('', '## Reviewer self-test', '')
    for (const { fault, detected } of faultTests) lines.push(`- ${fault}: ${detected ? 'detected' : 'not detected'}`)
  }
  return lines.join('\n') + '\n'
}
