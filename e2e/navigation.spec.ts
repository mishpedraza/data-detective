import { test, expect, seedStorage } from './support/fixtures'
import { CHAPTERS, chapterUrl, seedProgress } from './support/data'
import { kicker } from './support/play'

test('the header is just the brand, with no Quizzes, Investigate or Explore tabs', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('header.nav')
  await expect(header.getByRole('link')).toHaveCount(1)
  await expect(header.getByRole('link', { name: 'Data Detective' })).toBeVisible()
  for (const name of ['Quizzes', 'Investigate', 'Explore']) await expect(header.getByRole('link', { name, exact: true })).toHaveCount(0)
})

for (const path of ['/#/investigate', '/#/investigate?r=immigration-crime', '/#/explore']) {
  test(`existing link ${path} still opens`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('main')).not.toBeEmpty()
    await expect(page.locator('header.nav')).toBeVisible()
  })
}

test('Explore why opens the investigation and returns to the same question with progress kept', async ({ page }) => {
  const world = CHAPTERS.find(({ quiz }) => quiz.id === 'world')!
  const index = world.questions.findIndex(({ id }) => id === 'immigration-crime')
  await seedStorage(page, { [world.quiz.attemptKey]: seedProgress(world, 'correct', index + 1) })
  await page.goto(chapterUrl(world, { q: 'immigration-crime', mode: 'challenge' }))
  await page.getByRole('link', { name: /Explore why/ }).click()
  await expect(page).toHaveURL(/#\/investigate\?/)
  await page.reload()
  await expect(page).toHaveURL(/q=immigration-crime/)
  await page.getByRole('link', { name: '← Back to the quiz' }).click()
  await expect(kicker(page)).toContainText(`Question ${index + 1} of ${world.questions.length}`)
  await expect(page.locator('.ch-verdict')).toHaveClass(/is-right/)
  await page.getByRole('button', { name: 'Next question →' }).click()
  await expect(kicker(page)).toContainText(`Question ${index + 2} of ${world.questions.length}`)
})

test('an old link to a revised question opens its replacement and shows the reveal', async ({ page }) => {
  const money = CHAPTERS.find(({ chapter }) => chapter.id === 'money-ambition-power')!
  await seedStorage(page, { [money.quiz.attemptKey]: seedProgress(money, 'correct', money.questions.length - 1) })
  await page.goto(`/#/discover?quiz=${money.quiz.id}&q=mp-power&mode=challenge`)
  await expect(kicker(page)).toContainText(`Question ${money.questions.length} of ${money.questions.length}`)
  await page.getByRole('group', { name: 'Your prediction' }).getByRole('button').first().click()
  await expect(page.locator('.ch-reveal-panel')).toBeVisible()
  await expect(kicker(page)).toContainText(`Question ${money.questions.length} of`)
})
