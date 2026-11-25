import { test, expect } from './support/fixtures'
import { CHAPTERS, chapterUrl, evidenceLinks } from './support/data'
import { cardFor, kicker } from './support/play'
import { expectNoHorizontalOverflow } from './support/fixtures'

test('the suite reaches every question type and warm-up', () => {
  const questions = CHAPTERS.flatMap(({ questions }) => questions)
  const kinds = new Set(questions.map(({ kind }) => kind))
  const warmups = new Set(questions.flatMap((q) => (q.kind === 'choice' && q.warmup ? [q.warmup.kind] : [])))
  test.info().annotations.push({ type: 'coverage', description: `${CHAPTERS.length} chapters, ${questions.length} questions; kinds: ${[...kinds].join(', ')}; warm-ups: ${[...warmups].join(', ')}` })
  for (const kind of ['choice', 'rows', 'sliders', 'estimate']) expect(kinds, kind).toContain(kind)
  expect(new Set(questions.map(({ id }) => id)).size, 'question ids are unique').toBe(questions.length)
})

test('every research link is a well-formed https URL', () => {
  for (const [url, usedBy] of evidenceLinks()) {
    const parsed = new URL(url)
    expect(parsed.protocol, `${url} (${usedBy.join(', ')})`).toBe('https:')
    if (parsed.hostname === 'doi.org') expect(parsed.pathname, url).toMatch(/^\/10\.\d{4,}\/\S+$/)
  }
})

test('the homepage lists every playable chapter and fits the screen', async ({ page }) => {
  await page.goto('/')
  for (const chapter of CHAPTERS) await expect(await cardFor(page, chapter), chapter.name).toBeVisible()
  await expectNoHorizontalOverflow(page, 'on the homepage')
})

for (const chapter of CHAPTERS) {
  test(`${chapter.name}: the homepage card opens the first question directly`, async ({ page }) => {
    await page.goto('/')
    await (await cardFor(page, chapter)).click()
    await expect(kicker(page)).toContainText(`Question 1 of ${chapter.questions.length}`)
    await expect(page.locator('h1')).toHaveText(chapter.questions[0].question)
    await expectNoHorizontalOverflow(page, `on ${chapter.name} question 1`)
    expect(page.url()).toContain(chapterUrl(chapter).slice(1).split('?')[0])
  })
}

test('the sitemap and robots.txt are served', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).toContain('<urlset')
  expect((await request.get('/robots.txt')).status()).toBe(200)
})
