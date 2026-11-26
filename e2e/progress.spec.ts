import { test, expect, seedStorage } from './support/fixtures'
import { CHAPTERS, QUIZZES, THEMES, chapterPoints, chapterUrl, formatPoints, mixedStrategy, seedProgress, type PlayableChapter } from './support/data'
import { cardFor, expectScore, kicker, playChapter } from './support/play'

const saved = (page: import('@playwright/test').Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}') as Record<string, { pick: string; edition: string }>, key)
const chaptersOf = (quizId: string) => CHAPTERS.filter(({ quiz }) => quiz.id === quizId)
const others = (chapter: PlayableChapter) => chaptersOf(chapter.quiz.id).filter((other) => other !== chapter)

for (const chapter of CHAPTERS) {
  const n = chapter.questions.length
  test.describe(chapter.name, () => {
    test('saves answers and resumes after a reload and from the homepage', async ({ page }) => {
      await page.goto(chapterUrl(chapter))
      await playChapter(page, chapter, mixedStrategy, { to: 2, checkLayout: false })
      await expect(kicker(page)).toContainText(`Question 3 of ${n}`)
      const stored = await saved(page, chapter.quiz.attemptKey)
      expect(Object.keys(stored).sort()).toEqual(chapter.questions.slice(0, 2).map(({ id }) => id).sort())
      expect(Object.values(stored).every(({ edition }) => edition === chapter.quiz.edition)).toBe(true)

      await page.reload()
      await expect(kicker(page)).toContainText(`Question 3 of ${n}`)
      await expect(page.locator('.ch-rail button').first()).toHaveAttribute('aria-label', /points$/)

      await page.goto('/')
      const card = await cardFor(page, chapter)
      await expect(card).toContainText('Resume quiz')
      if (await page.locator(`.quiz-theme[data-theme="${chapter.quiz.id}"]`).count()) await expect(card).toContainText(`2 of ${n} answered`)
      await card.click()
      await expect(kicker(page)).toContainText(`Question 3 of ${n}`)
    })

    test('keeps the first prediction when going back to a question', async ({ page }) => {
      await page.goto(chapterUrl(chapter))
      await playChapter(page, chapter, () => 'wrong', { to: 1, checkLayout: false })
      await page.getByRole('button', { name: '← Previous' }).click()
      await expect(kicker(page)).toContainText(`Question 1 of ${n}`)
      await expect(page.locator('.ch-reveal-panel')).toBeVisible()
      await expect(page.locator('.ch-verdict')).not.toHaveClass(/is-right/)
      for (const control of await page.locator('.ch-option, .ch-row input, .ch-sliders input[type="range"]').all()) await expect(control).toBeDisabled()
    })

    test('shows results and replays from the first question', async ({ page }) => {
      const neighbours = others(chapter)
      await seedStorage(page, { [chapter.quiz.attemptKey]: { ...seedProgress(chapter, mixedStrategy), ...Object.assign({}, ...neighbours.map((other) => seedProgress(other, 'correct'))) } })
      await page.goto('/')
      const card = await cardFor(page, chapter)
      await expect(card).toContainText('Play again')
      await card.click()
      await expectScore(page, chapterPoints(chapter, mixedStrategy), n)
      await page.getByRole('button', { name: 'Play again' }).click()
      await expect(kicker(page)).toContainText(`Question 1 of ${n}`)
      await expect(page.locator('.ch-reveal-panel')).toHaveCount(0)
      const stored = await saved(page, chapter.quiz.attemptKey)
      for (const { id } of chapter.questions) expect(stored[id], `${id} should be cleared on replay`).toBeUndefined()
      for (const other of neighbours) for (const { id } of other.questions) expect(stored[id], `${id} in another chapter should survive replay`).toBeDefined()
    })

    test('ignores answers saved for an older edition', async ({ page }) => {
      const stale = Object.fromEntries(Object.entries(seedProgress(chapter, 'correct')).map(([id, answer]) => [id, { ...answer, edition: 'old-edition' }]))
      await seedStorage(page, { [chapter.quiz.attemptKey]: stale })
      await page.goto('/')
      await expect(await cardFor(page, chapter)).toContainText(/Not started|Play quiz/)
    })
  })
}

test('progress in one quiz does not affect the others', async ({ page }) => {
  const [first] = CHAPTERS
  await seedStorage(page, { [first.quiz.attemptKey]: seedProgress(first, 'correct') })
  await page.goto('/')
  for (const chapter of CHAPTERS.filter(({ quiz }) => quiz.id !== first.quiz.id)) {
    await expect(await cardFor(page, chapter), chapter.name).toContainText(/Not started|Play quiz/)
  }
  expect(new Set(QUIZZES.map(({ attemptKey }) => attemptKey)).size, 'every quiz needs its own storage key').toBe(QUIZZES.length)
})

for (const quiz of THEMES) {
  const chapters = chaptersOf(quiz.id)
  const points = chapters.reduce((sum, chapter) => sum + chapterPoints(chapter, mixedStrategy), 0)
  const total = chapters.reduce((sum, { questions }) => sum + questions.length, 0)

  test.describe(`${quiz.id} combined results`, () => {
    test('combines every chapter once all are complete', async ({ page }) => {
      await seedStorage(page, { [quiz.attemptKey]: Object.assign({}, ...chapters.map((chapter) => seedProgress(chapter, mixedStrategy))) })
      await page.goto('/')
      const cta = page.locator(`.quiz-theme[data-theme="${quiz.id}"] .theme-results-cta`)
      await expect(cta).toContainText(`${formatPoints(points)}/${total}`)
      await cta.click()
      await expectScore(page, points, total)
      await expect(page.locator('.theme-breakdown li')).toHaveCount(chapters.length)
      for (const [i, chapter] of chapters.entries()) {
        await expect(page.locator('.theme-breakdown li').nth(i)).toContainText(chapter.chapter.title)
      }
    })

    test('waits for every chapter before showing a combined score', async ({ page }) => {
      await seedStorage(page, { [quiz.attemptKey]: seedProgress(chapters[0], 'correct') })
      await page.goto('/')
      await expect(page.locator(`.quiz-theme[data-theme="${quiz.id}"] .theme-results-cta`)).toHaveCount(0)
      await page.goto(`/#/discover?quiz=${quiz.id}&mode=theme`)
      await expect(page.getByText(`Finish every quiz in ${quiz.title}`)).toBeVisible()
      await expect(page.locator('.ch-score')).toHaveCount(0)
    })

    test('offers the combined results after finishing the last chapter', async ({ page }) => {
      const last = chapters.at(-1)!
      const seeded = Object.assign({}, ...chapters.map((chapter) => seedProgress(chapter, 'correct', chapter === last ? last.questions.length - 1 : undefined)))
      await seedStorage(page, { [quiz.attemptKey]: seeded })
      await page.goto(chapterUrl(last))
      await playChapter(page, last, () => 'correct', { from: last.questions.length - 1 })
      await page.locator('.theme-results-cta').first().click()
      await expectScore(page, total, total)
    })
  })
}

// Regression: Life by the numbers Q4 froze for players whose saved pick came from the question's earlier options.
for (const chapter of CHAPTERS) {
  test(`${chapter.name}: a saved pick the question no longer offers doesn't block answering`, async ({ page }) => {
    const n = chapter.questions.length
    await seedStorage(page, { [chapter.quiz.attemptKey]: Object.fromEntries(chapter.questions.map(({ id }) => [id, { pick: 'retired-option', edition: chapter.quiz.edition }])) })
    await page.goto(chapterUrl(chapter))
    await expect(kicker(page)).toContainText(`Question 1 of ${n}`)
    await playChapter(page, chapter, () => 'correct', { checkLayout: false })
    await expectScore(page, n, n)
    expect(Object.values(await saved(page, chapter.quiz.attemptKey)).some(({ pick }) => pick === 'retired-option')).toBe(false)
  })
}

test('Life by the numbers Q4: answering works over a pick saved before the question was revised', async ({ page }) => {
  const world = CHAPTERS.find(({ quiz }) => quiz.id === 'world')!
  await seedStorage(page, { [world.quiz.attemptKey]: { ...seedProgress(world, 'correct', 3), 'immigration-crime': { pick: 'Little or none', edition: world.quiz.edition } } })
  await page.goto(chapterUrl(world, { mode: 'challenge' }))
  await expect(kicker(page)).toContainText('Question 4 of 9')
  await page.getByRole('button', { name: /The group that missed out/ }).click()
  await expect(page.locator('.ch-verdict')).toHaveClass(/is-right/)
  await page.getByRole('button', { name: 'Next question →' }).click()
  await expect(kicker(page)).toContainText('Question 5 of 9')
})
