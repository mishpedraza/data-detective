import type { Page } from '@playwright/test'
import { test, expect, seedStorage } from './support/fixtures'
import { CHAPTERS, THEMES, chapterPoints, chapterUrl, formatPoints, mixedStrategy, seedProgress } from './support/data'
import { SITE_URL } from '../src/lib/site'
import { kicker } from './support/play'
import { SHARE_MESSAGE, inviteMessage } from '../src/lib/scorecard'

interface Shared { title?: string; text?: string; url?: string; files: number }

/** Replaces the share sheet and clipboard so tests can read what would be shared. */
async function stubSharing(page: Page, mode: 'native' | 'none' | 'cancel' | 'error') {
  await page.addInitScript((mode) => {
    const w = window as unknown as { __shared: unknown[]; __copied: string[] }
    w.__shared = []
    w.__copied = []
    delete (Navigator.prototype as { share?: unknown }).share
    if (mode !== 'none') {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          w.__shared.push({ title: data.title, text: data.text, url: data.url, files: data.files?.length ?? 0 })
          if (mode === 'cancel') throw new DOMException('Share cancelled', 'AbortError')
          if (mode === 'error') throw new DOMException('Share failed', 'NotAllowedError')
        },
      })
    }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { w.__copied.push(text) } } })
  }, mode)
}
const shared = (page: Page) => page.evaluate(() => (window as unknown as { __shared: Shared[] }).__shared)
const copied = (page: Page) => page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)

function expectShareUrl(url: string | undefined, params: Record<string, string>) {
  expect(url, 'shared URL').toBeDefined()
  const parsed = new URL(url!)
  expect(parsed.origin + parsed.pathname).toBe(SITE_URL)
  const query = new URLSearchParams(parsed.hash.split('?')[1])
  expect(parsed.hash.startsWith('#/discover?')).toBe(true)
  for (const [key, value] of Object.entries(params)) expect(query.get(key), key).toBe(value)
  expect([...query.keys()].filter((key) => !['quiz', 'chapter', 'from', 'card'].includes(key)), 'link carries no answers or score').toEqual([])
}

/** Reads the message and link a WhatsApp button would send. */
async function whatsapp(scope: Page | import('@playwright/test').Locator) {
  const link = scope.getByRole('link', { name: 'Share on WhatsApp' })
  await expect(link).toHaveAttribute('target', '_blank')
  const href = new URL((await link.getAttribute('href'))!)
  expect(href.origin + href.pathname).toBe('https://wa.me/')
  const text = href.searchParams.get('text')!
  const at = text.lastIndexOf(' https://')
  return { message: text.slice(0, at), url: text.slice(at + 1) }
}

for (const chapter of CHAPTERS) {
  const n = chapter.questions.length
  const points = chapterPoints(chapter, mixedStrategy)
  const expected = `I scored ${formatPoints(points)}/${n} on “${chapter.chapter.title}”. ${SHARE_MESSAGE}`
  const params = { quiz: chapter.quiz.id, ...(chapter.quiz.chapters.length > 1 && { chapter: chapter.chapter.id }), from: 'share', card: 'quiz' }
  const openResults = async (page: Page) => {
    await seedStorage(page, { [chapter.quiz.attemptKey]: seedProgress(chapter, mixedStrategy) })
    await page.goto(chapterUrl(chapter, { mode: 'results' }))
  }

  test.describe(`${chapter.name} sharing`, () => {
    test('Share this quiz: WhatsApp carries the score and a direct quiz link', async ({ page }) => {
      await stubSharing(page, 'native')
      await openResults(page)
      await expect(page.getByRole('heading', { name: 'Share this quiz' })).toBeVisible()
      const { message, url } = await whatsapp(page)
      expect(message).toBe(expected)
      expectShareUrl(url, params)
    })

    test('Copy link copies only the quiz link and confirms', async ({ page }) => {
      await stubSharing(page, 'native')
      await openResults(page)
      await page.getByRole('button', { name: 'Copy link' }).click()
      await expect.poll(() => copied(page)).toHaveLength(1)
      expectShareUrl((await copied(page))[0], params)
      await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible()
      expect(await shared(page)).toEqual([])
    })

    test('More options opens the share sheet with the score and link, without an image', async ({ page }) => {
      await stubSharing(page, 'native')
      await openResults(page)
      await page.getByRole('button', { name: 'More options' }).click()
      await expect.poll(() => shared(page)).toHaveLength(1)
      const [share] = await shared(page)
      expect(share.text).toBe(expected)
      expect(share.files).toBe(0)
      expectShareUrl(share.url, params)
      expect(await copied(page)).toEqual([])
    })

    test('hides More options when there is no share sheet', async ({ page }) => {
      await stubSharing(page, 'none')
      await openResults(page)
      await expect(page.getByRole('link', { name: 'Share on WhatsApp' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'More options' })).toHaveCount(0)
    })

    test('does nothing when the share sheet is cancelled', async ({ page }) => {
      await stubSharing(page, 'cancel')
      await openResults(page)
      await page.getByRole('button', { name: 'More options' }).click()
      await expect.poll(() => shared(page)).toHaveLength(1)
      expect(await copied(page)).toEqual([])
    })

    test('copies the link when the share sheet fails', async ({ page }) => {
      await stubSharing(page, 'error')
      await openResults(page)
      await page.getByRole('button', { name: 'More options' }).click()
      await expect.poll(() => copied(page)).toHaveLength(1)
      expectShareUrl((await copied(page))[0], params)
    })

    test('invites a friend mid-quiz without revealing a score', async ({ page }) => {
      await stubSharing(page, 'native')
      await page.goto(chapterUrl(chapter))
      await page.locator('summary', { hasText: 'Share quiz' }).click()
      const pop = page.locator('.quiz-invite-pop')
      await expect(pop.getByRole('heading', { name: 'Share this quiz' })).toBeVisible()
      const invite = inviteMessage(chapter.chapter.title)
      const { message, url } = await whatsapp(pop)
      expect(message).toBe(invite)
      expectShareUrl(url, { ...params, card: 'invite' })
      await pop.getByRole('button', { name: 'More options' }).click()
      await expect.poll(() => shared(page)).toHaveLength(1)
      const [share] = await shared(page)
      expect(share.title).toBe(chapter.chapter.title)
      expect(share.text).toBe(invite)
      expectShareUrl(share.url, { ...params, card: 'invite' })
      await pop.getByRole('button', { name: 'Copy link' }).click()
      await expect.poll(() => copied(page)).toHaveLength(1)
      expectShareUrl((await copied(page))[0], { ...params, card: 'invite' })
    })

    test('a shared link opens the quiz ready to play', async ({ page }) => {
      const url = new URL(SITE_URL)
      url.hash = `/discover?${new URLSearchParams(params)}`
      await page.goto(`/${url.hash}`)
      await expect(kicker(page)).toContainText(`Question 1 of ${n}`)
    })
  })
}

for (const quiz of THEMES) {
  test(`${quiz.id}: shares the combined score`, async ({ page }) => {
    const chapters = CHAPTERS.filter((c) => c.quiz.id === quiz.id)
    await stubSharing(page, 'native')
    await seedStorage(page, { [quiz.attemptKey]: Object.assign({}, ...chapters.map((c) => seedProgress(c, 'correct'))) })
    await page.goto(`/#/discover?quiz=${quiz.id}&mode=theme`)
    const { message, url } = await whatsapp(page)
    expect(message).toContain(`across all ${chapters.length} quizzes`)
    expectShareUrl(url, { quiz: quiz.id, from: 'share', card: 'theme' })
    await page.getByRole('button', { name: 'More options' }).click()
    await expect.poll(() => shared(page)).toHaveLength(1)
    const [share] = await shared(page)
    expect(share.text).toContain(`across all ${chapters.length} quizzes`)
    expect(share.files).toBe(0)
    expectShareUrl(share.url, { quiz: quiz.id, from: 'share', card: 'theme' })
  })
}
