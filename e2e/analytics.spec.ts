import { test, expect, CONSENT_KEY, type Captured } from './support/fixtures'
import { CHAPTERS, chapterUrl } from './support/data'
import { cardFor, playChapter } from './support/play'

// The shortest chapter keeps these runs quick; event names come from the app, so they apply to every quiz.
const chapter = [...CHAPTERS].sort((a, b) => a.questions.length - b.questions.length)[0]
const events = (sent: Captured[]) => sent.map(({ event }) => event)
const banner = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Analytics choice' })

test.describe('without an analytics choice', () => {
  test.use({ consent: null })

  test('asks first and sends nothing until analytics are allowed', async ({ page, analytics }) => {
    await page.goto('/')
    await expect(banner(page)).toBeVisible()
    await page.goto(chapterUrl(chapter))
    await playChapter(page, chapter, () => 'correct', { to: 1, checkLayout: false })
    await page.waitForTimeout(300)
    expect(events(analytics)).toEqual([])
  })

  test('"No thanks" is remembered and keeps analytics off', async ({ page, analytics }) => {
    await page.goto('/')
    await banner(page).getByRole('button', { name: 'No thanks' }).click()
    await expect(banner(page)).toHaveCount(0)
    expect(await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY)).toBe('no')
    await page.reload()
    await expect(banner(page)).toHaveCount(0)
    await (await cardFor(page, chapter)).click()
    await playChapter(page, chapter, () => 'correct', { checkLayout: false })
    await page.waitForTimeout(300)
    expect(events(analytics)).toEqual([])
  })

  test('"Allow analytics" sends anonymous gameplay events', async ({ page, analytics, baseURL }) => {
    await page.goto('/')
    await banner(page).getByRole('button', { name: 'Allow analytics' }).click()
    await expect(banner(page)).toHaveCount(0)
    expect(await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY)).toBe('yes')
    await expect.poll(() => events(analytics)).toContain('analytics_consent_granted')

    await (await cardFor(page, chapter)).click()
    await playChapter(page, chapter, () => 'correct', { checkLayout: false })
    await page.locator('.ch-score').waitFor()
    await expect.poll(() => events(analytics)).toContain('quiz_completed')

    const names = events(analytics)
    for (const name of ['page_viewed', 'quiz_selected', 'quiz_started', 'quiz_question_answered', 'discovery_revealed', 'quiz_completed']) expect(names, name).toContain(name)
    expect(names.filter((name) => name === 'quiz_question_answered')).toHaveLength(chapter.questions.length)

    const visitor = await page.evaluate(() => localStorage.getItem('data-detective.analytics-id.v1'))
    expect(visitor).toMatch(/^[0-9a-f-]{36}$/)
    for (const sent of analytics) {
      expect(sent.api_key, sent.event).toMatch(/^phc_/)
      expect(sent.distinct_id, sent.event).toBe(visitor)
      expect(sent.properties.app_name, sent.event).toBe('data_detective')
      expect(String(sent.properties.$current_url), sent.event).toContain(baseURL!)
      for (const [key, value] of Object.entries(sent.properties)) {
        expect(typeof value === 'string' && /@|\bpassword\b/i.test(value), `${sent.event}.${key} looks personal`).toBe(false)
      }
    }
    const completed = analytics.find(({ event }) => event === 'quiz_completed')!
    expect(completed.properties).toMatchObject({ quiz_id: chapter.quiz.id, score: chapter.questions.length, max_points: chapter.questions.length })
  })
})

test.describe('with analytics allowed', () => {
  test.use({ consent: 'yes' })

  test('tracks sharing a result', async ({ page, analytics }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} }))
    await page.goto(chapterUrl(chapter))
    await playChapter(page, chapter, () => 'correct', { checkLayout: false })
    await page.getByRole('button', { name: 'Challenge a friend' }).click()
    await expect.poll(() => events(analytics)).toContain('scorecard_shared')
    for (const name of ['share_clicked', 'scorecard_share_opened']) expect(events(analytics)).toContain(name)
  })

  test('tracks opening a shared link', async ({ page, analytics }) => {
    await page.goto(chapterUrl(chapter, { from: 'share', card: 'quiz' }))
    await expect.poll(() => events(analytics)).toContain('shared_link_visited')
  })
})

test.describe('with analytics declined', () => {
  test.use({ consent: 'no' })

  test('sends nothing during a full game and share', async ({ page, analytics }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} }))
    await page.goto(chapterUrl(chapter))
    await playChapter(page, chapter, () => 'correct', { checkLayout: false })
    await page.getByRole('button', { name: 'Challenge a friend' }).click()
    await page.waitForTimeout(300)
    expect(events(analytics)).toEqual([])
  })
})
