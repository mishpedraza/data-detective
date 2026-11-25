import type { Page } from '@playwright/test'
import { expect, expectNoHorizontalOverflow } from './fixtures'
import { formatPoints, pickFor, pointsFor, type ChapterQuestion, type PlayableChapter, type Strategy } from './data'

const max = (question: ChapterQuestion) => ('max' in question && question.max) || 100

/** Completes an unscored warm-up exercise the way a player would. */
async function playWarmup(page: Page, question: ChapterQuestion) {
  if (question.kind !== 'choice' || !question.warmup) return
  const warm = page.locator('.ch-warmup')
  const { kind } = question.warmup
  if (kind === 'choice') await warm.getByRole('group', { name: 'Your choice' }).getByRole('button').first().click()
  if (kind === 'week') {
    await warm.getByRole('button', { name: 'You: work Mon morning' }).click()
    await warm.getByRole('button', { name: 'Your partner: work Mon morning' }).click()
    await warm.getByRole('button', { name: 'Continue →' }).click()
  }
  if (kind === 'holiday') {
    await warm.getByRole('group', { name: 'Short list of 4 destinations' }).getByRole('button').first().click()
    await warm.getByRole('group', { name: 'Long list of 16 destinations' }).getByRole('button').first().click()
    await warm.getByRole('group', { name: 'Which list felt better' }).getByRole('button').first().click()
  }
  if (kind === 'words') {
    await expect(warm.getByRole('list', { name: 'Word list' })).toBeVisible()
    await warm.getByRole('button', { name: 'I’ve read them →' }).click()
    await warm.getByRole('button', { name: 'Yes, it was there' }).click()
  }
}

/** Enters `pick` through the question's controls. */
export async function answer(page: Page, question: ChapterQuestion, pick: string) {
  if (question.kind === 'choice') {
    await playWarmup(page, question)
    const main = pick.split('|')[0]
    const index = question.options.findIndex(({ id }) => id === main)
    const button = page.getByRole('group', { name: 'Your prediction' }).getByRole('button').nth(index)
    await expect(button).toContainText(question.options[index].label)
    await button.click()
    return
  }
  if (question.kind === 'rows') {
    const sides = pick.split(',')
    const rows = page.locator('fieldset.ch-row')
    await expect(rows).toHaveCount(question.rows.length)
    const button = page.locator('.ch-rows .ch-reveal')
    for (const [i, side] of sides.entries()) {
      await expect(button).toBeDisabled()
      await rows.nth(i).locator(`label:has(input[value="${side}"])`).click()
    }
    await button.click()
    return
  }
  const values = pick.split(',').map(Number)
  const sliders = page.locator('.ch-sliders input[type="range"]')
  await expect(sliders).toHaveCount(values.length)
  const button = page.locator('.ch-sliders .ch-reveal')
  for (const [i, value] of values.entries()) {
    await expect(button).toBeDisabled()
    await expect(sliders.nth(i)).toHaveAttribute('max', String(max(question)))
    // A first touch sets the slider (to its middle), as it does for players; then move it to the value.
    await sliders.nth(i).click()
    await sliders.nth(i).fill(String(value))
    await expect(sliders.nth(i)).toHaveValue(String(value))
  }
  await button.click()
}

/** Checks the reveal: finding, a rendered visualization, takeaway, verdict, points and sources. */
export async function expectReveal(page: Page, question: ChapterQuestion, points: number) {
  const panel = page.locator('.ch-reveal-panel')
  await expect(panel).toBeVisible()
  await expect(panel.locator('.ch-finding')).toHaveText(question.finding)
  await expect(panel.locator('.ch-takeaway')).toHaveText(question.takeaway)
  const visual = panel.locator('.ch-visual')
  await expect(visual).toBeVisible()
  const box = await visual.boundingBox()
  expect(box?.height ?? 0, `${question.id}: visualization has no height`).toBeGreaterThan(24)
  expect(await visual.locator('svg, figure, div, ul, ol, table, canvas, img').count(), `${question.id}: visualization is empty`).toBeGreaterThan(0)
  await expect(visual).not.toContainText(/NaN|undefined|Infinity|\[object Object\]/)
  const verdict = page.locator('.ch-verdict')
  await expect(verdict).toHaveClass(points === 1 ? /is-right/ : points > 0 ? /is-partial/ : /is-wrong/)
  await expect(verdict.locator('.ch-points')).toHaveText(`+${formatPoints(points)} ${points === 1 ? 'point' : 'points'}`)
  if (question.kind === 'choice' && question.options.length) {
    await expect(page.getByRole('group', { name: 'Your prediction' }).getByLabel('Correct answer')).toHaveCount(1)
  }
  if (question.evidence) {
    await panel.locator('details.ch-evidence summary').click()
    for (const url of [question.evidence.url, ...(question.evidence.more ?? []).map((m) => m.url)]) {
      await expect(panel.locator(`details.ch-evidence a[href="${url}"]`).first()).toBeAttached()
    }
  }
}

export const kicker = (page: Page) => page.locator('.discovery-kicker')

/** Plays questions from the current one to the results, returning the points expected from the app's own scoring. */
export async function playChapter(page: Page, chapter: PlayableChapter, strategy: (i: number) => Strategy, { from = 0, to = chapter.questions.length, checkLayout = true } = {}) {
  let total = 0
  for (let i = from; i < to; i++) {
    const question = chapter.questions[i]
    await expect(kicker(page)).toContainText(`Question ${i + 1} of ${chapter.questions.length}`)
    await expect(page.locator('h1')).toHaveText(question.question)
    const pick = pickFor(question, strategy(i))
    const points = pointsFor(question, pick)
    total += points
    await answer(page, question, pick)
    await expectReveal(page, question, points)
    if (checkLayout) await expectNoHorizontalOverflow(page, `on ${chapter.name}/${question.id} reveal`)
    await page.locator('.challenge-continue').click()
  }
  return total
}

export async function expectScore(page: Page, points: number, of: number) {
  await expect(page.locator('.ch-score')).toHaveAttribute('aria-label', `${formatPoints(points)} out of ${of} points`)
}

/** The homepage card (or featured hero button) that opens a chapter. */
export async function cardFor(page: Page, chapter: PlayableChapter) {
  const section = page.locator(`.quiz-theme[data-theme="${chapter.quiz.id}"]`)
  if (await section.count()) return section.locator('.quiz-card').nth(chapter.index)
  return page.locator('.quiz-show-button')
}
